/**
 * Info Collector Agent (v3 — 去掉 ChromaDB 依赖)
 *
 * 使用工具自主决策:
 *   1. web_search → 搜索互联网信息
 *   2. web_scrape → 抓取有价值网页的全文
 *
 * 搜索结果直接返回，不存 ChromaDB。每次搜索都是新鲜的。
 */

import { readFile } from 'fs/promises';
import { runAgentWithToolsStreaming } from '../../backend/tools/engine.js';
import { MINIMAX_MODELS } from '../../backend/utils/ai-client.js';

const TOOL_SYSTEM_PROMPT = `你是一个自主信息收集 Agent，拥有以下工具：

1. web_search — 搜索互联网，获取网页标题和摘要
2. web_scrape  — 抓取指定网页的完整正文内容

工作流程：
- 先用 web_search 搜索用户主题相关的多个 query
- 对搜索结果中看起来有价值的网页，用 web_scrape 抓取全文
- 最后输出一份结构化总结，包含：
  1. 核心概念和定义
  2. 关键技术或数据
  3. 不同观点或趋势
  4. 信息来源（标注 URL）

注意事项：
- 搜索时使用精确、多样的 query（中英文结合）
- 最多抓取 3 个最有价值的网页，避免过度爬取
- 最终总结要简洁、结构化，便于后续 Agent 使用`;

export async function run({ requirements = '', searchQueries = [], files = [], broadcast = null, modelConfig = null }) {
  const fileContext = await preprocessFiles(files);

  const searchPrompt = searchQueries.length > 0
    ? searchQueries.map((q, i) => `${i + 1}. ${q}`).join('\n')
    : '根据需求自行拟定搜索 query';

  const prompt = [
    `## 用户需求`,
    requirements,
    '',
    `## 用户上传的文件内容`,
    fileContext || '（无上传文件）',
    '',
    `## 建议搜索方向`,
    searchPrompt,
    '',
    `请按工作流程收集信息，最后输出结构化总结。`,
  ].join('\n');

  const result = await runAgentWithToolsStreaming({
    model: MINIMAX_MODELS.m27,
    system: TOOL_SYSTEM_PROMPT,
    prompt,
    toolNames: ['web_search', 'web_scrape'],
    maxTokens: 8000,
    onToolCall: (entry) => {
      if (broadcast) {
        broadcast({ type: 'tool_call', agent: 'info-collector', name: entry.name, args: entry.args, result: entry.result });
      }
    },
  });

  return {
    fileInsights: fileContext,
    webInsights: summarizeWebInsights(result.content),
    knowledgeInsights: '',
    sources: extractSources(result.content),
  };
}

function summarizeWebInsights(text) {
  if (!text || text.length < 500) return text || '';
  const lines = text.split('\n');
  const meaningful = lines.filter(l => {
    const t = l.trim();
    if (!t) return false;
    if (/^https?:\/\//.test(t)) return false;
    if (t.length < 5) return false;
    return true;
  });
  return meaningful.slice(0, 20).join('\n');
}

async function preprocessFiles(files) {
  if (!files || files.length === 0) return '';

  const CHUNK_SIZE = 2000;
  const textFiles = files.filter(f => /\.(txt|md|csv|json)$/i.test(f.filename || ''));
  if (textFiles.length === 0) return '';

  const results = await Promise.all(
    textFiles.map(async (f) => {
      try {
        const content = await readFile(f.path, 'utf-8');
        if (content.length <= CHUNK_SIZE) {
          return [`【文件: ${f.filename} (${content.length} 字符)】\n${content}`];
        }
        const chunks = [];
        let offset = 0;
        let chunkIdx = 1;
        while (offset < content.length) {
          chunks.push(`【文件: ${f.filename} 分块 ${chunkIdx}/${Math.ceil(content.length / CHUNK_SIZE)}】\n${content.substring(offset, offset + CHUNK_SIZE)}`);
          offset += CHUNK_SIZE;
          chunkIdx++;
        }
        return chunks;
      } catch {
        return [`【文件: ${f.filename}】\n[无法读取]`];
      }
    })
  );

  const allChunks = results.flat();
  const totalChars = allChunks.reduce((s, c) => s + c.length, 0);
  if (totalChars > 12000) {
    return allChunks.slice(0, Math.min(allChunks.length, 6)).join('\n\n') + '\n\n...(更多分块已省略)';
  }
  return allChunks.join('\n\n');
}

function extractSources(text) {
  if (!text) return [];
  const urls = text.match(/https?:\/\/[^\s\)]+/g) || [];
  return [...new Set(urls)].slice(0, 10);
}