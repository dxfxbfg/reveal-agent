/**
 * Knowledge Compiler Agent — 知识编译
 *
 * 流水线完成后触发，将 ChromaDB 中的碎片知识消化编译成永久 Wiki。
 *
 * 流程:
 *   1. 从 web_knowledge 集合检索主题相关碎片
 *   2. LLM 深度消化 → 编译成结构化 Markdown
 *   3. 保存到 skills/compiled/ 目录
 *   4. 索引到 compiled_knowledge ChromaDB 集合
 */

import { writeFileSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { callLLM } from '../../backend/utils/llm-client.js';
import { MINIMAX_MODELS } from '../../backend/utils/ai-client.js';
import { queryCollection, indexDocument } from '../rag/store.js';
import { sanitizeFilename } from '../../backend/tools/utils.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const COMPILED_DIR = join(__dirname, '..', 'skills', 'compiled');

export async function compileKnowledge({ topic, sessionId, broadcast = null }) {
  if (!topic) {
    console.log('[compiler] 无 topic，跳过知识编译');
    return null;
  }

  console.log(`[compiler] 开始编译知识: "${topic.slice(0, 60)}"`);

  if (broadcast) {
    broadcast({ type: 'knowledge_compile', status: 'start', topic });
  }

  const fragments = await queryCollection(topic, 'web_knowledge', 10);
  if (!fragments) {
    console.log('[compiler] web_knowledge 集合中无相关内容，跳过');
    if (broadcast) broadcast({ type: 'knowledge_compile', status: 'skip', topic, reason: '无相关内容' });
    return null;
  }

  const prompt = [
    `## 编译主题`,
    topic,
    '',
    `## 碎片知识（从网络搜索收集）`,
    fragments,
    '',
    `请消化以上碎片知识，编译成结构化 Wiki 文档。直接输出 Markdown，不要其他内容。`,
  ].join('\n');

  const wikiContent = await callLLM({
    prompt,
    system: '你是知识编译专家。只输出结构化的 Markdown Wiki 文档。',
    model: MINIMAX_MODELS.m27,
    maxTokens: 8000,
  });

  if (!wikiContent || wikiContent.length < 100) {
    console.log('[compiler] LLM 编译结果过短，跳过保存');
    return null;
  }

  mkdirSync(COMPILED_DIR, { recursive: true });

  const filename = sanitizeFilename(topic);
  const filePath = join(COMPILED_DIR, `${filename}_${sessionId.slice(0, 8)}.md`);

  writeFileSync(filePath, wikiContent, 'utf-8');
  console.log(`[compiler] Wiki 已保存: ${filePath}`);

  if (broadcast) {
    broadcast({ type: 'knowledge_compile', status: 'done', topic, filename });
  }

  try {
    const indexResult = await indexDocument(wikiContent, filename, 'compiled_knowledge');
    console.log(`[compiler] 已索引到 compiled_knowledge: ${indexResult.indexed} chunks`);

    // 检测并合并相似文件
    await mergeSimilarFiles(topic, filename, sessionId);
  } catch (err) {
    console.warn('[compiler] 索引/合并失败:', err.message);
  }

  return { path: filePath, topic: filename };
}

async function mergeSimilarFiles(topic, currentFilename, sessionId) {
  const { readdirSync, readFileSync, unlinkSync, existsSync } = await import('fs');
  if (!existsSync(COMPILED_DIR)) return;

  const files = readdirSync(COMPILED_DIR).filter(f => f.endsWith('.md') && f !== `${currentFilename}_${sessionId.slice(0, 8)}.md`);
  if (files.length < 2) return;

  // 简单相似度检测：文件名前缀相同（同一个 topic 的 sanitizedName）
  const currentBase = sanitizeFilename(topic);
  const similar = files.filter(f => f.startsWith(currentBase));

  if (similar.length < 2) return;

  console.log(`[compiler] 发现 ${similar.length} 个相似文件，开始合并...`);

  // 合并所有相似文件
  const allContent = [];
  for (const file of similar) {
    try {
      const content = readFileSync(join(COMPILED_DIR, file), 'utf-8');
      allContent.push(content);
    } catch {}
  }

  // 调 LLM 合并去重
  const mergedContent = await mergeWithLLM(allContent, topic);

  if (!mergedContent || mergedContent.length < 200) {
    console.log('[compiler] 合并结果过短，跳过');
    return;
  }

  // 写合并文件
  const mergedFilename = `${currentBase}_merged_${Date.now().toString(36)}.md`;
  const mergedPath = join(COMPILED_DIR, mergedFilename);
  writeFileSync(mergedPath, mergedContent, 'utf-8');
  console.log(`[compiler] 已合并保存: ${mergedFilename}`);

  // 删除旧文件
  for (const file of similar) {
    try { unlinkSync(join(COMPILED_DIR, file)); } catch {}
  }
  console.log(`[compiler] 已删除 ${similar.length} 个碎片文件`);

  // 索引合并后的文件
  try {
    await indexDocument(mergedContent, mergedFilename, 'compiled_knowledge');
  } catch (err) {
    console.warn('[compiler] 合并文件索引失败:', err.message);
  }
}

async function mergeWithLLM(contents, topic) {
  const prompt = [
    '你是一个知识合并专家。将以下多个关于同一主题的碎片知识合并为一份完整、无重复的 Wiki。',
    '',
    `## 主题`,
    topic,
    '',
    '## 碎片知识',
    ...contents.map((c, i) => `### 片段 ${i + 1}\n${c.slice(0, 3000)}`),
    '',
    '## 要求',
    '- 去重合并相同信息',
    '- 保留所有独特内容',
    '- 按标准 Wiki 结构输出',
    '- 标注信息来源（如果原文有 URL）',
    '- 直接输出 Markdown',
  ].join('\n');

  try {
    return await callLLM({
      prompt,
      system: '你是知识合并专家。只输出结构化的 Markdown Wiki 文档。',
      model: MINIMAX_MODELS.m27,
      maxTokens: 8000,
    });
  } catch (err) {
    console.warn('[compiler] LLM 合并失败:', err.message);
    return null;
  }
}