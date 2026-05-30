import { ChromaClient } from 'chromadb';

const CHROMA_HOST = process.env.CHROMA_HOST || 'localhost';
const CHROMA_PORT = process.env.CHROMA_PORT || '8000';

const DEFAULT_COLLECTION = 'reveal-agent-skills';

let client = null;
const collections = new Map();
let chromaEmbedFn = null;

class BGE3EmbeddingFunction {
  constructor() {
    this._ready = false;
    this._dim = 1024;
  }

  async _ensureReady() {
    if (this._ready) return;
    const { embed, checkOllama } = await import('./embedder.js');
    const available = await checkOllama();
    if (available) {
      this._embed = embed;
      console.log('[chroma] BGE-M3 嵌入函数就绪 (1024维)');
    }
    this._ready = true;
  }

  async generate(texts) {
    await this._ensureReady();
    if (this._embed) {
      const inputArray = Array.isArray(texts) ? texts : [texts];
      const vectors = await this._embed(inputArray);
      if (vectors && vectors.length > 0 && vectors[0].length === this._dim) {
        return vectors;
      }
      console.warn(`[chroma] 嵌入维度不匹配 (期望 ${this._dim}, 实际 ${vectors?.[0]?.length || 'unknown'}), 可能 Ollama/MiniMax 不可用，回退文件存储`);
      throw new Error(`嵌入维度不匹配: 期望 ${this._dim} 维`);
    }
    throw new Error('BGE-M3 不可用');
  }
}

async function getEmbeddingFunction() {
  if (!chromaEmbedFn) {
    chromaEmbedFn = new BGE3EmbeddingFunction();
  }
  return chromaEmbedFn;
}

async function getChromaClient() {
  if (client) return client;

  client = new ChromaClient({
    host: CHROMA_HOST,
    port: parseInt(CHROMA_PORT, 10),
    ssl: false,
  });

  return client;
}

export async function getCollection(name = DEFAULT_COLLECTION) {
  if (collections.has(name)) return collections.get(name);

  const c = await getChromaClient();
  const ef = await getEmbeddingFunction();

  try {
    const col = await c.getCollection({ name, embeddingFunction: ef });
    collections.set(name, col);
    return col;
  } catch {
    const col = await c.createCollection({
      name,
      metadata: { 'hnsw:space': 'cosine' },
      embeddingFunction: ef,
    });
    collections.set(name, col);
    return col;
  }
}

export async function resetCollection(name = DEFAULT_COLLECTION) {
  const c = await getChromaClient();
  try {
    await c.deleteCollection({ name });
  } catch {}
  collections.delete(name);
  const ef = await getEmbeddingFunction();
  const col = await c.createCollection({
    name,
    metadata: { 'hnsw:space': 'cosine' },
    embeddingFunction: ef,
  });
  collections.set(name, col);
  return col;
}

export async function hasData(name = DEFAULT_COLLECTION) {
  try {
    const col = await getCollection(name);
    const count = await col.count();
    return count > 0;
  } catch {
    return false;
  }
}

export async function getCollectionsStatus() {
  const names = [DEFAULT_COLLECTION, 'web_knowledge', 'compiled_knowledge'];
  const status = {};

  for (const name of names) {
    try {
      const col = await getCollection(name);
      status[name] = await col.count();
    } catch {
      status[name] = 0;
    }
  }

  return status;
}