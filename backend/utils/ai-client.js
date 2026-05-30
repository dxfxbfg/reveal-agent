function getEnv(key, def = '') {
  return process.env[key] || def;
}

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

export const OPENROUTER_MODELS = {
  coding_free: 'anthropic/claude-3.5-sonnet',
  vision_free: 'google/gemini-2.0-flash-001',
  coding_paid: 'openai/o3-mini',
};

const ZHIPU_API_URL = 'https://open.bigmodel.cn/api/paas/v4/chat/completions';

export const ZHIPU_MODELS = {
  flash: 'glm-4-flash',
  plus: 'glm-4-plus',
  vision: 'glm-4v',
};

const MINIMAX_API_URL = 'https://api.minimax.chat/v1';

export const MINIMAX_MODELS = {
  m27: 'minimax-m2.7',
  coding_vlm: 'abab6.5s',
};

const MAX_RETRIES = 2;
const REQUEST_TIMEOUT = 300000; // 5 分钟，32000 token 生成有时超过 2 分钟

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

async function retryFetch(label, url, options) {
  let lastError;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetchWithTimeout(url, options);
      const responseText = await response.text();

      if (!response.ok) {
        throw new Error(`${label} API 错误 (${response.status}): ${parseErrorResponse(response, responseText)}`);
      }

      return JSON.parse(responseText);
    } catch (error) {
      lastError = error;
      if (attempt === MAX_RETRIES) throw new Error(`${label} 调用失败: ${error.message}`);
      await new Promise(r => setTimeout(r, 1500 * Math.pow(2, attempt)));
    }
  }
  throw lastError;
}

export async function callOpenRouter(messages, model, maxTokens = 8000) {
  const OPENROUTER_API_KEY = getEnv('OPENROUTER_API_KEY');
  if (!OPENROUTER_API_KEY) throw new Error('未配置 OPENROUTER_API_KEY');

  const data = await retryFetch('OpenRouter', OPENROUTER_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'HTTP-Referer': 'https://your-domain.com',
      'X-Title': 'reveal-agent',
    },
    body: JSON.stringify({ model, messages, temperature: 0.6, max_tokens: maxTokens }),
  });

  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error('AI 返回内容为空');
  return content;
}

export async function callZhipuAI(messages, model = ZHIPU_MODELS.flash, maxTokens = 8000) {
  const ZHIPU_API_KEY = getEnv('ZHIPU_API_KEY');
  if (!ZHIPU_API_KEY) throw new Error('未配置 ZHIPU_API_KEY');

  const data = await retryFetch('GLM', ZHIPU_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${ZHIPU_API_KEY}`,
    },
    body: JSON.stringify({ model, messages, temperature: 0.6, max_tokens: maxTokens }),
  });

  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error('GLM 返回内容为空');
  return content;
}

export async function callMiniMax(messages, model = MINIMAX_MODELS.m27, maxTokens = 8000, { allowReasoningFallback = true } = {}) {
  const MINIMAX_API_KEY = getEnv('MINIMAX_API_KEY');
  if (!MINIMAX_API_KEY) throw new Error('未配置 MINIMAX_API_KEY');

  const groupId = getEnv('MINIMAX_GROUP_ID');
  const data = await retryFetch('MiniMax', `${MINIMAX_API_URL}/text/chatcompletion_v2`, {
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
      ...(groupId && { group_id: groupId }),
    }),
  });

  const msg = data.choices?.[0]?.message;
  const content = msg?.content;
  if (content) return content;

  if (allowReasoningFallback && msg?.reasoning_content) {
    return msg.reasoning_content;
  }

  throw new Error('MiniMax 返回内容为空');
}

export async function callMiniMaxVision(messages, model = MINIMAX_MODELS.coding_vlm, maxTokens = 8000) {
  return callMiniMax(messages, model, maxTokens, { allowReasoningFallback: false });
}

export async function callMiniMaxWithTools(messages, model = MINIMAX_MODELS.m27, maxTokens = 8000, tools = []) {
  const MINIMAX_API_KEY = getEnv('MINIMAX_API_KEY');
  if (!MINIMAX_API_KEY) throw new Error('未配置 MINIMAX_API_KEY');

  const groupId = getEnv('MINIMAX_GROUP_ID');
  const data = await retryFetch('MiniMax', `${MINIMAX_API_URL}/text/chatcompletion_v2`, {
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
      tools,
      tool_choice: 'auto',
      ...(groupId && { group_id: groupId }),
    }),
  });

  const msg = data.choices?.[0]?.message;
  if (!msg) throw new Error('MiniMax tool 调用返回消息为空');
  return msg;
}

export async function callCustomAPI(messages, model, maxTokens = 8000, { apiUrl, apiKey }) {
  if (!apiUrl || !apiKey) throw new Error('未配置自定义 API');

  const data = await retryFetch('CustomAPI', apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model, messages, temperature: 0.6, max_tokens: maxTokens }),
  });

  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error('自定义 API 返回内容为空');
  return content;
}
