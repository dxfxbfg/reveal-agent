import {
  callMiniMax,
  callZhipuAI,
  callOpenRouter,
  callMiniMaxWithTools,
  callCustomAPI,
  MINIMAX_MODELS,
  OPENROUTER_MODELS,
  ZHIPU_MODELS,
} from './ai-client.js';

export async function callLLM({ prompt, system = '', model = MINIMAX_MODELS.m27, maxTokens = 8000, messages = null, modelConfig = null }) {
  const rolePrompt = system
    ? [{ role: 'system', content: system }, { role: 'user', content: prompt }]
    : [{ role: 'user', content: prompt }];

  if (modelConfig && modelConfig.type === 'custom') {
    return await callCustomAPI(rolePrompt, modelConfig.model || model, maxTokens, { apiUrl: modelConfig.apiUrl, apiKey: modelConfig.apiKey });
  }

  if (modelConfig && modelConfig.model) {
    const selectedModel = modelConfig.model;
    // 前端模型选择 → 实际 API 路由
    const MODEL_MAP = {
      'normal':   { provider: 'minimax', model: MINIMAX_MODELS.m27 },
      'glm':      { provider: 'zhipu',   model: ZHIPU_MODELS.plus },
      'sonnet':   { provider: 'openrouter', model: 'anthropic/claude-sonnet-4' },
      'haiku':    { provider: 'openrouter', model: 'anthropic/claude-haiku-4' },
      'opus':     { provider: 'openrouter', model: 'anthropic/claude-opus-4' },
      'gpt-4o':   { provider: 'openrouter', model: 'openai/gpt-4o' },
      'claude':   { provider: 'openrouter', model: 'anthropic/claude-4-sonnet' },
    };
    const mapped = MODEL_MAP[selectedModel];
    if (mapped) {
      if (mapped.provider === 'minimax') return await callMiniMax(rolePrompt, mapped.model, maxTokens);
      if (mapped.provider === 'zhipu') return await callZhipuAI(rolePrompt, mapped.model, maxTokens);
      if (mapped.provider === 'openrouter') return await callOpenRouter(rolePrompt, mapped.model, maxTokens);
    }
  }

  if (model.startsWith('MiniMax') || model === MINIMAX_MODELS.m27 || model === MINIMAX_MODELS.coding_vlm) {
    return await callMiniMax(rolePrompt, model, maxTokens);
  } else if (model.startsWith('glm-')) {
    return await callZhipuAI(rolePrompt, model, maxTokens);
  } else {
    return await callOpenRouter(rolePrompt, model, maxTokens);
  }
}

export async function callMiniMaxWebSearch(query, systemPrompt = '你是一个信息收集专家，请搜索并总结相关内容。') {
  return await callMiniMax(
    [{ role: 'system', content: systemPrompt }, { role: 'user', content: `请搜索以下内容并提供结构化总结：${query}` }],
    MINIMAX_MODELS.m27,
    8000
  );
}

export async function extractFileContents(files) {
  if (!files || files.length === 0) return '';

  const { readFile } = await import('fs/promises');
  const results = await Promise.all(
    files.map(async (f) => {
      try {
        const content = await readFile(f.path, 'utf-8');
        const truncated = content.substring(0, 4000);
        return `【文件: ${f.filename}】\n${truncated}${content.length > 4000 ? '\n...(截断)' : ''}`;
      } catch {
        return `【文件: ${f.filename}】\n[无法读取文件]`;
      }
    })
  );
  return results.join('\n\n');
}

export async function callLLMWithTools({ messages, model = MINIMAX_MODELS.m27, maxTokens = 8000, tools = [] }) {
  const toolDefs = tools.map(t => ({
    type: 'function',
    function: {
      name: t.name,
      description: t.description,
      parameters: t.parameters,
    },
  }));

  if (model === MINIMAX_MODELS.m27 || model === MINIMAX_MODELS.coding_vlm) {
    return await callMiniMaxWithTools(messages, model, maxTokens, toolDefs);
  }

  throw new Error('工具调用当前仅支持 MiniMax 模型');
}
