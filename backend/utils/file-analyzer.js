/**
 * 智能文件分析器 — 识别文件类型并生成结构化的分析摘要
 *
 * 支持的格式:
 *   - 图片 (png/jpg/gif/webp/svg) → 视觉识别 (MiniMax abab6.5s)
 *   - PDF → pymupdf 全文提取 + 表格检测 + VLM 首页视觉确认
 *   - 代码 (js/py/java/ts/html/css/c/cpp/go/rs 等) → 语言检测 + 摘要
 *   - 数据 (csv/json) → 结构摘要
 *   - 文档 (md/txt) → 全文读取
 *   - DOCX/PPTX/XLSX → 文件名提示
 */

import { readFileSync, statSync } from 'fs';
import { extname, basename, dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { logger } from './logger.js';

const log = logger.child('file-analyzer');

const IMAGE_EXTS = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp', '.svg'];
const CODE_EXTS = ['.js', '.jsx', '.ts', '.tsx', '.py', '.java', '.c', '.cpp', '.h', '.hpp',
  '.go', '.rs', '.rb', '.php', '.swift', '.kt', '.scala', '.html', '.css', '.scss', '.less',
  '.vue', '.svelte', '.sh', '.bash', '.sql', '.r', '.m', '.yaml', '.yml', '.toml', '.xml'];
const DATA_EXTS = ['.json', '.csv', '.tsv'];
const DOC_EXTS = ['.txt', '.md', '.markdown', '.log'];
const PDF_EXT = '.pdf';
const BINARY_EXTS = ['.docx', '.doc', '.pptx', '.ppt', '.xlsx', '.xls', '.zip', '.rar'];

function isImage(ext) { return IMAGE_EXTS.includes(ext); }
function isCode(ext) { return CODE_EXTS.includes(ext); }
function isData(ext) { return DATA_EXTS.includes(ext); }
function isDoc(ext) { return DOC_EXTS.includes(ext); }
function isPDF(ext) { return ext === PDF_EXT; }
function isBinary(ext) { return BINARY_EXTS.includes(ext); }

function detectLang(ext) {
  const map = {
    '.js': 'JavaScript', '.jsx': 'React JSX', '.ts': 'TypeScript', '.tsx': 'React TSX',
    '.py': 'Python', '.java': 'Java', '.c': 'C', '.cpp': 'C++', '.h': 'C Header',
    '.go': 'Go', '.rs': 'Rust', '.rb': 'Ruby', '.php': 'PHP', '.swift': 'Swift',
    '.kt': 'Kotlin', '.html': 'HTML', '.css': 'CSS', '.scss': 'SCSS',
    '.vue': 'Vue', '.sh': 'Shell', '.sql': 'SQL', '.yaml': 'YAML', '.yml': 'YAML',
    '.json': 'JSON', '.xml': 'XML', '.toml': 'TOML',
  };
  return map[ext] || ext.slice(1).toUpperCase();
}

async function analyzeImage(filePath, filename) {
  try {
    const { readFileSync } = await import('fs');
    const buffer = readFileSync(filePath);
    const base64 = buffer.toString('base64');
    const ext = extname(filename).toLowerCase();
    const mimeMap = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
      '.gif': 'image/gif', '.webp': 'image/webp', '.bmp': 'image/bmp', '.svg': 'image/svg+xml' };
    const mime = mimeMap[ext] || 'image/png';

    // 调 MiniMax abab6.5s 视觉模型
    const MINIMAX_API_KEY = process.env.MINIMAX_API_KEY;
    if (!MINIMAX_API_KEY) return imageFallback(filename, buffer);

    const resp = await fetch('https://api.minimax.chat/v1/text/chatcompletion_v2', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MINIMAX_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'abab6.5s',
        messages: [{
          role: 'user',
          content: [
            { type: 'text', text: '请用2-3句话描述这张图片的内容。说明：图片展示什么、可能用于演示的什么部分（如封面、数据图表、流程图、架构图等），以及建议的演示用途。用中文回答。' },
            { type: 'image_url', image_url: { url: `data:${mime};base64,${base64}` } },
          ],
        }],
        temperature: 0.3,
        max_tokens: 500,
      }),
      signal: AbortSignal.timeout(30000),
    });

    if (!resp.ok) return imageFallback(filename, buffer);
    const data = await resp.json();
    const content = data.choices?.[0]?.message?.content || '';
    return content || imageFallback(filename, buffer);
  } catch {
    return imageFallback(filename, null);
  }
}

