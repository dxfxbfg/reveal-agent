import { callLLM } from '../../backend/utils/llm-client.js';
import { initAgentContext } from '../../backend/utils/agent-context.js';
import { MINIMAX_MODELS } from '../../backend/utils/ai-client.js';
import { parseLLMJson } from '../../backend/utils/parse-llm-json.js';
import { analyzeFiles } from '../../backend/utils/file-analyzer.js';

const FALLBACK = {
  summary: '未提供摘要',
  type: 'unknown',
  audience: '未明确受众',
  style: 'Modern',
  keywords: [],
  missingInfo: [],
  needsWebSearch: false,
  searchQueries: [],
  confidence: 0.3,
  suggestions: '需求分析未能完全结构化，请补充详细信息',
  mode: 'presentation',
};

export async function run({ message, history = [], currentHtml = '', files = [], modelConfig = null }) {
  // ─── 步骤 0: 模式选择 ──────────────────────────────────
  const mode = await detectMode(message, modelConfig);
  console.log('[requirement-analyzer] mode selected:', mode);

  if (mode === 'pm-requirement') {
    return runPMRequirementMode({ message, history, currentHtml, files, modelConfig });
  }
  return runPresentationMode({ message, history, currentHtml, files, modelConfig });
}

async function detectMode(message, modelConfig) {
  const detectPrompt = `判断以下用户输入属于哪种类型，只输出一个词：

## 输入
${message.slice(0, 500)}

## 类型判断
- "presentation" — 用户想要制作演示文稿/PPT/幻灯片（如"帮我做PPT""生成演示""做个幻灯片"）
- "pm-requirement" — 用户描述的是产品功能/系统设计/业务需求（如"我们需要一个XX系统""设计XX功能""XX流程优化"）
- 用户只是闲聊或提问 → "presentation"

输出: presentation 或 pm-requirement`;

  try {
    const result = await callLLM({
      prompt: detectPrompt,
      model: MINIMAX_MODELS.m27,
      maxTokens: 50,
      modelConfig,
    });
    const cleaned = result.trim().toLowerCase();
    if (cleaned.includes('pm') || cleaned.includes('requirement')) return 'pm-requirement';
    return 'presentation';
  } catch {
    return 'presentation';
  }
}

// ─── 原始模式：演示文稿需求分析 ────────────────────────────
async function runPresentationMode({ message, history, currentHtml, files, modelConfig }) {
  const { system, wiki, skill } = await initAgentContext('requirement-analyzer', message, 5);

  const fileAnalysis = files.length > 0 ? await analyzeFiles(files) : '';

  const historyContext = history.length > 0
    ? `\n## 对话历史\n${history.map(h => `**${h.role}**: ${h.content}`).join('\n')}`
    : '';

  const currentHtmlContext = currentHtml && currentHtml.includes('<section')
    ? `\n## 当前已有幻灯片\n用户当前已有一个幻灯片（HTML 长度: ${currentHtml.length} 字符），用户接下来的请求可能是修改它或要求重新生成。\n\n现有 HTML 摘要：${extractHtmlSummary(currentHtml)}`
    : '';

  const prompt = `${system}

## 你的 Wiki 知识库
${wiki}

## reveal.js Skill 知识（参考其能力边界）
${skill}

${fileAnalysis ? '## 📋 参考文件智能分析\n' + fileAnalysis + '\n' : ''}
## 用户原始需求
${message}
${historyContext}${currentHtmlContext}

## 输出格式
请按以下 JSON 结构输出你的分析结果（只输出 JSON，不要其他内容）：

{
  "action": "new 或 modify（如果有现有幻灯片且用户意图是修改则填 modify，否则填 new）",
  "summary": "用一句话概括用户想要的演示主题",
  "type": "teaching|roadshow|technical|personal|unknown",
  "audience": "目标受众描述",
  "style": "从以下风格库中选择最匹配的：Technical/Academic/Luxury/Playful/Modern/Minimal",
  "keywords": ["关键词1", "关键词2", "关键词3"],
  "missingInfo": ["需要补充的资料1", "需要补充的资料2"],
  "needsWebSearch": true或false,
  "searchQueries": ["建议搜索的query1", "建议搜索的query2"],
  "confidence": 0.0-1.0之间的置信度,
  "suggestions": "对需求模糊之处的澄清建议"
}

分析要求：
1. action 判断规则：如果当前有幻灯片且用户说的是"修改/调整/增加/减少/换一下"等，填 "modify"；否则填 "new"
2. type 只能是 5 个预设类型之一，如果不是明显匹配设为 "unknown"
3. missingInfo 列出制作这个演示需要的、但用户没有提供的信息
4. needsWebSearch：如果主题涉及实时数据/最新资讯/用户不了解的领域则为 true
5. searchQueries：提出 2-3 个精准的搜索 query 用于 info-collector`;

  const result = await callLLM({
    prompt,
    system: '你是一个 JSON 输出的需求分析师。严格按照 JSON 格式输出，不要有其他文字。',
    model: MINIMAX_MODELS.m27,
    maxTokens: 2000,
    modelConfig,
  });

  const parsed = parseLLMJson(result, FALLBACK);

  return {
    action: parsed.action || 'new',
    summary: parsed.summary || FALLBACK.summary,
    type: parsed.type || FALLBACK.type,
    audience: parsed.audience || FALLBACK.audience,
    style: parsed.style || FALLBACK.style,
    keywords: Array.isArray(parsed.keywords) ? parsed.keywords : [],
    missingInfo: Array.isArray(parsed.missingInfo) ? parsed.missingInfo : [],
    needsWebSearch: Boolean(parsed.needsWebSearch),
    searchQueries: Array.isArray(parsed.searchQueries) ? parsed.searchQueries : [],
    confidence: typeof parsed.confidence === 'number' ? parsed.confidence : FALLBACK.confidence,
    suggestions: parsed.suggestions || '',
    mode: 'presentation',
    fileAnalysis: fileAnalysis || '',   // 原样传下去，给 slide-generator 用
  };
}

