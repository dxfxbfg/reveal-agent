const MINIMAX_API_KEY = process.env.MINIMAX_API_KEY || '';
const MINIMAX_API_URL = 'https://api.minimax.chat/v1/embeddings';

const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_EMBED_MODEL || 'bge-m3';

const LOCAL_DIM = 384;

let ollamaAvailable = null;
let ollamaCooldownUntil = 0;

export function getEmbeddingDim() {
  if (ollamaAvailable) return 1024;
  if (ollamaAvailable === null && Date.now() < ollamaCooldownUntil) return 1024;
  if (MINIMAX_API_KEY) return 1536;
  return LOCAL_DIM;
}

export async function checkOllama() {
  if (ollamaAvailable !== null) return ollamaAvailable;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    const resp = await fetch(`${OLLAMA_HOST}/api/embeddings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: OLLAMA_MODEL, prompt: 'test' }),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (resp.ok) {
      ollamaAvailable = true;
      console.log(`[embedder] Ollama ${OLLAMA_MODEL} 就绪 (1024维)`);
      return true;
    }
  } catch (err) {
    console.warn(`[embedder] Ollama 检测失败: ${err.message}`);
  }
  ollamaAvailable = false;
  console.log('[embedder] Ollama 不可用');
  return false;
}

export async function embed(texts) {
  const inputArray = Array.isArray(texts) ? texts : [texts];

  if (ollamaAvailable === null) await checkOllama();

  if (ollamaAvailable || (ollamaCooldownUntil > 0 && Date.now() < ollamaCooldownUntil)) {
    try {
      const vectors = await Promise.all(
        inputArray.map((text) => callOllamaEmbedding(text))
      );
      ollamaAvailable = true;
      ollamaCooldownUntil = 0;
      return vectors;
    } catch (err) {
      console.warn('[embedder] Ollama bge-m3 调用失败, 尝试下一个: ' + err.message);
      ollamaCooldownUntil = Date.now() + 30000;
    }
  }

  if (MINIMAX_API_KEY) {
    try {
      const vectors = await Promise.all(
        inputArray.map((text) => callMiniMaxEmbedding(text))
      );
      return vectors;
    } catch (err) {
      console.warn('[embedder] MiniMax embedding 失败, 回退到本地: ' + err.message);
    }
  }

  return inputArray.map((text) => localEmbed(text));
}

async function callOllamaEmbedding(text) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60000);
  const response = await fetch(`${OLLAMA_HOST}/api/embeddings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: OLLAMA_MODEL, prompt: text }),
    signal: controller.signal,
  });
  clearTimeout(timeout);

  if (!response.ok) {
    throw new Error(`Ollama embedding error (${response.status})`);
  }

  const data = await response.json();
  const vector = data.embedding;

  if (!vector || !Array.isArray(vector)) {
    throw new Error('Ollama embedding response 无效');
  }

  return vector;
}

async function callMiniMaxEmbedding(text) {
  const response = await fetch(MINIMAX_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${MINIMAX_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'minimax-embedding',
      input: [text],
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`MiniMax embedding API error (${response.status}): ${errText}`);
  }

  const data = await response.json();
  const vector = data.data?.[0]?.embedding;

  if (!vector || !Array.isArray(vector)) {
    throw new Error('MiniMax embedding response invalid');
  }

  return vector;
}

function tokenize(text) {
  const tokens = [];
  const lower = text.toLowerCase();

  const cjkRanges = /[\u4e00-\u9fff\u3400-\u4dbf\u3000-\u303f]/;
  let i = 0;
  while (i < lower.length) {
    if (cjkRanges.test(lower[i])) {
      if (i + 1 < lower.length && cjkRanges.test(lower[i + 1])) {
        tokens.push(lower[i] + lower[i + 1]);
      }
      if (i + 2 < lower.length && cjkRanges.test(lower[i + 2])) {
        tokens.push(lower[i + 1] + lower[i + 2]);
      }
      i++;
    } else {
      const match = lower.slice(i).match(/^[a-z0-9]+/);
      if (match) {
        if (match[0].length > 1) tokens.push(match[0]);
        i += match[0].length;
      } else {
        i++;
      }
    }
  }
  return tokens;
}

function localEmbed(text) {
  const vector = new Array(LOCAL_DIM).fill(0);
  const tokens = tokenize(text);

  for (const token of tokens) {
    let h1 = 0, h2 = 0;
    for (let i = 0; i < token.length; i++) {
      h1 = ((h1 << 5) - h1 + token.charCodeAt(i)) | 0;
      h2 = ((h2 << 7) + h2 + token.charCodeAt(i) * 31) | 0;
    }
    const idx1 = Math.abs(h1) % LOCAL_DIM;
    const idx2 = Math.abs(h2) % LOCAL_DIM;
    vector[idx1] += 1.0;
    vector[idx2] += 0.5;
  }

  const norm = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0));
  if (norm > 0) {
    return vector.map((v) => v / norm);
  }
  return vector;
}