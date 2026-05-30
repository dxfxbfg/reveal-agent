import { getCollection, hasData, resetCollection } from './chroma-client.js';
import { storeDocuments, queryDocuments, queryAllFileCollections, getFileStoreCount, hasFileStoreData, resetFileCollection } from './file-store.js';
import { indexSkills as indexSkillsChroma, indexDocument as indexDocumentChroma } from './indexer.js';
import { splitIntoChunks } from '../tools/utils.js';

let useChromaDB = false;
let ragReady = false;

export async function initStore() {
  try {
    const col = await getCollection('reveal-agent-skills');
    const count = await col.count();
    console.log(`[store] ChromaDB 可用, 向量数据库模式 (${count} 条)`);
    useChromaDB = true;
    return 'chromadb';
  } catch (err) {
    const msg = err.message.slice(0, 80);
    console.warn(`[store] ChromaDB 不可用 (${msg}...) → 降级为文件存储`);
    useChromaDB = false;
    return 'filestore';
  }
}

export function isUsingChromaDB() {
  return useChromaDB;
}

export async function indexSkills(force = false) {
  if (useChromaDB) {
    return await indexSkillsChroma(force);
  }

  const { readFileSync, readdirSync } = await import('fs');
  const { fileURLToPath } = await import('url');
  const { dirname, join } = await import('path');

  const __dirname = dirname(fileURLToPath(import.meta.url));
  const SKILLS_DIR = join(__dirname, '..', '..', 'skills');

  const existing = await getFileStoreCount('reveal-agent-skills');
  if (existing > 0 && !force) {
    console.log(`[store:file] 知识库已有 ${existing} 条，跳过索引`);
    return { indexed: 0, total: existing };
  }

  if (force) await resetFileCollection('reveal-agent-skills');

  const files = readdirSync(SKILLS_DIR).filter((f) => f.endsWith('.md'));
  const allChunks = [];

  for (const file of files) {
    const content = readFileSync(join(SKILLS_DIR, file), 'utf-8');
    const chunks = splitIntoChunks(content, file);
    allChunks.push(...chunks);
  }

  if (allChunks.length === 0) {
    console.warn('[store:file] 无可索引内容');
    return { indexed: 0, total: 0 };
  }

  const result = await storeDocuments(allChunks, 'reveal-agent-skills');
  console.log(`[store:file] 索引完成: ${result.indexed} 块, 总计 ${result.total}`);
  return result;
}

export async function indexDocument(content, source, collectionName = 'web_knowledge', materialType = 'text') {
  if (useChromaDB) {
    return await indexDocumentChroma(content, source, `${materialType}_${collectionName}`);
  }

  const chunks = splitIntoChunks(content, source);
  if (chunks.length === 0) return { indexed: 0, total: 0 };

  const result = await storeDocuments(chunks, collectionName, materialType);
  console.log(`[store:file] 存入 "${source}" → ${materialType}/${collectionName}: ${result.indexed} 块`);
  return result;
}

export async function queryCollection(query, collectionName, topK = 5, materialType = 'text') {
  try {
    if (useChromaDB) {
      const colName = `${materialType}_${collectionName}`;
      const col = await getCollection(colName);
      const count = await col.count();
      if (count === 0) return '';

      const results = await col.query({
        queryTexts: [query],
        nResults: Math.min(topK, count),
      });

      if (!results.documents || results.documents[0].length === 0) return '';

      const chunks = results.documents[0];
      const metadatas = results.metadatas[0];
      const distances = results.distances[0];

      return chunks
        .map((content, i) => {
          const meta = metadatas[i] || {};
          const distance = distances[i] || 0;
          const score = Math.max(0, 1 - distance).toFixed(3);
          return `【来源: ${meta.source || 'unknown'} | 相似度: ${score}】\n${content}`;
        })
        .join('\n\n');
    }

    return await queryDocuments(query, collectionName, topK, materialType);
  } catch (err) {
    console.error(`[store] queryCollection(${collectionName}, ${materialType}) 失败:`, err.message);
    return await queryDocuments(query, collectionName, topK, materialType);
  }
}

export async function queryAllCollections(query, topK = 3, materialType = null) {
  if (useChromaDB) {
    const types = materialType ? [materialType] : ['images', 'text', 'code'];
    const baseCollections = ['reveal-agent-skills', 'web_knowledge', 'compiled_knowledge'];
    
    const results = await Promise.allSettled(
      types.flatMap(type => 
        baseCollections.map(async (name) => {
          const result = await queryCollection(query, name, topK, type);
          if (!result) return null;
          return `\n### [${type}] ${name}\n${result}`;
        })
      )
    );

    return results
      .filter(r => r.status === 'fulfilled' && r.value)
      .map(r => r.value)
      .join('\n');
  }

  return await queryAllFileCollections(query, topK, materialType);
}

export async function initRAG() {
  if (ragReady) return;
  const mode = await initStore();

  const dataExists = useChromaDB
    ? await hasData()
    : await hasFileStoreData('reveal-agent-skills');

  if (!dataExists) {
    console.log(`[store] 无已有数据，开始索引 skills/ 目录...`);
    await indexSkills();
  } else {
    const count = useChromaDB
      ? await getCollection('reveal-agent-skills').then(c => c.count())
      : await getFileStoreCount('reveal-agent-skills');
    console.log(`[store] 知识库就绪: ${mode} 模式, ${count} 条记录`);
  }
  ragReady = true;
}

export async function queryRAG(query, topK = 5) {
  try {
    return await queryCollection(query, 'reveal-agent-skills', topK);
  } catch (err) {
    console.error('[store] queryRAG 错误:', err.message);
    return '';
  }
}