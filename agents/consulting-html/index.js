/**
 * Consulting HTML Agent — 咨询级 PPTX 就绪 HTML 生成
 *
 * 隔离策略：
 * - 基于 pptx-ready-html-consulting skill
 * - 自包含 HTML，优化为 PPTX 转换
 * - 输出到 output/consulting/
 * - runChat: 对话式需求清理（多轮追问直到满足标准）
 * - 支持网络搜索：搜索实时行业数据，增强需求分析和内容生成
 */

import { callLLM, callMiniMaxWebSearch } from '../../backend/utils/llm-client.js';
import { MINIMAX_MODELS } from '../../backend/utils/ai-client.js';
import { parseLLMJson } from '../../backend/utils/parse-llm-json.js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { analyzeFiles } from '../../backend/utils/file-analyzer.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SKILL_DIR = join(__dirname, '..', '..', 'pptx-ready-html-consulting');

function readSkillFile(filename) {
  try {
    return readFileSync(join(__dirname, '..', '..', 'skills', filename), 'utf-8');
  } catch {
    return '';
  }
}

function readRef(filename) {
  const p = join(SKILL_DIR, 'references', filename);
  try {
    return readFileSync(p, 'utf-8');
  } catch {
    return '';
  }
}

function readTemplate() {
  const p = join(SKILL_DIR, 'assets', 'base-template.html');
  try {
    return readFileSync(p, 'utf-8');
  } catch {
    return '';
  }
}

async function gatherWebContext(topic, round = 1) {
  if (!topic || topic.length < 4) return '';

  const queries = buildSearchQueries(topic, round);

  const results = await Promise.allSettled(
    queries.map(q => callMiniMaxWebSearch(q, '你是信息收集专家。请搜索并提供结构化总结，每条结果包含标题和关键数据。'))
  );

  const allResults = results
    .filter(r => r.status === 'fulfilled' && r.value)
    .map(r => r.value);

  if (allResults.length === 0) return '';

  const merged = allResults
    .join('\n---\n')
    .slice(0, 3000);

  return `## 网络实时搜索资料\n${merged}\n`;
}