// ─── PM 需求清洗模式 ──────────────────────────────────────
async function runPMRequirementMode({ message, history, currentHtml, modelConfig }) {
  const { system, wiki } = await initAgentContext('pm-requirement-analyzer', message, 5);

  const prompt = `你是一个产品经理需求分析师，擅长将模糊需求清洗为结构化 PRD。

## PM 需求清洗 Skill
${wiki}

## 用户原始需求
${message}

## 对话历史
${history.length > 0 ? history.map(h => `**${h.role}**: ${h.content}`).join('\n') : '（无）'}

## 输出格式
按以下 JSON 输出分析结果（只输出 JSON）：

{
  "action": "new",
  "mode": "pm-requirement",
  "summary": "用一句话概括核心需求",
  "type": "system_page|rule_policy|process_optimization|mixed",
  "audience": "目标用户角色",
  "style": "Modern",
  "keywords": ["关键词"],
  "gscre_scores": { "G": 0-2, "S": 0-2, "C": 0-2, "R": 0-2, "E": 0-2 },
  "total_score": 0-10,
  "maturity": "draft|review|confirmed",
  "has_conflict": true或false,
  "p0_gaps": ["最关键的缺口1", "缺口2"],
  "missingInfo": ["需要补充的资料"],
  "needsWebSearch": true或false,
  "searchQueries": ["搜索query"],
  "confidence": 0.0-1.0,
  "suggestions": "澄清建议"
}

五维评分参考：
- G(Goal): 0=不清不楚 1=有方向 2=目标+结果都明确
- S(Scenario): 0=无场景 1=有但缺细节 2=角色+触发+流程完整
- C(Constraint): 0=无边界 1=部分 2=规则/权限/异常都明确
- R(Resolution): 0=只有痛点 1=有方向无细节 2=核心能力明确
- E(Evidence): 0=纯主观 1=间接证据 2=数据/真实事件支撑`;

  const result = await callLLM({
    prompt,
    system: '你是一个 JSON 输出的产品需求分析师。严格按 JSON 输出。',
    model: MINIMAX_MODELS.m27,
    maxTokens: 2000,
    modelConfig,
  });

  const parsed = parseLLMJson(result, FALLBACK);

  return {
    action: 'new',
    mode: 'pm-requirement',
    summary: parsed.summary || FALLBACK.summary,
    type: parsed.type || 'mixed',
    audience: parsed.audience || FALLBACK.audience,
    style: parsed.style || 'Modern',
    keywords: Array.isArray(parsed.keywords) ? parsed.keywords : [],
    gscreScores: parsed.gscre_scores || { G: 0, S: 0, C: 0, R: 0, E: 0 },
    totalScore: typeof parsed.total_score === 'number' ? parsed.total_score : 0,
    maturity: parsed.maturity || 'draft',
    hasConflict: Boolean(parsed.has_conflict),
    p0Gaps: Array.isArray(parsed.p0_gaps) ? parsed.p0_gaps : [],
    missingInfo: Array.isArray(parsed.missingInfo) ? parsed.missingInfo : [],
    needsWebSearch: Boolean(parsed.needsWebSearch),
    searchQueries: Array.isArray(parsed.searchQueries) ? parsed.searchQueries : [],
    confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.3,
    suggestions: parsed.suggestions || '',
    fileAnalysis: '',   // PM 模式不做文件分析
  };
}

function extractHtmlSummary(html) {
  const title = html.match(/<title>(.*?)<\/title>/i);
  const sections = (html.match(/<section/g) || []).length;
  return `标题: ${title ? title[1] : '无'}, 幻灯片数: ${sections}`;
}
