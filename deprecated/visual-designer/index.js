import { callLLM } from '../../backend/utils/llm-client.js';
import { initAgentContext } from '../../backend/utils/agent-context.js';
import { MINIMAX_MODELS } from '../../backend/utils/ai-client.js';
import { parseLLMJson } from '../../backend/utils/parse-llm-json.js';

const FALLBACK_PALETTE = { primary: '#2563EB', secondary: '#1E40AF', background: '#0F172A', text: '#F1F5F9', accent: '#38BDF8', mood: '专业' };
const FALLBACK_FONTS = { heading: 'Playfair Display', body: 'Source Sans Pro', code: 'JetBrains Mono' };
const FALLBACK_ANIMATIONS = { titlePage: 'fade-in', contentPage: 'fragments', transition: 'slide', fragmentPlans: [] };
const FALLBACK_INTERACTIONS = { needsChart: false, chartType: null, needsMath: false, needsCodeHighlight: false, needsVideo: false, iframeUrls: [], imageUrls: [] };

function extractUrlsFromText(text) {
  if (!text) return [];
  const urls = text.match(/https?:\/\/[^\s\)\]>"]+/g) || [];
  return [...new Set(urls)];
}

function extractImageUrlsFromText(text) {
  if (!text) return [];
  const imgUrls = text.match(/https?:\/\/[^\s\)\]>"]+\.(?:png|jpg|jpeg|gif|svg|webp)(?:\?[^\s\)\]>"]*)?/gi) || [];
  return [...new Set(imgUrls)];
}

export async function run({ requirementAnalysis, collectedInfo = '', modelConfig = null }) {
  const { system, wiki, skill } = await initAgentContext(
    'visual-designer',
    `${requirementAnalysis.summary || ''} ${requirementAnalysis.type || ''}`,
    5
  );

  const keywords = Array.isArray(requirementAnalysis.keywords)
    ? requirementAnalysis.keywords.join(', ')
    : (requirementAnalysis.keywords || '');

  const extractedUrls = extractUrlsFromText(collectedInfo);
  const extractedImageUrls = extractImageUrlsFromText(collectedInfo);

  const prompt = `${system}

## 你的 Wiki 视觉设计规范库
${wiki}

## reveal.js 视觉/动画 Skill
${skill}

## 需求分析结果
- 演示类型：${requirementAnalysis.type || 'unknown'}
- 目标受众：${requirementAnalysis.audience || '未明确'}
- 主题关键词：${keywords}
- 内容摘要：${requirementAnalysis.summary || ''}
- 风格倾向：${requirementAnalysis.style || 'Modern'}

## 已收集的内容信息
${collectedInfo || '暂无额外内容信息'}

${extractedUrls.length > 0 ? `## 从资料中提取的可用链接\n${extractedUrls.slice(0, 5).map((u, i) => `${i + 1}. ${u}`).join('\n')}` : ''}

${extractedImageUrls.length > 0 ? `## 从资料中提取的图片素材\n${extractedImageUrls.slice(0, 3).map((u, i) => `${i + 1}. ${u}`).join('\n')}` : ''}

## 输出格式
请严格按以下 JSON 格式输出（只输出 JSON，不要其他文字）：

{
  "palette": {
    "primary": "#RRGGBB",
    "secondary": "#RRGGBB",
    "background": "#RRGGBB",
    "text": "#RRGGBB",
    "accent": "#RRGGBB",
    "mood": "情绪关键词如：专业/活力/沉稳/优雅"
  },
  "fonts": {
    "heading": "标题字体（Google Fonts 如 Playfair Display）",
    "body": "正文字体（如 Source Sans Pro）",
    "code": "代码字体（如 JetBrains Mono，可选）"
  },
  "animations": {
    "titlePage": "fade-in/slide/none",
    "contentPage": "auto-animate/fragments/none",
    "transition": "slide/fade/zoom/none",
    "fragmentPlans": [
      {"page": "页面描述", "type": "fragment类型", "interval": 300}
    ]
  },
  "interactions": {
    "needsChart": true或false,
    "chartType": "bar/line/pie/scatter之一或null",
    "needsMath": true或false,
    "needsCodeHighlight": true或false,
    "needsVideo": true或false,
    "iframeUrls": ["URL1", "URL2"],
    "imageUrls": ["图片URL1", "图片URL2"]
  },
  "theme": "基于这个配色，从 reveal.js 内置主题中选择最接近的：black/white/league/beige/sky/night/serif/simple/solarized/moon/blood",
  "reasoning": "设计决策的简短说明（50字内）"
}

设计原则：
1. 配色要与演示类型匹配（技术分享→冷色/学术白，商业路演→深色/金色）
2. 字体不超过 3种（标题+正文）
3. 动画克制：标题页用 fade-in，内容页优先用 fragments 而非页面切换
4. 交互元素按需添加，不要过度设计
5. 如果从资料中提取到了链接和图片 URL，必须填入 iframeUrls 和 imageUrls 字段
6. 至少提供 1 个 iframeUrls（用于 data-background-iframe），优先使用资料中提取的链接`;

  const result = await callLLM({
    prompt,
    system: '你是一个 JSON 输出的视觉设计师。严格按照 JSON 格式输出。',
    model: MINIMAX_MODELS.m27,
    maxTokens: 3000,
    modelConfig,
  });

  const parsed = parseLLMJson(result, {});

  return {
    palette: {
      primary: parsed.palette?.primary || FALLBACK_PALETTE.primary,
      secondary: parsed.palette?.secondary || FALLBACK_PALETTE.secondary,
      background: parsed.palette?.background || FALLBACK_PALETTE.background,
      text: parsed.palette?.text || FALLBACK_PALETTE.text,
      accent: parsed.palette?.accent || FALLBACK_PALETTE.accent,
      mood: parsed.palette?.mood || FALLBACK_PALETTE.mood,
    },
    fonts: {
      heading: parsed.fonts?.heading || FALLBACK_FONTS.heading,
      body: parsed.fonts?.body || FALLBACK_FONTS.body,
      code: parsed.fonts?.code || FALLBACK_FONTS.code,
    },
    animations: {
      titlePage: parsed.animations?.titlePage || FALLBACK_ANIMATIONS.titlePage,
      contentPage: parsed.animations?.contentPage || FALLBACK_ANIMATIONS.contentPage,
      transition: parsed.animations?.transition || FALLBACK_ANIMATIONS.transition,
      fragmentPlans: Array.isArray(parsed.animations?.fragmentPlans)
        ? parsed.animations.fragmentPlans
        : [],
    },
    interactions: {
      needsChart: Boolean(parsed.interactions?.needsChart),
      chartType: parsed.interactions?.chartType || null,
      needsMath: Boolean(parsed.interactions?.needsMath),
      needsCodeHighlight: Boolean(parsed.interactions?.needsCodeHighlight),
      needsVideo: Boolean(parsed.interactions?.needsVideo),
      iframeUrls: Array.isArray(parsed.interactions?.iframeUrls)
        ? parsed.interactions.iframeUrls
        : extractedUrls.slice(0, 3),
      imageUrls: Array.isArray(parsed.interactions?.imageUrls)
        ? parsed.interactions.imageUrls
        : extractedImageUrls.slice(0, 3),
    },
    theme: parsed.theme || 'black',
    reasoning: parsed.reasoning || '',
  };
}
