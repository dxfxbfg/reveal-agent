import { registry } from '../registry.js';
import { callMiniMaxWebSearch } from '../../utils/llm-client.js';

export function registerWebSearchTool() {
  registry.register(
    {
      name: 'web_search',
      description: '在互联网上搜索与查询相关的信息，返回网页标题、URL 和内容摘要。适用于获取最新资讯、事实数据和背景资料。',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: '搜索查询词，应精确描述需要查找的内容',
          },
          maxResults: {
            type: 'number',
            description: '最大搜索结果数，默认 5',
          },
        },
        required: ['query'],
      },
    },
    async ({ query, maxResults = 5 }) => {
      const systemPrompt = [
        '你是一个信息收集专家。请搜索并总结相关内容。',
        '格式要求：',
        '1. 每条结果包含【标题】和【摘要】',
        '2. 摘要不超过 3 句话',
        '3. 如有可能，标注信息来源',
        `4. 最多返回 ${maxResults} 条结果`,
      ].join('\n');

      const result = await callMiniMaxWebSearch(query, systemPrompt);

      const lines = result.split('\n').filter(Boolean);
      const parsed = [];
      let current = null;

      for (const line of lines) {
        const titleMatch = line.match(/^(?:#{1,3}\s*|(?:\d+[\.\)、]\s*)|【)(.+?)(?:】)?$/);
        if (titleMatch) {
          if (current) parsed.push(current);
          current = { title: titleMatch[1].trim(), snippet: '', url: '' };
        } else if (current) {
          current.snippet += (current.snippet ? ' ' : '') + line.trim();
        }
      }
      if (current) parsed.push(current);

      if (parsed.length === 0) {
        return JSON.stringify([{ title: '搜索结果', snippet: result.slice(0, 500), url: '' }]);
      }

      return JSON.stringify(parsed.slice(0, maxResults));
    }
  );
}