function buildSearchQueries(topic, round) {
  const base = topic.replace(/[#*_`~]/g, '').trim();
  const now = new Date();
  const year = now.getFullYear();

  const queries = [
    `${base} 行业趋势 市场规模 ${year}`,
    `${base} 最新数据 关键指标`,
    `${base} 行业报告 发展现状`,
  ];

  if (round > 1) {
    queries.push(`${base} 案例 最佳实践`);
    queries.push(`${base} 竞争格局 主要企业`);
  }

  return queries.slice(0, 4);
}

function extractTopicFromHistory(message, history = []) {
  if (history.length === 0) return message;

  const userMessages = history
    .filter(h => h.role === 'user')
    .map(h => h.content);

  const allText = [...userMessages, message].join(' ');
  return allText.slice(0, 200);
}

// ─── Chat 模式：多轮需求清理 ──────────────────────────────

export async function runChat({ message, history = [], files = [], deckType = 'general', modelConfig = null, enableWebSearch = false }) {
  const consultingFrameworks = readRef('consulting-frameworks.md');

  const historyStr = history.length > 0
    ? history.map(h => `**${h.role === 'user' ? '用户' : 'Agent'}**: ${h.content}`).join('\n')
    : '（首轮）';

  const fileContext = files.length > 0 ? await analyzeFiles(files) : '';

  let webContext = '';
  if (enableWebSearch) {
    const topic = extractTopicFromHistory(message, history);
    const round = history.filter(h => h.role === 'user').length + 1;
    webContext = await gatherWebContext(topic, round);
  }

  const prompt = [
    '你是 "reveal-agent" 系统的咨询需求分析模块。你不是豆包/DeepSeek/Claude/GPT 或其他任何AI产品。',
    '不要自我介绍，不要说你是什么模型，不要说你是哪家公司开发的。直接开始工作。',
    '你的任务：通过多轮对话帮助用户梳理咨询演示需求，直到满足生成标准。',
    '',
    '## 咨询框架 (SCR/SCQA)',
    consultingFrameworks.slice(0, 3000),
    '',
    fileContext ? '## 用户上传的参考文件\n' + fileContext : '',
    '',
    webContext ? webContext : '',
    '',
    webContext ? '利用上面的网络搜索资料，了解行业最新动态和数据，提出更有深度的问题来帮助用户梳理需求。' : '',
    '',
    '## 需求充分标准',
    '以下维度至少每项有 1 条明确信息才算充分：',
    '1. 主题/行业：明确演示的核心主题',
    '2. 目标受众：给谁看（CEO/CTO/投资人/客户）',
    '3. 核心叙事：Situation→Complication→Resolution 三要素至少有一个明确',
    '4. 页数范围：用户提到或你建议一个合理范围',
    '5. 关键证据：是否需要数据图表/对比矩阵/KPI/路线图',
    '',
    '## 对话历史',
    historyStr,
    '',
    '## 用户最新输入',
    message,
    '',
    '## 输出格式',
    '严格按以下 JSON 输出（只输出 JSON）：',
    '{',
    '  "ready": true或false,',
    '  "response": "你的回复，2-4句话。如果 ready=false，追问用户缺少的信息；如果 ready=true，总结需求全景",',
    '  "questions": ["追问1", "追问2"],',
    '  "deckType": "general或manufacturing",',
    '  "pageCount": 建议页数,',
    '  "summary": "需求全景概述（仅 ready=true 时填写）",',
    '  "webSearchQueries": ["搜索词1", "搜索词2"]',
    '}',
    '',
    '追问原则：',
    '- 每次最多 2 个问题，聚焦最关键的缺口',
    '- 问题使用用户的语言，不要用咨询术语',
    '- 提供选项引导（A/B/C）',
    '- 如果用户连续回答充分（2轮无新缺口），ready=true',
    '- 最多追问 5 轮',
    '- 如果有网络搜索资料，利用其中的行业数据来引导用户思考，提出更有针对性的追问',
  ].join('\n');

  const result = await callLLM({
    prompt,
    system: '你是 reveal-agent 咨询需求分析师。你不是豆包、DeepSeek、Claude或任何第三方AI。禁止自我介绍。严格按 JSON 格式输出。',
    model: MINIMAX_MODELS.m27,
    maxTokens: 1500,
    modelConfig,
  });

  const parsed = parseLLMJson(result, {
    ready: false,
    response: '我来帮你梳理需求。请告诉我演示的主题和受众。',
    questions: ['演示主题是什么？', '目标受众是谁？'],
    deckType: 'general',
    pageCount: 10,
    summary: '',
    webSearchQueries: [],
  });

  return {
    ready: Boolean(parsed.ready),
    response: stripIdentity(parsed.response || '请补充更多信息。'),
    questions: Array.isArray(parsed.questions) ? parsed.questions.slice(0, 3) : [],
    deckType: parsed.deckType || 'general',
    pageCount: typeof parsed.pageCount === 'number' ? parsed.pageCount : 10,
    summary: parsed.summary || '',
    webSearchQueries: Array.isArray(parsed.webSearchQueries) ? parsed.webSearchQueries : [],
    webContext: webContext || '',
  };
}

function stripIdentity(text) {
  if (!text) return '';
  // 移除模型幻觉的身份声明
  return text
    .replace(/我是(由)?\s*(字节跳动|豆包|DeepSeek|深度求索|OpenAI|Anthropic|Claude|GPT|Google|Gemini|百度|文心|阿里|通义|智谱|GLM|MiniMax|海螺)[^。，.!?]*[。，.!?]/g, '')
    .replace(/我的开发者是[^。，.!?]*[。，.!?]/g, '')
    .replace(/我是[^。，.!?]*AI[^。，.!?]*[。，.!?]/g, '')
    .trim();
}

// ─── 生成模式 ──────────────────────────────────────────────

export async function run({ message, deckType = 'general', pageCount = 10, modelConfig = null, enableWebSearch = false }) {
  const systemPrompt = readSkillFile('consulting-html-prompt.md');
  const baseTemplate = readTemplate();

  const designSystem = readRef('design-system.md');
  const slidePatterns = readRef('slide-patterns.md');
  const consultingFrameworks = readRef('consulting-frameworks.md');
  const pptxRules = readRef('pptx-conversion-rules.md');
  const qualityGates = readRef('quality-gates.md');

  let manufacturingRefs = '';
  if (deckType === 'manufacturing') {
    manufacturingRefs = [
      readRef('manufacturing-solution-framework.md'),
      readRef('manufacturing-scenario-library.md'),
      readRef('manufacturing-capability-map.md'),
      readRef('architecture-patterns.md'),
      readRef('value-kpi-library.md'),
      readRef('roadmap-governance-patterns.md'),
      readRef('manufacturing-methodologies.md'),
    ].join('\n\n');
  }

  let webContext = '';
  if (enableWebSearch) {
    webContext = await gatherWebContext(message, 3);
  }

  const prompt = [
    systemPrompt,
    '',
    '## 基础 HTML 模板',
    '```html',
    baseTemplate.slice(0, 4000),
    '```',
    '',
    '## 设计系统',
    designSystem.slice(0, 4000),
    '',
    '## 幻灯片布局模式',
    slidePatterns.slice(0, 5000),
    '',
    '## 咨询框架 (SCR/SCQA)',
    consultingFrameworks.slice(0, 3000),
    '',
    '## PPTX 转换规则',
    pptxRules.slice(0, 3000),
    '',
    '## 质量门',
    qualityGates.slice(0, 2000),
    '',
    deckType === 'manufacturing' ? '## 制造数字化参考\n' + manufacturingRefs.slice(0, 8000) : '',
    '',
    webContext ? webContext : '',
    '',
    webContext ? '利用上面的网络搜索资料中的真实数据和行业信息来丰富演示内容，使数据可信、有据可查。' : '',
    '',
    '## 用户需求',
    `类型: ${deckType === 'manufacturing' ? '制造数字化方案' : '通用咨询演示'}`,
    `目标页数: ${pageCount}`,
    message,
    '',
    '## 生成要求',
    `1. 生成恰好 ${pageCount} 页的完整 HTML（每页一个 section.S）`,
    '2. 所有 CSS 内联在 <style> 中',
    '3. 所有文字用真实 DOM 文本节点',
    '4. 使用 base-template 的 CSS 变量体系',
    '5. 每页标题必须是结论式 Action Title',
    '6. 叙事按 Situation→Complication→Resolution→Evidence→Closing',
    '7. 表格用 <table data-pptx-role="native-table">',
    '8. 直接输出完整 HTML，不包裹 markdown 代码块',
  ].filter(Boolean).join('\n');

  const result = await callLLM({
    prompt,
    system: '你是咨询级幻灯片生成专家。只输出完整 HTML 代码。严格按照 HTML 合约：section.S 幻灯片、自包含、1080×608、结论式标题。',
    model: MINIMAX_MODELS.m27,
    maxTokens: 16000,
    modelConfig,
  });

  return extractHTML(result);
}

function extractHTML(raw) {
  let m = raw.match(/```html\s*\n?([\s\S]*?)```/);
  if (m) return m[1].trim();

  m = raw.match(/```\s*\n?([\s\S]*?)```/);
  if (m && (m[1].includes('<!DOCTYPE') || m[1].includes('<html'))) {
    return m[1].trim();
  }

  const html = raw.match(/<!DOCTYPE html>[\s\S]*?<\/html>/i);
  if (html) return html[0].trim();

  return raw.trim();
}
