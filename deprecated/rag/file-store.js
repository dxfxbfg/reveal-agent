import { readFileSync, writeFileSync, readdirSync, mkdirSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '..', '..', 'data', 'knowledge');

let embedFn = null;
let embeddingReady = null;

async function getEmbedFn() {
  if (embeddingReady !== null) return embedFn;
  try {
    const mod = await import('./embedder.js');
    const available = await mod.checkOllama();
    if (available) {
      embedFn = (texts) => mod.embed(texts);
      embeddingReady = true;
      console.log('[file-store] 向量检索模式: Ollama bge-m3 (1024维)');
    } else {
      embeddingReady = false;
      console.log('[file-store] 关键词检索模式 (无向量模型)');
    }
  } catch {
    embeddingReady = false;
    console.log('[file-store] 关键词检索模式');
  }
  return embedFn;
}

function ensureDir(dir) {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

const MATERIAL_TYPES = ['images', 'text', 'code'];

const collCounts = {};

function getMaterialTypeDir(type) {
  if (MATERIAL_TYPES.includes(type)) {
    return join(DATA_DIR, type);
  }
  return DATA_DIR;
}

export async function storeDocuments(chunks, collectionName = 'reveal-agent-skills', materialType = 'text') {
  const baseDir = getMaterialTypeDir(materialType);
  const collectionDir = join(baseDir, collectionName);
  
  const existing = readCollectionWithDir(collectionDir);

  const embedMod = await getEmbedFn();

  if (embedMod) {
    try {
      const texts = chunks.map((c) => c.text);
      const vectors = await embedMod(texts);

      const existingVectors = readVectorsWithDir(collectionDir) || [];
      existingVectors.push(...vectors);
      writeVectorsWithDir(collectionDir, existingVectors);
      console.log(`[file-store:${materialType}] 存入: ${chunks.length} 文本 + ${vectors.length} 向量 → ${collectionName}`);
    } catch (err) {
      console.warn(`[file-store:${materialType}] 向量化失败, 仅存文本: ${err.message}`);
      const vecFile = join(collectionDir, 'vectors.json');
      if (existsSync(vecFile)) {
        try { (await import('fs')).unlinkSync(vecFile); } catch (_) {}
      }
    }
  }

  existing.push(...chunks);
  writeCollectionWithDir(collectionDir, existing);
  const key = `${materialType}/${collectionName}`;
  collCounts[key] = existing.length;
  return { indexed: chunks.length, total: existing.length };
}

export async function queryDocuments(query, collectionName = 'reveal-agent-skills', topK = 5, materialType = 'text') {
  const baseDir = getMaterialTypeDir(materialType);
  const collectionDir = join(baseDir, collectionName);
  const documents = readCollectionWithDir(collectionDir);
  if (documents.length === 0) return '';

  const embedMod = await getEmbedFn();

  if (embedMod) {
    try {
      const storedVectors = readVectorsWithDir(collectionDir);
      if (storedVectors && storedVectors.length === documents.length) {
        const queryVecs = await embedMod([query]);
        const queryVec = queryVecs[0];

        const scored = documents.map((doc, i) => ({
          ...doc,
          score: cosineSim(queryVec, storedVectors[i]),
        }));

        scored.sort((a, b) => b.score - a.score);
        const top = scored.slice(0, topK).filter((d) => d.score > 0.15);

        if (top.length > 0) {
          return top
            .map((d) => {
              const meta = d.metadata || {};
              const source = meta.source || 'unknown';
              return `【来源: ${source} | 向量相似度: ${d.score.toFixed(4)}】\n${d.text}`;
            })
            .join('\n\n');
        }
      }
    } catch (err) {
      console.warn(`[file-store:${materialType}] 向量检索失败, 回退关键词: ${err.message}`);
    }
  }

  return keywordSearch(documents, query, topK);
}

function readCollectionWithDir(collectionDir) {
  ensureDir(collectionDir);
  const filePath = join(collectionDir, 'documents.json');
  if (!existsSync(filePath)) return [];
  try {
    return JSON.parse(readFileSync(filePath, 'utf-8'));
  } catch {
    return [];
  }
}

function writeCollectionWithDir(collectionDir, documents) {
  ensureDir(collectionDir);
  const filePath = join(collectionDir, 'documents.json');
  writeFileSync(filePath, JSON.stringify(documents, null, 2), 'utf-8');
}

function readVectorsWithDir(collectionDir) {
  const filePath = join(collectionDir, 'vectors.json');
  if (!existsSync(filePath)) return null;
  try {
    return JSON.parse(readFileSync(filePath, 'utf-8'));
  } catch {
    return null;
  }
}

function writeVectorsWithDir(collectionDir, vectors) {
  ensureDir(collectionDir);
  const filePath = join(collectionDir, 'vectors.json');
  writeFileSync(filePath, JSON.stringify(vectors, null, 2), 'utf-8');
}

export async function queryAllFileCollections(query, topK = 3, materialType = null) {
  let searchDirs;
  
  if (materialType && MATERIAL_TYPES.includes(materialType)) {
    searchDirs = [join(DATA_DIR, materialType)];
  } else {
    searchDirs = MATERIAL_TYPES.map(type => join(DATA_DIR, type));
  }

  const results = [];
  
  for (const baseDir of searchDirs) {
    if (!existsSync(baseDir)) continue;
    
    const type = baseDir.split('/').pop();
    const collections = readdirSync(baseDir, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name);

    for (const name of collections) {
      const result = await queryDocuments(query, name, topK, type);
      if (result) results.push(`\n### [${type}] ${name}\n${result}`);
    }
  }

  return results.join('\n');
}

export async function getFileStoreCount(collectionName, materialType = 'text') {
  const key = `${materialType}/${collectionName}`;
  if (collCounts[key] !== undefined) return collCounts[key];
  
  const baseDir = getMaterialTypeDir(materialType);
  const collectionDir = join(baseDir, collectionName);
  const documents = readCollectionWithDir(collectionDir);
  collCounts[key] = documents.length;
  return documents.length;
}

export async function hasFileStoreData(collectionName, materialType = 'text') {
  return (await getFileStoreCount(collectionName, materialType)) > 0;
}

export async function resetFileCollection(collectionName, materialType = 'text') {
  const baseDir = getMaterialTypeDir(materialType);
  const collectionDir = join(baseDir, collectionName);
  writeCollectionWithDir(collectionDir, []);
  const vecFile = join(collectionDir, 'vectors.json');
  try {
    const { unlinkSync } = await import('fs');
    if (existsSync(vecFile)) unlinkSync(vecFile);
  } catch (_) {}
  const key = `${materialType}/${collectionName}`;
  collCounts[key] = 0;
}

function cosineSim(a, b) {
  if (!a || !b || a.length !== b.length) return 0;
  let dot = 0, magA = 0, magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  magA = Math.sqrt(magA);
  magB = Math.sqrt(magB);
  if (magA === 0 || magB === 0) return 0;
  return dot / (magA * magB);
}

function keywordSearch(documents, query, topK) {
  const queryTerms = tokenizeQuery(query);

  const scored = documents.map((doc) => ({
    ...doc,
    score: keywordScore(queryTerms, doc.text),
  }));

  scored.sort((a, b) => b.score - a.score);
  const top = scored.slice(0, topK).filter((d) => d.score > 0);

  if (top.length === 0) return '';

  return top
    .map((d) => {
      const meta = d.metadata || {};
      const source = meta.source || 'unknown';
      return `【来源: ${source} | 匹配度: ${d.score.toFixed(2)}】\n${d.text}`;
    })
    .join('\n\n');
}

function tokenizeQuery(query) {
  const tokens = [];
  const lower = query.toLowerCase();

  const cjkRanges = /[\u4e00-\u9fff\u3400-\u4dbf\u3000-\u303f]/;
  let i = 0;
  while (i < lower.length) {
    if (cjkRanges.test(lower[i])) {
      tokens.push(lower[i]);
      if (i + 1 < lower.length && cjkRanges.test(lower[i + 1])) {
        tokens.push(lower[i] + lower[i + 1]);
      }
      i++;
    } else {
      const match = lower.slice(i).match(/^[a-z0-9]+/);
      if (match) {
        tokens.push(match[0]);
        i += match[0].length;
      } else {
        i++;
      }
    }
  }

  return tokens.filter((t) => t.length >= 1 && !/^(的|了|是|在|和|与|或|the|a|an|is|are|was|were|be|to|of|in|for|on|with|at|by|from|and|or|but|not|this|that|it|as|has|have)$/i.test(t));
}

function keywordScore(queryTokens, text) {
  const lower = text.toLowerCase();
  let score = 0;

  for (const token of queryTokens) {
    const count = (lower.match(new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')) || []).length;

    if (count > 0) {
      score += Math.log(1 + count) / Math.log(2);

      const exactMatch = lower.includes(' ' + token + ' ') ||
                         lower.startsWith(token + ' ') ||
                         lower.endsWith(' ' + token) ||
                         lower === token;
      if (exactMatch) score += 1.5;
    }
  }

  const titleMatch = text.split('\n')[0] || '';
  for (const token of queryTokens) {
    if (titleMatch.toLowerCase().includes(token)) {
      score += 0.5;
    }
  }

  return score;
}