import { registry } from '../registry.js';
import { indexDocument } from '../../rag/store.js';

export function registerChromaStoreTool() {
  registry.register(
    {
      name: 'chroma_store',
      description: '将文本内容向量化后存入 ChromaDB 知识库，之后可通过 chroma_query 检索。用于持久化网络搜索获取的资料，形成可复用的知识积累。支持按素材类型（图片、文本、代码）分类存储。',
      parameters: {
        type: 'object',
        properties: {
          text: {
            type: 'string',
            description: '要存储的文本内容（网页正文、搜索结果摘要等）',
          },
          source: {
            type: 'string',
            description: '内容来源，如 URL、文件名或搜索 query',
          },
          title: {
            type: 'string',
            description: '内容标题，用于分类和检索时的标识',
          },
          collection: {
            type: 'string',
            description: '存储到哪个集合: web_knowledge（网络内容，默认）/ skills（技能文档）',
          },
          type: {
            type: 'string',
            description: '素材类型: text（文本资料）/ code（代码片段）/ image（图片描述或元数据）',
            enum: ['text', 'code', 'image'],
          },
        },
        required: ['text', 'source', 'title'],
      },
    },
    async ({ text, source, title, collection = 'web_knowledge', type = 'text' }) => {
      const content = `# ${title}\n\n${text}`;
      const result = await indexDocument(content, source, collection, type);

      return JSON.stringify({
        stored: result.indexed,
        totalInCollection: result.total,
        collection,
        type,
        source,
        title,
      });
    }
  );
}