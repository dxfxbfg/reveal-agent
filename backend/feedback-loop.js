/**
 * Self-Feedback Loop v3 — 结构化质量评估与自动修复
 *
 * 改变：
 *   - 用结构化检查表替代 LLM 自我评估（避免"又当裁判又当运动员"）
 *   - 检查项更具体：HTML 结构、内容完整性、代码质量
 *   - 修复时给出具体指导而非笼统的"提高质量"
 */

import { MINIMAX_MODELS } from './utils/ai-client.js';

const MAX_FIX_ITERATIONS = 2;

// 结构化检查项
const CHECKS = [
  {
    id: 'reveal_structure',
    label: 'reveal.js 结构完整性',
    check: (html) => html.includes('class="reveal"') && html.includes('class="slides"') && html.includes('<section'),
    failGuidance: '缺少 reveal.js 容器结构。需要: <div class="reveal"><div class="slides"><section>...</section></div></div>',
  },
  {
    id: 'reveal_init',
    label: 'Reveal.initialize 调用',
    check: (html) => /Reveal\.initialize\(/.test(html) || /Reveal\.configure\(/.test(html),
    failGuidance: '缺少 Reveal.initialize() 调用。在 </body> 前添加: <script>Reveal.initialize({hash:true});</script>',
  },
  {
    id: 'html_closing',
    label: 'HTML 闭合标签',
    check: (html) => html.trim().endsWith('</html>'),
    failGuidance: 'HTML 文档必须正确闭合。确保最后以 </html> 结尾。',
  },
  {
    id: 'has_title',
    label: '有标题页',
    check: (html) => /<section[^>]*>[\s\S]*?<h[12]/.test(html),
    failGuidance: '第一页应该包含标题（h1 或 h2）。使用 r-fit-text 类使标题自适应。',
  },
  {
    id: 'cdn_valid',
    label: 'CDN 链接有效',
    check: (html) => html.includes('cdn.jsdelivr.net/npm/reveal.js'),
    failGuidance: 'reveal.js 必须通过 jsdelivr CDN 加载。使用 https://cdn.jsdelivr.net/npm/reveal.js@5.1.0/',
  },
  {
    id: 'no_dead_links',
    label: '无死链',
    check: (html) => {
      const urls = html.match(/https?:\/\/[^\s"'<>]+/g) || [];
      return urls.every(u => !u.includes('example.com') && !u.includes('your-domain') && !u.includes('placeholder'));
    },
    failGuidance: '检测到占位 URL（example.com/placeholder等）。替换为真实链接或删除。',
  },
  {
    id: 'content_density',
    label: '内容密度合理',
    check: (html) => {
      // 检查是否至少有一些实质内容（避免全空的 section）
      const sections = html.match(/<section[\s\S]*?<\/section>/gi) || [];
      if (sections.length === 0) return true;
      const emptySections = sections.filter(s => {
        const inner = s.replace(/<[^>]+>/g, '').trim();
        return inner.length < 10;
      });
      return emptySections.length <= sections.length * 0.3; // 不超过30%的section内容过少
    },
    failGuidance: '部分幻灯片内容过少。每页至少应有一个明确的信息点。',
  },
];

export async function evaluateOutput(html, userMessage, qualityTier = 'standard', modelConfig = null) {
  // 运行结构化检查
  const results = CHECKS.map(c => ({
    ...c,
    passed: c.check(html),
  }));

  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  const score = total > 0 ? passed / total : 1;

  const issues = results.filter(r => !r.passed).map(r => r.label);
  const strengths = results.filter(r => r.passed).map(r => r.label);

  // 收集失败的修复指导
  const failedGuidance = results
    .filter(r => !r.passed)
    .map(r => r.failGuidance);

  return {
    score,
    passed: score >= 0.85, // 85% 检查项通过即认为合格
    feedback: issues.length > 0
      ? `以下检查未通过:\n${issues.map((s, i) => `${i + 1}. ${s}`).join('\n')}`
      : '所有检查通过',
    issues,
    strengths,
    _failedGuidance: failedGuidance,
  };
}

export async function runFeedbackLoop({ sessionId, html, userMessage, qualityTier = 'standard',
  fixHandler = null, onProgress = null, modelConfig = null, broadcast = null }) {

  const history = { sessionId, iterations: [], finalScore: 0 };

  let currentHtml = html;

  for (let i = 0; i < MAX_FIX_ITERATIONS; i++) {
    const evaluation = await evaluateOutput(currentHtml, userMessage, qualityTier, modelConfig);

    history.iterations.push({
      round: i + 1,
      score: evaluation.score,
      passed: evaluation.passed,
      feedback: evaluation.feedback,
      issues: evaluation.issues,
    });

    history.finalScore = evaluation.score;

    if (onProgress) {
      onProgress({ round: i + 1, evaluation });
    }

    if (broadcast) {
      broadcast({
        type: 'feedback_round',
        round: i + 1,
        score: evaluation.score,
        feedback: evaluation.feedback,
        issues: evaluation.issues,
      });
    }

    if (evaluation.passed) {
      console.log(`[feedback:v3] 通过 (round ${i + 1}, score: ${(evaluation.score * 100).toFixed(0)}%)`);
      return { html: currentHtml, evaluation, history, fixed: i > 0 };
    }

    if (!fixHandler) {
      console.log(`[feedback:v3] 评分 ${(evaluation.score * 100).toFixed(0)}% 低于阈值，但无修复处理器`);
      return { html: currentHtml, evaluation, history, fixed: false };
    }

    // 构建具体的修复指令（使用结构化检查的指导）
    const guidance = evaluation._failedGuidance || [];
    const fixInstruction = [
      '请修复以下具体问题后重新生成 HTML：',
      '',
      ...guidance.map((g, idx) => `${idx + 1}. ${g}`),
      '',
      '保持原有的正确内容不变，只修复上述问题。',
      '直接输出完整修改后的 HTML。',
    ].join('\n');

    console.log(`[feedback:v3] 第 ${i + 1} 轮修复 (score: ${(evaluation.score * 100).toFixed(0)}%)`);
    console.log(`[feedback:v3] 问题:`, evaluation.issues?.join(', '));

    try {
      currentHtml = await fixHandler({ html: currentHtml, instruction: fixInstruction });
    } catch (err) {
      console.warn('[feedback:v3] 修复失败:', err.message);
      break;
    }
  }

  return {
    html: currentHtml,
    evaluation: history.iterations[history.iterations.length - 1],
    history,
    fixed: true,
  };
}
