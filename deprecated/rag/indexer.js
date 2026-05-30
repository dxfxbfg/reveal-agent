import { readFileSync, readdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { getCollection, resetCollection } from './chroma-client.js';
import { splitIntoChunks } from '../tools/utils.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SKILLS_DIR = join(__dirname, '..', '..', 'skills');

export async function indexSkills(force = false) {
  const collection = force ? await resetCollection() : await getCollection();

  if (!force) {
    const count = await collection.count();
    if (count > 0) {
      console.log(`[indexer] 集合已有 ${count} 条, 跳过索引`);
      return { indexed: 0, total: count };
    }
  }

  const files = readdirSync(SKILLS_DIR).filter((f) => f.endsWith('.md'));
  const allChunks = [];

  for (const file of files) {
    const content = readFileSync(join(SKILLS_DIR, file), 'utf-8');
    const chunks = splitIntoChunks(content, file);
    allChunks.push(...chunks);
  }

  if (allChunks.length === 0) {
    console.warn('[indexer] 无可索引内容');
    return { indexed: 0, total: 0 };
  }

  await indexDocuments(allChunks, collection);

  const totalCount = await collection.count();
  console.log(`[indexer] 索引完成: ${allChunks.length} 块, 总计 ${totalCount}`);

  return { indexed: allChunks.length, total: totalCount };
}

export async function indexDocument(content, source, collectionName = 'web_knowledge') {
  const collection = await getCollection(collectionName);
  const chunks = splitIntoChunks(content, source);

  if (chunks.length === 0) return { indexed: 0, total: 0 };

  await indexDocuments(chunks, collection);

  const count = await collection.count();
  console.log(`[indexer] 存入 "${source}" → ${collectionName}: ${chunks.length} 块, 总计 ${count}`);
  return { indexed: chunks.length, total: count };
}

async function indexDocuments(chunks, collection) {
  const batchSize = 20;

  for (let i = 0; i < chunks.length; i += batchSize) {
    const batch = chunks.slice(i, i + batchSize);
    const ids = batch.map((c) => c.id);
    const documents = batch.map((c) => c.text);
    const metadatas = batch.map((c) => c.metadata);

    await collection.add({ ids, documents, metadatas });
  }
}