function imageFallback(filename, buffer) {
  const size = buffer ? `${(buffer.length / 1024).toFixed(1)}KB` : '未知大小';
  return `[图片文件: ${filename}, ${size}] 此图片可能包含图表/架构图/示意图/照片等。建议在演示中根据图片内容选择合适的页面类型：若为数据图表 → data 类型页 + Chart.js，若为架构图 → 流程图/架构页，若为示意图 → 内容页配合说明文字。`;
}

// ─── PDF 分析：调用 pdf_extract.py（pymupdf 全文提取）+ VLM 首页视觉确认 ─────────
async function analyzePDF(filePath, filename) {
  const size = (() => {
    try { return `${(statSync(filePath).size / 1024).toFixed(1)}KB`; }
    catch { return '未知大小'; }
  })();

  // ─── Step 1: 调用独立 Python 脚本提取全文 ────────────────────
  let extracted = null;
  try {
    const { execFile } = await import('child_process');
    const { promisify } = await import('util');
    const execFileAsync = promisify(execFile);

    // 脚本路径：与当前文件同目录
    const __dirname = dirname(fileURLToPath(import.meta.url));
    const extractScript = join(__dirname, 'pdf_extract.py');

    const result = await execFileAsync('python3', [extractScript, filePath], {
      timeout: 30000,
      maxBuffer: 2 * 1024 * 1024,
    });

    if (result.stderr) {
      log.warn('Python stderr', { stderr: result.stderr.slice(0, 500) });
    }

    // 解析 JSON，容忍 stdout 中可能夹带的非 JSON 前缀
    const raw = result.stdout.trim();
    // 找第一个 { 作为 JSON 起始
    const jsonStart = raw.indexOf('{');
    if (jsonStart >= 0) {
      extracted = JSON.parse(raw.slice(jsonStart));
    } else {
      log.warn('Python stdout 中未找到 JSON', { raw: raw.slice(0, 500) });
    }
  } catch (err) {
    log.warn('PDF 文本提取失败', { error: err.message });
    if (err.stdout) log.warn('Python stdout (in err)', { stdout: String(err.stdout).slice(0, 500) });
    if (err.stderr) log.warn('Python stderr (in err)', { stderr: String(err.stderr).slice(0, 500) });
  }

  // 检查提取是否成功
  if (extracted?.error) {
    log.warn('Python 脚本返回错误', { error: extracted.error });
    extracted = null;
  }

  const pageCount = extracted?.pageCount;
  const pdfTitle = extracted?.title || '';
  const pdfAuthor = extracted?.author || '';
  const pdfText = extracted?.text || '';
  const pdfTables = extracted?.tables || [];

  // ─── Step 2: 构建结构化摘要 ──────────────────────────────────
  const parts = [];

  if (pdfText && pdfText.length >= 200) {
    parts.push(`\n## 📄 PDF 全文分析: ${filename}`);
    parts.push(`页数: ${pageCount || '?'} | 大小: ${size}`);
    if (pdfTitle) parts.push(`标题: ${pdfTitle}`);
    if (pdfAuthor) parts.push(`作者: ${pdfAuthor}`);
    parts.push('');
    parts.push('### 论文正文（前15页全文提取）');
    parts.push('以下是 PDF 的真实文本内容。生成演示时必须以这些内容为准，不要编造：');
    parts.push('');
    parts.push(pdfText);
    parts.push('');

    if (pdfTables.length > 0) {
      parts.push('### 检测到的表格数据');
      parts.push('以下是 PDF 中提取的表格。将这些数据做成演示幻灯片中的表格或 Chart.js 图表：');
      parts.push('');
      pdfTables.forEach(t => { parts.push(t); parts.push(''); });
    }
  }

  // ─── Step 3: VLM 首页截图（补充视觉风格参考）──────────────────
  // ❌ 已彻底删除 (2026-06-07)
  // 此功能依赖 puppeteer 启动 Chromium 截取 PDF 首页，再用 MiniMax-VL 描述视觉风格。
  // 权衡：1) Chromium 依赖 ~300MB；2) 在小内存服务器上不稳定；3) 文本提取已能覆盖主要内容。
  // 决策：彻底删除 puppeteer 依赖。文本提取失败时降级为"仅文本提取"的提示。

  // 如果文本提取完全失败，标记
  if (!pdfText || pdfText.length < 200) {
    parts.push('\n⚠️ PDF 文本提取失败（仅依赖 pdf_extract.py，未启用 VLM 视觉识别作为后备）。建议用可复制文本的 PDF 重试。');
  }

  return parts.join('\n');
}

