import express from 'express';
import cors from 'cors';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import dotenv from 'dotenv';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import { runPipeline } from './pipeline.js';
import { initTools } from './tools/definitions/index.js';
import { run as runAnimationPPT } from '../agents/animation-ppt/index.js';
import { run as runAnimationFlowchart } from '../agents/animation-flowchart/index.js';
import { run as runConsultingHTML, runChat as runConsultingChat } from '../agents/consulting-html/index.js';
import { logger, printLoggerBanner } from './utils/logger.js';

dotenv.config();
printLoggerBanner();

const log = logger.child('server');

function genId() {
  return Math.random().toString(36).slice(2, 10);
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

// ─── 中间件 ───────────────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: '50mb' }));
const reactDistDir = path.join(__dirname, '..', 'front-react', 'dist');
app.use(express.static(reactDistDir));
log.info('使用 React 前端', { distDir: reactDistDir });

app.get('/', (_, res) => {
  res.sendFile(path.join(reactDistDir, 'index.html'));
});

// 文件上传
const uploadDir = path.join(__dirname, '..', 'uploads');
fs.mkdirSync(uploadDir, { recursive: true });
const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, uploadDir),
  filename: (_, file, cb) => {
    // file.originalname 在 Node.js 某些版本下被错误编码为 Latin-1
    // 用 Buffer 还原为正确的 UTF-8 字符串
    const name = Buffer.from(file.originalname, 'latin1').toString('utf8');
    cb(null, `${uuidv4()}-${name}`);
  },
});
const upload = multer({ storage, limits: { fileSize: 20 * 1024 * 1024 } });

// 输出目录
const outputDir = path.join(__dirname, '..', 'output');
fs.mkdirSync(outputDir, { recursive: true });

// 动画输出目录（隔离）
const animationOutputDir = path.join(__dirname, '..', 'output', 'animation');
fs.mkdirSync(animationOutputDir, { recursive: true });

// 咨询 HTML 输出目录（隔离）
const consultingOutputDir = path.join(__dirname, '..', 'output', 'consulting');
fs.mkdirSync(consultingOutputDir, { recursive: true });

// ─── WebSocket 广播 ───────────────────────────────────────
const clients = new Map(); // sessionId → Set<ws>

wss.on('connection', (ws, req) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const sessionId = url.searchParams.get('session') || 'default';

  if (!clients.has(sessionId)) {
    clients.set(sessionId, new Set());
  }
  const sessionClients = clients.get(sessionId);
  sessionClients.add(ws);

  ws.on('close', () => {
    sessionClients.delete(ws);
    if (sessionClients.size === 0) clients.delete(sessionId);
  });
  ws.on('error', () => {
    sessionClients.delete(ws);
    if (sessionClients.size === 0) clients.delete(sessionId);
  });
});

function broadcast(sessionId, data) {
  const sessionClients = clients.get(sessionId);
  if (!sessionClients) return;
  const msg = JSON.stringify(data);
  for (const ws of sessionClients) {
    if (ws.readyState === 1) {
      ws.send(msg);
    }
  }
}

// ─── API 路由 ─────────────────────────────────────────────

// 健康检查
app.get('/api/health', (_, res) => res.json({ status: 'ok' }));

// 生成（聊天消息触发 5-Agent 流水线，或修改已有 HTML）
app.post('/api/generate', async (req, res) => {
  const { sessionId, message, history = [], files = [], qualityTier = 'normal', currentHtml = '', model, apiUrl, apiKey } = req.body;
  if (!sessionId || !message) {
    return res.status(400).json({ error: 'sessionId and message required' });
  }

  const modelConfig = apiUrl && apiKey
    ? { type: 'custom', model: model || 'default', apiUrl, apiKey }
    : (model ? { model } : null);

  res.status(202).json({ accepted: true });

  try {
    const result = await runPipeline({ sessionId, message, history, files, qualityTier, currentHtml, modelConfig, broadcast: (data) => broadcast(sessionId, data), pageCount: req.body.pageCount || 10, enableFeedback: req.body.enableFeedback ?? true });

    const fileId = genId();
    broadcast(sessionId, { type: 'done', html: result.html, fileId });
    saveHtml(fileId, result.html);
  } catch (err) {
    log.error('pipeline error', err, { sessionId });
    broadcast(sessionId, { type: 'error', message: err.message });
  }
});

// 文件上传
app.post('/api/upload', upload.array('files', 10), (req, res) => {
  const taskId = req.body.taskId || req.body.sessionId || 'default';
  const uploaded = (req.files || []).map(f => {
    const name = f.filename.replace(/^[a-f0-9-]{36}-/, '');
    return {
      id: uuidv4(),
      filename: name,
      path: f.path,
      size: f.size,
      taskId,
    };
  });
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.json({ files: uploaded });
});

// 获取当前 HTML 预览
app.get('/api/preview/:sessionId', (req, res) => {
  const filePath = path.join(outputDir, `${req.params.sessionId}.html`);
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).json({ error: 'No preview found' });
  }
});

// 导出 HTML
app.get('/api/export/html/:fileId', (req, res) => {
  const filePath = path.join(outputDir, `${req.params.fileId}.html`);
  if (fs.existsSync(filePath)) {
    res.download(filePath, 'presentation.html');
  } else {
    res.status(404).json({ error: 'No file found' });
  }
});

// 导出 PDF
// ❌ 已彻底删除 puppeteer 后端方案 (2026-06-07)
// 自 2026-06-06 起前端 ExportPanel 改用浏览器原生 window.print() 方案。
// puppeteer 依赖（~300MB Chromium）从 backend/package.json 中移除。
// 旧 URL /api/export/pdf/:fileId 不再支持 — 会返回 410 Gone + 引导文案。

