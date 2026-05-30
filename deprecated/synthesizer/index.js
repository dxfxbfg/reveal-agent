import { callLLM } from '../../backend/utils/llm-client.js';
import { initAgentContext } from '../../backend/utils/agent-context.js';
import { MINIMAX_MODELS } from '../../backend/utils/ai-client.js';
import { parseLLMJson } from '../../backend/utils/parse-llm-json.js';

const FALLBACK = {
  narrative: '未能规划叙事线',
  structureType: '三段式',
  chapters: [{
    index: 0,
    title: '内容',
    theme: null,
    slides: [{
      index: 0,
      title: '标题页',
      type: 'title',
      layout: 'center',
      content: [],
      fragments: [],
      notes: '',
      special: { chart: null, math: false, code: null, video: null },
    }],
  }],
  totalSlides: 1,
  specialPages: [],
  reasoning: '降级方案',
};

export async function run({ requirementAnalysis, collectedInfo = '', visualPlan, pageCount = 10, modelConfig = null }) {
  const { system, wiki, skill } = await initAgentContext(
    'synthesizer',
    `${visualPlan?.theme || ''} ${visualPlan?.animations?.contentPage || ''}`,
    5
  );

  const keywords = Array.isArray(requirementAnalysis.keywords)
    ? requirementAnalysis.keywords.join(', ')
    : '';

  const visualContext = visualPlan
    ? `配色：${visualPlan.palette?.primary}/${visualPlan.palette?.secondary}/${visualPlan.palette?.accent}\n字体：${visualPlan.fonts?.heading} + ${visualPlan.fonts?.body}\n动画：${visualPlan.animations?.titlePage} / ${visualPlan.animations?.contentPage} / ${visualPlan.animations?.transition}\n交互：${visualPlan.interactions?.needsChart ? 'Chart.js ' : ''}${visualPlan.interactions?.needsMath ? 'KaTeX ' : ''}${visualPlan.interactions?.needsCodeHighlight ? '代码高亮' : ''}`
    : '使用默认视觉方案';

  const prompt = `${system}

## 你的 Wiki 结构规划模板
${wiki}

## reveal.js 结构/Skill
${skill}

## 需求分析
- 演示类型：${requirementAnalysis.type || 'unknown'}
- 目标受众：${requirementAnalysis.audience || '未明确'}
- 主题：${requirementAnalysis.summary || ''}
- 关键词：${keywords}
- 风格：${requirementAnalysis.style || 'Modern'}

## 已收集内容
${collectedInfo || '暂无额外内容'}

## 视觉方案
${visualContext}

## ⚠️ 页数要求
必须严格生成 ${pageCount} 页幻灯片。请规划恰好 ${pageCount} 张幻灯片，分布在 2-4 个章节中。
totalSlides 字段必须等于 ${pageCount}。

## 输出格式
请严格按以下 JSON 格式输出（只输出 JSON）：

{
  "narrative": "用2-3句话描述这个演示的叙事主线",
  "structureType": "三段式|时间线式|对比式|问题-解决式",
  "chapters": [
    {
      "index": 0,
      "title": "章节标题",
      "theme": "章节主题色如 #2563EB 或 null",
      "slides": [
        {
          "index": 0,
          "title": "页面标题",
          "type": "title|section|content|quote|data|summary",
          "layout": "single|two-column|grid|cards|center",
          "content": ["要点1", "要点2", "要点3"],
          "fragments": [
            {"element": "显示的文本", "type": "fade-in", "index": 0}
          ],
          "notes": "演讲者备注（可选）",
          "special": {
            "chart": "bar|line|pie|scatter|null",
            "math": true或false,
            "code": "语言如 javascript 或 null",
            "video": "URL或null"
          }
        }
      ]
    }
  ],
  "totalSlides": ${pageCount},
  "specialPages": ["需要KaTeX的页面", "需要Chart.js的页面"],
  "reasoning": "结构设计决策说明（100字内）"
}

设计规则：
1. 幻灯片总数必须恰好为 ${pageCount} 页
2. 每页内容限制：文字不超过 12行，要点不超过 6 个
3. 章节数建议：2-4 章
4. 空间矩阵使用：同一章节内需要纵向展开的子页面才用 <section> 嵌套
5. Fragment 规划：列表页使用 fragments，内容按逻辑顺序逐步揭示
6. 特殊元素：只有确实需要时才规划 chart/math/code/video`;

  const result = await callLLM({
    prompt,
    system: `你是一个 JSON 输出的结构规划师。严格按照 JSON 格式输出。必须生成恰好 ${pageCount} 页幻灯片。`,
    model: MINIMAX_MODELS.m27,
    maxTokens: 4000,
    modelConfig,
  });

  const parsed = parseLLMJson(result, FALLBACK);

  return {
    narrative: parsed.narrative || FALLBACK.narrative,
    structureType: parsed.structureType || FALLBACK.structureType,
    chapters: Array.isArray(parsed.chapters) ? parsed.chapters : FALLBACK.chapters,
    totalSlides: pageCount,
    specialPages: Array.isArray(parsed.specialPages) ? parsed.specialPages : [],
    reasoning: parsed.reasoning || '',
    pageCount,
  };
}