function analyzeCode(content, ext, filename) {
  const lang = detectLang(ext);
  const lines = content.split('\n').length;
  const firstLines = content.split('\n').slice(0, 30).join('\n');
  // 检测关键模式
  const hasImports = /^(import |require\(|from .+ import|#include)/m.test(firstLines);
  const hasClass = /\bclass\s+\w+/.test(content);
  const hasFunc = /\b(function|def |func |fn |async |public |private )/.test(content);

  let summary = `[代码文件: ${filename}, ${lang}, ${lines} 行`;
  if (hasImports) summary += ', 含导入/依赖';
  if (hasClass) summary += ', 含类定义';
  if (hasFunc) summary += ', 含函数定义';
  summary += ']\n\n';
  summary += '```' + (lang.toLowerCase()) + '\n' + firstLines + '\n```';
  
  if (lines > 30) summary += '\n...(仅展示前30行)';

  const usage = lang === 'HTML' || lang === 'CSS'
    ? '可直接作为演示页面的代码片段或样式参考'
    : '可作为演示中的代码示例页，配合 highlight.js 语法高亮展示';

  return { summary, usage };
}

function analyzeData(content, ext, filename) {
  let summary = `[数据文件: ${filename}]\n`;
  try {
    if (ext === '.json') {
      const parsed = JSON.parse(content);
      const keys = Object.keys(parsed);
      summary += `JSON 对象，顶层键: ${keys.slice(0, 10).join(', ')}`;
      if (Array.isArray(parsed)) summary += `, 数组长度: ${parsed.length}`;
    } else if (ext === '.csv') {
      const lines = content.trim().split('\n');
      const headers = lines[0]?.split(',') || [];
      summary += `CSV, ${lines.length} 行, 列: ${headers.slice(0, 8).join(', ')}`;
      if (lines.length > 1) summary += `\n示例数据: ${lines[1]}`;
    }
  } catch {
    summary += '无法解析数据结构，可能是格式有误';
  }
  return { summary, usage: '可作为演示中的数据页素材，使用 Chart.js 或表格呈现' };
}

// ─── 主入口 ──────────────────────────────────────────────

export async function analyzeFiles(files) {
  if (!files || files.length === 0) return '';

  const results = await Promise.all(files.slice(0, 5).map(async (f) => {
    const filename = f.filename || basename(f.path || '');
    const ext = extname(filename).toLowerCase();
    const base = { name: filename, size: f.size || 0, ext };

    try {
      if (isImage(ext)) {
        const desc = await analyzeImage(f.path, filename);
        return `## 📷 ${filename}\n**类型**: 图片 | **大小**: ${(f.size / 1024).toFixed(1)}KB\n**分析**: ${desc}`;
      }

      if (isPDF(ext)) {
        const desc = await analyzePDF(f.path, filename);
        return `## 📄 ${filename}\n${desc}`;
      }

      if (isData(ext)) {
        return `## 📊 ${filename}\n**类型**: 数据文件 (${ext.toUpperCase()}) | **大小**: ${((f.size || 0) / 1024).toFixed(1)}KB\n**处理**: 此数据文件将由数据分析 Agent 单独处理，生成图表和洞察。此处不展开原始数据。`;
      }

      if (isBinary(ext)) {
        return `## 📎 ${filename}\n**类型**: 二进制文档 (${ext.toUpperCase()}) | **大小**: ${((f.size || 0) / 1024).toFixed(1)}KB\n**提示**: 此文件格式无法直接读取。请描述核心内容，或转换为 PDF/图片格式。`;
      }

      const content = readFileSync(f.path, 'utf-8');
      const len = content.length;

      if (isCode(ext)) {
        const { summary, usage } = analyzeCode(content, ext, filename);
        return `## 💻 ${filename}\n${summary}\n**建议用途**: ${usage}`;
      }

      if (isDoc(ext)) {
        const truncated = len > 4000 ? content.slice(0, 4000) + '\n...(截断)' : content;
        return `## 📝 ${filename}\n**类型**: 文本文档 | **长度**: ${len} 字符\n\n${truncated}\n\n**建议用途**: 提取关键信息作为演示内容素材`;
      }

      // 无法识别
      const truncated = len > 2000 ? content.slice(0, 2000) : content;
      return `## 📎 ${filename}\n**类型**: ${ext} | **长度**: ${len} 字符\n\n${truncated}`;
    } catch (err) {
      return `## ❌ ${filename}\n无法读取: ${err.message}`;
    }
  }));

  return [
    '## 📋 参考文件分析',
    `共 ${results.length} 个文件，以下是智能分析结果：`,
    '',
    ...results,
  ].join('\n');
}
