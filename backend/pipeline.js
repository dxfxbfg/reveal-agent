/**
 * reveal-agent 2-Stage 流水线（v3 — 精简架构）
 *
 * Stage 1 — 研究: requirement-analyzer（模式检测）+ info-collector（资料收集）
 * Stage 2 — 生成: slide-generator（一次性接收全部上下文，自由规划+代码生成）
 *
 * 砍掉 visual-designer 和 synthesizer：
 *   - 结构规划由 LLM 在生成阶段内部完成（质量远高于外部 JSON 传递）
 *   - 视觉设计也由 LLM 在生成时自主决策（不被上游 JSON 绑死）
 * 保留 requirement-analyzer（判断 new/modify + presentation/PM 模式）和
 *   info-collector（web search + 文件分析，真实增值）
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { resolveConfig } from './quality-router.js';
import { run as runRequirementAnalyzer } from '../agents/requirement-analyzer/index.js';
import { run as runInfoCollector } from '../agents/info-collector/index.js';
import { run as runSlideGenerator } from '../agents/code-generator/index.js';
import { initTools } from './tools/definitions/index.js';
import { runFeedbackLoop } from './feedback-loop.js';
import { logger } from './utils/logger.js';

// ─── Data Analytics ─────────────────────────────────────────
import { getDataAnalyticsContext } from '../agents/data-analytics/index.js';

const log = logger.child('pipeline');

export async function runPipeline({ sessionId, message, history = [], files = [], qualityTier = 'normal', currentHtml = '', modelConfig = null, broadcast = null, pageCount = 10, enableFeedback = true }) {
  // 自适应页数：传 0 表示让 AI 自己判断
  const autoPage = pageCount === 0;
  if (autoPage) pageCount = 10;
  log.info('start', { sessionId, quality: qualityTier, pageCount, autoPage, feedback: enableFeedback });

  if (broadcast) broadcast({ type: 'agent_step', step: 'init', message: '初始化...' });

  initTools();

  const config = resolveConfig(qualityTier);
  log.debug('config resolved', { config });

  // ─── Stage 1: 研究阶段 ────────────────────────────────────
  // Agent 1: 需求分析（判断 new/modify + 模式检测）
  let analyzerResult = null;
  if (config.agents.includes('requirement-analyzer')) {
    log.info('stage 1: requirement-analyzer');
    if (broadcast) broadcast({ type: 'agent_step', step: 'requirement-analyzer', message: '分析需求...' });
    analyzerResult = await runRequirementAnalyzer({ message, history, currentHtml, files, modelConfig });
    log.info('stage 1 done', { action: analyzerResult.action, mode: analyzerResult.mode });
  } else {
    analyzerResult = {
      action: currentHtml && currentHtml.includes('<section') ? 'modify' : 'new',
      summary: message,
      type: 'unknown',
      mode: 'presentation',
      searchQueries: [],
    };
  }

  // 修改模式：直接调 code-generator 局部修改
  if (analyzerResult.action === 'modify' && currentHtml && currentHtml.includes('<section')) {
    return runModifyMode({ sessionId, message, currentHtml, config, modelConfig, broadcast, analyzerResult, pageCount, enableFeedback });
  }

  // ─── Agent 2: 资料收集（由需求分析 agent 决定是否需要网络搜索）───
  let collectedInfo = null;
  if (config.agents.includes('info-collector') && analyzerResult.needsWebSearch) {
    log.info('stage 2: info-collector (web search needed)');
    if (broadcast) broadcast({ type: 'agent_step', step: 'info-collector', message: '收集资料...' });
    collectedInfo = await runInfoCollector({
      requirements: analyzerResult.summary,
      searchQueries: analyzerResult.searchQueries || [],
      files,
      broadcast,
      modelConfig,
    });
    log.info('stage 2 done', { sources: collectedInfo.sources?.length || 0 });
  } else {
    collectedInfo = { sources: [], fileInsights: '', webInsights: '', knowledgeInsights: '' };
  }

  // ─── Data Analytics（CSV/XLSX 数据分析）───
  let dataAnalytics = null;
  if (files && files.some(f => /\.(csv|xlsx?)$/i.test(f.filename || ''))) {
    log.info('data-analytics: running');
    if (broadcast) broadcast({ type: 'agent_step', step: 'data-analytics', message: '分析数据文件...' });
    dataAnalytics = await getDataAnalyticsContext(files, modelConfig);
    log.info('data-analytics done', { tables: dataAnalytics?.tables?.length || 0, charts: dataAnalytics?.charts?.length || 0 });
  }

  // ─── Stage 2: 生成阶段 ────────────────────────────────────
  // 一次性传入全部上下文，让 LLM 自主完成结构规划+视觉设计+代码生成
  log.info('stage 3: slide-generator');
  if (broadcast) broadcast({ type: 'agent_step', step: 'slide-generator', message: '生成幻灯片...' });

  const context = buildGenerationContext({ analyzerResult, collectedInfo, dataAnalytics, pageCount, autoPage, files, message });
  
  let html = await runSlideGenerator({
    synthesis: null,     // 不再传入固定结构 — LLM 自主规划
    visualPlan: null,    // 不再传入固定视觉方案 — LLM 自主设计
    collectedInfo: context,
    maxTokens: config.maxTokens,
    modelConfig,
    pageCount,
  });
  log.info('stage 3 done', { htmlLength: html.length });

  // 结构化校验（不调 LLM，纯规则检查）
  html = validateHTML(html, pageCount);

  // ─── 反馈闭环 ────────────────────────────────────────────
  let feedbackResult = { html, history: [] };
  if (enableFeedback) {
    feedbackResult = await runFeedbackLoop({
      sessionId,
      html,
      userMessage: message,
      qualityTier: config.agents.length > 1 ? 'high' : 'fast',
      modelConfig,
      broadcast,
      fixHandler: async ({ html: oldHtml, instruction }) => {
        return await runSlideGenerator({
          synthesis: null,
          visualPlan: null,
          collectedInfo: context,
          maxTokens: config.maxTokens,
          modifyHtml: oldHtml,
          modifyInstruction: instruction,
          modelConfig,
          pageCount,
        });
      },
    });
    html = feedbackResult.html;
  }

  return { html, analyzerResult, synthesis: null, feedback: feedbackResult.history };
}

// ─── 修改模式（保持不变）────────────────────────────────────
async function runModifyMode({ sessionId, message, currentHtml, config, modelConfig, broadcast, analyzerResult, pageCount = 10, enableFeedback = true }) {
  log.info('modify mode');

  if (broadcast) broadcast({ type: 'agent_step', step: 'slide-generator', message: '修改幻灯片...' });

  let html = await runSlideGenerator({
    synthesis: null,
    visualPlan: null,
    collectedInfo: '',
    maxTokens: config.maxTokens,
    modifyHtml: currentHtml,
    modifyInstruction: message,
    modelConfig,
    pageCount,
  });
  log.info('modify done', { htmlLength: html.length });

  html = validateHTML(html, pageCount);

  let feedbackResult = { html, history: [] };
  if (enableFeedback) {
    feedbackResult = await runFeedbackLoop({
      sessionId,
      html,
      userMessage: message,
      qualityTier: config.agents.length > 1 ? 'high' : 'fast',
      modelConfig,
      broadcast,
      fixHandler: async ({ html: oldHtml, instruction }) => {
        return await runSlideGenerator({
          synthesis: null,
          visualPlan: null,
          collectedInfo: '',
          maxTokens: config.maxTokens,
          modifyHtml: oldHtml,
          modifyInstruction: instruction,
          modelConfig,
          pageCount,
        });
      },
    });
    html = feedbackResult.html;
  }

  return { html, analyzerResult, synthesis: null, feedback: feedbackResult.history };
}

// ─── 构建生成上下文（原始丰富信息，不做 JSON 压缩）─────────
function buildGenerationContext({ analyzerResult, collectedInfo, dataAnalytics, pageCount, autoPage, files, message }) {
  const parts = [];

  // 用户原始需求
  parts.push('## 用户需求');
  parts.push(message);
  parts.push('');

  // ═══ PDF/文件全文内容 — 最优先，放在最前面 ═══
  // 这是 slide-generator 生成内容的唯一真实来源
  // 生成演示时必须严格基于这些内容，不要编造
  const fileAnalysis = analyzerResult?.fileAnalysis || '';
  const hasPdfContent = fileAnalysis.includes('PDF 全文分析') || fileAnalysis.includes('论文正文');

  if (fileAnalysis) {
    if (hasPdfContent) {
      // PDF 全文提取 — 这是主输入，放在最前面
      parts.push('## ═══ 参考文件全文内容（主输入）═══');
      parts.push('以下是用户上传的 PDF/文件的实际内容。');
      parts.push('生成演示时必须以这些内容为准，不要使用你自己的知识编造数据或结论。');
      parts.push('');
      parts.push(fileAnalysis);
      parts.push('');
    } else {
      // 非 PDF 文件 — 放在需求分析下面
    }
  }

  // 需求分析结果
  if (analyzerResult) {
    parts.push('## 需求分析');
    parts.push(`- 演示类型: ${analyzerResult.type || '通用'}`);
    parts.push(`- 目标受众: ${analyzerResult.audience || '未指定'}`);
    parts.push(`- 风格倾向: ${analyzerResult.style || 'Modern'}`);
    parts.push(`- 关键词: ${(analyzerResult.keywords || []).join(', ')}`);
    if (analyzerResult.summary) parts.push(`- 摘要: ${analyzerResult.summary}`);
    if (analyzerResult.suggestions) parts.push(`- 建议: ${analyzerResult.suggestions}`);
    parts.push('');

    // 非 PDF 文件分析（图片/代码等）
    if (fileAnalysis && !hasPdfContent) {
      parts.push(fileAnalysis);
      parts.push('');
    }
  }

  // 资料收集结果
  if (collectedInfo) {
    if (collectedInfo.fileInsights) {
      parts.push('## 上传文件资料');
      parts.push(collectedInfo.fileInsights.slice(0, 2000));
      parts.push('');
    }
    if (collectedInfo.webInsights) {
      parts.push('## 网络搜索资料');
      parts.push(collectedInfo.webInsights.slice(0, 3000));
      parts.push('');
    }
    if (collectedInfo.sources?.length) {
      parts.push('## 参考链接');
      parts.push(collectedInfo.sources.slice(0, 8).map((s, i) => `${i + 1}. ${s}`).join('\n'));
      parts.push('');
    }
  }

  // 数据分析结果
  if (dataAnalytics) {
    parts.push('## 数据分析结果（来自上传的 CSV/XLSX 文件）');
    if (dataAnalytics.insights?.length) {
      parts.push(dataAnalytics.insights.map((s, i) => `${i + 1}. ${s}`).join('\n'));
      parts.push('');
    }
    if (dataAnalytics.tables?.length) {
      dataAnalytics.tables.forEach(t => {
        parts.push(`### ${t.title}`);
        if (t.insight) parts.push(`关键洞察: ${t.insight}`);
        parts.push('');
      });
    }
    if (dataAnalytics.charts?.length) {
      dataAnalytics.charts.forEach(c => {
        parts.push(`### 图表建议: ${c.title} (${c.type})`);
        parts.push(`标签: ${(c.labels || []).join(', ')}`);
        if (c.insight) parts.push(`洞察: ${c.insight}`);
        parts.push('');
      });
    }
    parts.push('');
  }

  // 页数建议（软约束）
  parts.push(`## 页数建议`);
  if (autoPage) {
    parts.push(`由你自主判断需要多少页才能完整表达内容。根据内容复杂度决定页数，不要硬凑数量。内容完整性优先。`);
  } else {
    parts.push(`建议生成约 ${pageCount} 页幻灯片。可以根据内容需要适当增减（±3页），内容完整性优先于精确页数。`);
  }
  parts.push('');

  return parts.join('\n');
}

// ─── 纯规则校验（不调 LLM）─────────────────────────────────
function validateHTML(html, pageCount) {
  const errors = [];

  if (!html.includes('class="reveal"') && !html.includes("class='reveal'")) {
    errors.push('缺少 reveal 容器');
  }
  if (!html.includes('<section')) {
    errors.push('没有 section 元素');
  }
  if (!html.trim().endsWith('</html>')) {
    errors.push('缺少 </html> 闭合');
  }
  if (!html.includes('Reveal.initialize') && !html.includes('Reveal.configure')) {
    errors.push('缺少 Reveal.initialize');
  }

  if (errors.length === 0) {
    log.info('validate: PASS');
    return html;
  }

  log.warn('validate: 警告（不阻塞，前端渲染可能降级）', { errors: errors.join(', ') });

  // 不调 LLM 修复 — 让前端 iframe 尽力渲染
  // 如果确实缺 Reveal.initialize，补一个最小的
  if (!html.includes('Reveal.initialize') && html.includes('</body>')) {
    html = html.replace('</body>',
      `<script>Reveal.initialize({hash:true,transition:'slide'});</script>\n</body>`);
    log.info('validate: 已补充最小 Reveal.initialize');
  }

  return html;
}

// ─── 工具函数 ──────────────────────────────────────────────
function saveHtml(sessionId, html) {
  const outputDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'output');
  const outputPath = path.join(outputDir, `${sessionId}.html`);
  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(outputPath, html, 'utf-8');
  log.info('saved', { sessionId, outputPath });
}
