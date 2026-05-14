// AI Client - 多渠道 AI 调用封装
// 支持: OpenRouter / GLM(智谱) / MiniMax 三个渠道
// 各 Agent 按需调用不同渠道

// ============================================================
// 渠道 1: OpenRouter (免费模型 + 付费备用)
// ============================================================
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '';
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

// OpenRouter 模型定义
const OPENROUTER_MODELS = {
  // 最强免费编程模型 (文本)
  coding_free: 'anthropic/claude-3.5-sonnet',        // 免费额度内最强编程模型
  // 免费视觉模型
  vision_free: 'google/gemini-2.0-flash-001',       // 免费视觉模型
  // 备用付费编程模型
  coding_paid: 'openai/o3-mini',
};

// ============================================================
// 渠道 2: GLM 智谱
// ============================================================
const ZHIPU_API_KEY = process.env.ZHIPU_API_KEY || '';
const ZHIPU_API_URL = 'https://open.bigmodel.cn/api/paas/v4/chat/completions';

// 智谱模型定义
const ZHIPU_MODELS = {
  flash: 'glm-4-flash',
  plus: 'glm-4-plus',
  vision: 'glm-4v',
};

// ============================================================
// 渠道 3: MiniMax (M2.7 + Coding Plan VLM)
// ============================================================
const MINIMAX_API_KEY = process.env.MINIMAX_API_KEY || '';
const MINIMAX_API_URL = 'https://api.minimax.chat/v';

// MiniMax 模型定义
const MINIMAX_MODELS = {
  // M2.7 主力文本模型
  m27: 'MiniMax-Text-01',
  // Coding Plan VLM 多模态编程接口
  coding_vlm: 'abab6.5s',
};

const MAX_RETRIES = 2;
const REQUEST_TIMEOUT = 300000; // 5分钟

// ============================================================
// 通用工具函数
// ============================================================
async function fetchWithTimeout(url, options, timeoutMs = REQUEST_TIMEOUT) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error(`请求超时（${timeoutMs}ms），请稍后重试`);
    }
    throw error;
  }
}

function parseErrorResponse(response, responseText) {
  let errorDetail = responseText.slice(0, 300);
  try {
    const errorJson = JSON.parse(responseText);
    errorDetail = errorJson.error?.message || errorJson.message || errorDetail;
  } catch (_) { }
  return errorDetail;
}

// ============================================================
// 渠道 1: OpenRouter 调用
// ============================================================
async function callOpenRouter(messages, model, maxTokens = 8000) {
  if (!OPENROUTER_API_KEY) throw new Error('未配置 OPENROUTER_API_KEY');

  let lastError;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetchWithTimeout(OPENROUTER_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'HTTP-Referer': 'https://your-domain.com',
          'X-Title': '云心 - AI 幻灯片生成器',
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: 0.6,
          max_tokens: maxTokens,
        }),
      });

      const responseText = await response.text();

      if (!response.ok) {
        throw new Error(`OpenRouter API 错误 (${response.status}): ${parseErrorResponse(response, responseText)}`);
      }

      const data = JSON.parse(responseText);
      const content = data.choices?.[0]?.message?.content;
      if (!content) throw new Error('AI 返回内容为空');
      return content;
    } catch (error) {
      lastError = error;
      if (attempt === MAX_RETRIES) throw new Error(`OpenRouter 调用失败: ${error.message}`);
      await new Promise(r => setTimeout(r, 1500 * Math.pow(2, attempt)));
    }
  }
  throw lastError;
}

// ============================================================
// 渠道 2: GLM 智谱调用
// ============================================================
async function callZhipuAI(messages, model = ZHIPU_MODELS.flash, maxTokens = 8000) {
  if (!ZHIPU_API_KEY) throw new Error('未配置 ZHIPU_API_KEY');

  let lastError;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetchWithTimeout(ZHIPU_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${ZHIPU_API_KEY}`,
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: 0.6,
          max_tokens: maxTokens,
        }),
      });

      const responseText = await response.text();

      if (!response.ok) {
        throw new Error(`GLM API 错误 (${response.status}): ${parseErrorResponse(response, responseText)}`);
      }

      const data = JSON.parse(responseText);
      const content = data.choices?.[0]?.message?.content;
      if (!content) throw new Error('GLM 返回内容为空');
      return content;
    } catch (error) {
      lastError = error;
      if (attempt === MAX_RETRIES) throw new Error(`GLM 调用失败: ${error.message}`);
      await new Promise(r => setTimeout(r, 1500 * Math.pow(2, attempt)));
    }
  }
  throw lastError;
}

// ============================================================
// 渠道 3: MiniMax 调用
// ============================================================
async function callMiniMax(messages, model, maxTokens = 8000) {
  if (!MINIMAX_API_KEY) throw new Error('未配置 MINIMAX_API_KEY');

  let lastError;
  const groupId = process.env.MINIMAX_GROUP_ID || '';

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetchWithTimeout(`${MINIMAX_API_URL}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${MINIMAX_API_KEY}`,
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: 0.6,
          max_tokens: maxTokens,
          group_id: groupId,
        }),
      });

      const responseText = await response.text();

      if (!response.ok) {
        throw new Error(`MiniMax API 错误 (${response.status}): ${parseErrorResponse(response, responseText)}`);
      }

      const data = JSON.parse(responseText);
      const content = data.choices?.[0]?.message?.content;
      if (!content) throw new Error('MiniMax 返回内容为空');
      return content;
    } catch (error) {
      lastError = error;
      if (attempt === MAX_RETRIES) throw new Error(`MiniMax 调用失败: ${error.message}`);
      await new Promise(r => setTimeout(r, 1500 * Math.pow(2, attempt)));
    }
  }
  throw lastError;
}

// ============================================================
// MiniMax 多模态调用 (Coding Plan VLM)
// ============================================================
async function callMiniMaxVision(messages, model = MINIMAX_MODELS.coding_vlm, maxTokens = 8000) {
  if (!MINIMAX_API_KEY) throw new Error('未配置 MINIMAX_API_KEY');

  let lastError;
  const groupId = process.env.MINIMAX_GROUP_ID || '';

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetchWithTimeout(`${MINIMAX_API_URL}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${MINIMAX_API_KEY}`,
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: 0.6,
          max_tokens: maxTokens,
          group_id: groupId,
        }),
      });

      const responseText = await response.text();

      if (!response.ok) {
        throw new Error(`MiniMax Vision API 错误 (${response.status}): ${parseErrorResponse(response, responseText)}`);
      }

      const data = JSON.parse(responseText);
      const content = data.choices?.[0]?.message?.content;
      if (!content) throw new Error('MiniMax Vision 返回内容为空');
      return content;
    } catch (error) {
      lastError = error;
      if (attempt === MAX_RETRIES) throw new Error(`MiniMax Vision 调用失败: ${error.message}`);
      await new Promise(r => setTimeout(r, 1500 * Math.pow(2, attempt)));
    }
  }
  throw lastError;
}

// ============================================================
// 统一导出
// ============================================================
module.exports = {
  // OpenRouter
  callOpenRouter,
  OPENROUTER_MODELS,
  // GLM 智谱
  callZhipuAI,
  ZHIPU_MODELS,
  // MiniMax
  callMiniMax,
  callMiniMaxVision,
  MINIMAX_MODELS,
};