app.get('/api/export/pdf/:fileId', (_, res) => {
  res.status(410).json({
    error: 'Server-side PDF export has been removed. Please use the browser\'s print dialog (Cmd/Ctrl+P → Save as PDF) in the export panel.',
    removedAt: '2026-06-07',
    replacement: 'ExportPanel.jsx → window.print() in a new tab',
  });
});

// ─── Animation API（隔离端点）────────────────────────────

// PPT 动画生成
app.post('/api/generate-animation-ppt', async (req, res) => {
  const { sessionId, message, model, apiUrl, apiKey } = req.body;
  if (!sessionId || !message) {
    return res.status(400).json({ error: 'sessionId and message required' });
  }

  const modelConfig = apiUrl && apiKey
    ? { type: 'custom', model: model || 'default', apiUrl, apiKey }
    : (model ? { model } : null);

  res.status(202).json({ accepted: true });

  try {
    broadcast(sessionId, { type: 'agent_step', step: 'animation-ppt', message: '生成 PPT 动画...' });

    const html = await runAnimationPPT({ message, modelConfig });

    const filePath = path.join(animationOutputDir, `${sessionId}_ppt.html`);
    fs.writeFileSync(filePath, html, 'utf-8');
    log.info('animation-ppt saved', { sessionId, filePath });

    broadcast(sessionId, { type: 'done', html });
  } catch (err) {
    log.error('animation-ppt error', err, { sessionId });
    broadcast(sessionId, { type: 'error', message: err.message });
  }
});

// 流程图动画生成
app.post('/api/generate-animation-flowchart', async (req, res) => {
  const { sessionId, html: sourceHtml, message = '', model, apiUrl, apiKey } = req.body;
  if (!sessionId || !sourceHtml) {
    return res.status(400).json({ error: 'sessionId and html required' });
  }

  const modelConfig = apiUrl && apiKey
    ? { type: 'custom', model: model || 'default', apiUrl, apiKey }
    : (model ? { model } : null);

  res.status(202).json({ accepted: true });

  try {
    broadcast(sessionId, { type: 'agent_step', step: 'animation-flowchart', message: '生成流程图动画...' });

    const resultHtml = await runAnimationFlowchart({ html: sourceHtml, message, modelConfig });

    const filePath = path.join(animationOutputDir, `${sessionId}_flowchart.html`);
    fs.writeFileSync(filePath, resultHtml, 'utf-8');
    log.info('animation-flowchart saved', { sessionId, filePath });

    broadcast(sessionId, { type: 'done', html: resultHtml });
  } catch (err) {
    log.error('animation-flowchart error', err, { sessionId });
    broadcast(sessionId, { type: 'error', message: err.message });
  }
});

// 咨询-对话（多轮需求清理）
app.post('/api/consulting-chat', async (req, res) => {
  const { sessionId, message, history = [], files = [], deckType = 'general', model, apiUrl, apiKey, enableWebSearch = false } = req.body;
  if (!sessionId || !message) {
    return res.status(400).json({ error: 'sessionId and message required' });
  }

  const modelConfig = apiUrl && apiKey
    ? { type: 'custom', model: model || 'default', apiUrl, apiKey }
    : null;

  try {
    broadcast(sessionId, { type: 'agent_step', step: 'consulting-chat', message: enableWebSearch ? '搜索网络资料并分析需求...' : '分析需求...' });

    const result = await runConsultingChat({ message, history, files, deckType, modelConfig, enableWebSearch });

    broadcast(sessionId, {
      type: 'consulting_response',
      ready: result.ready,
      response: result.response,
      questions: result.questions,
      deckType: result.deckType,
      pageCount: result.pageCount,
      summary: result.summary,
      webSearchQueries: result.webSearchQueries || [],
      webContext: result.webContext || '',
    });

    res.json(result);
  } catch (err) {
    log.error('consulting-chat error', err, { sessionId });
    res.status(500).json({ error: err.message });
  }
});

// 咨询级 HTML 生成
app.post('/api/generate-consulting-html', async (req, res) => {
  const { sessionId, message, deckType = 'general', pageCount = 10, files = [], model, apiUrl, apiKey, enableWebSearch = false } = req.body;
  if (!sessionId || !message) {
    return res.status(400).json({ error: 'sessionId and message required' });
  }

  const modelConfig = apiUrl && apiKey
    ? { type: 'custom', model: model || 'default', apiUrl, apiKey }
    : (model ? { model } : null);

  res.status(202).json({ accepted: true });

  try {
    broadcast(sessionId, { type: 'agent_step', step: 'consulting-html', message: enableWebSearch ? '搜索网络资料并生成咨询级 HTML...' : '生成咨询级 HTML...' });

    const html = await runConsultingHTML({ message, deckType, pageCount, modelConfig, enableWebSearch });

    const filePath = path.join(consultingOutputDir, `${sessionId}.html`);
    fs.writeFileSync(filePath, html, 'utf-8');
    log.info('consulting-html saved', { sessionId, filePath });

    broadcast(sessionId, { type: 'done', html });
  } catch (err) {
    log.error('consulting-html error', err, { sessionId });
    broadcast(sessionId, { type: 'error', message: err.message });
  }
});

// ─── 启动 ─────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  log.info('backend running', { port: PORT, http: `http://localhost:${PORT}`, ws: `ws://localhost:${PORT}/ws?session=***` });
  initTools();
  log.info('tools initialized');
});
