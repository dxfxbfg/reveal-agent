import { registry } from '../registry.js';
import { queryCollection, queryAllCollections } from '../../rag/store.js';

export function registerChromaQueryTool() {
  registry.register(
    {
      name: 'chroma_query',
      description: '从本地 ChromaDB 向量知识库中检索与查询语义相关的内容片段。支持按素材类型（文本、代码、图片）分类检索，或跨所有类型检索。',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: '检索查询文本，应用自然语言描述你需要查找的内容',
          },
          collection: {
            type: 'string',
            description: '要检索的集合名称: skills / web_knowledge / compiled_knowledge，或填 all 跨所有集合检索',
          },
          topK: {
            type: 'number',
            description: '返回最相关的结果数量，默认 5',
          },
          type: {
            type: 'string',
            description: '素材类型: text（文本资料）/ code（代码片段）/ image（图片描述），不指定则检索全部类型',
            enum: ['text', 'code', 'image'],
          },
        },
        required: ['query'],
      },
    },
    async ({ query, collection = 'all', topK = 5, type = null }) => {
      const collectionMap = {
        'skills': 'reveal-agent-skills',
        'web_knowledge': 'web_knowledge',
        'compiled_knowledge': 'compiled_knowledge',
      };

      let result;
      if (collection === 'all') {
        result = await queryAllCollections(query, topK, type);
      } else {
        const colName = collectionMap[collection] || collection;
        if (type) {
          result = await queryCollection(query, colName, topK, type);
        } else {
          const results = await Promise.allSettled(
            ['text', 'code', 'image'].map(async (t) => {
              const r = await queryCollection(query, colName, topK, t);
              return r ? `\n### [${t}]\n${r}` : null;
            })
          );
          result = results
            .filter(r => r.status === 'fulfilled' && r.value)
            .map(r => r.value)
            .join('\n');
        }
      }

      if (!result) {
        return JSON.stringify({ results: [], note: '未找到相关内容' });
      }

      return result;
    }
  );
}