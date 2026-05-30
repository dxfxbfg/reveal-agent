import { registry } from '../registry.js';

const REQUEST_TIMEOUT = 20000;
const MAX_CONTENT_LENGTH = 12000;

function stripHTML(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<nav[\s\S]*?<\/nav>/gi, '')
    .replace(/<footer[\s\S]*?<\/footer>/gi, '')
    .replace(/<header[\s\S]*?<\/header>/gi, '')
    .replace(/<[^>]+>/g, '\n')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .split('\n')
    .map(s => s.trim())
    .filter(s => s.length > 0)
    .join('\n')
    .replace(/\n{3,}/g, '\n\n');
}

async function fetchPage(url) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) reveal-agent/1.0',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('text/html') && !contentType.includes('text/plain')) {
      throw new Error(`不支持的内容类型: ${contentType}`);
    }

    return await response.text();
  } finally {
    clearTimeout(timeoutId);
  }
}

export function registerWebScrapeTool() {
  registry.register(
    {
      name: 'web_scrape',
      description: '抓取指定 URL 的网页正文内容，自动去除 HTML 标签、脚本和样式，提取纯文本。用于获取网页的详细内容进行分析。',
      parameters: {
        type: 'object',
        properties: {
          url: {
            type: 'string',
            description: '要抓取的网页 URL（完整地址，含 https://）',
          },
        },
        required: ['url'],
      },
    },
    async ({ url }) => {
      const html = await fetchPage(url);
      const text = stripHTML(html);
      const content = text.length > MAX_CONTENT_LENGTH
        ? text.slice(0, MAX_CONTENT_LENGTH) + '\n...(内容已截断)'
        : text;

      return JSON.stringify({ url, content, charCount: content.length });
    }
  );
}