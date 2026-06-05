import { WS_URL } from './config.js';

const connections = new Map();
const listeners = {};

// 指数退避：1s → 2s → 4s → 8s → 16s → 30s（封顶） + ±20% 抖动
function nextBackoffMs(attempt) {
  const base = Math.min(30000, 1000 * Math.pow(2, attempt));
  const jitter = base * 0.2 * (Math.random() * 2 - 1);
  return Math.max(500, Math.floor(base + jitter));
}

export function connectWS(sessionId) {
  const existing = connections.get(sessionId);
  if (existing && existing.readyState === WebSocket.OPEN) return;

  if (existing) {
    cleanup(existing);
  }

  const ws = new WebSocket(`${WS_URL}?session=${sessionId}`);
  ws._sessionId = sessionId;
  ws._retries = 0;
  ws._reconnectTimer = null;
  ws._closed = false;       // 显式断开标记，避免与意外断开混用退避
  connections.set(sessionId, ws);

  ws.onopen = () => {
    ws._retries = 0; // 连接成功，重置计数
  };

  ws.onmessage = (e) => {
    try {
      const data = JSON.parse(e.data);
      data._sessionId = sessionId;
      (listeners[data.type] || []).forEach(fn => fn(data));
    } catch (err) {
      console.warn('[ws] 消息解析失败:', err.message);
    }
  };

  ws.onclose = () => {
    const sid = ws._sessionId || sessionId;
    if (ws._reconnectTimer) {
      clearTimeout(ws._reconnectTimer);
      ws._reconnectTimer = null;
    }
    cleanup(ws);
    if (connections.has(sid)) return;
    if (ws._closed) return;
    const delay = nextBackoffMs(ws._retries);
    ws._retries++;
    console.warn(`[ws] ${sid} 断开，${(delay/1000).toFixed(1)}s 后重试 (${ws._retries})`);
    ws._reconnectTimer = setTimeout(() => {
      ws._reconnectTimer = null;
      connectWS(sid);
    }, delay);
  };

  ws.onerror = () => { ws.close(); };
}

export function disconnectWS(sessionId) {
  const ws = connections.get(sessionId);
  if (!ws) return;
  ws._closed = true;
  if (ws._reconnectTimer) {
    clearTimeout(ws._reconnectTimer);
    ws._reconnectTimer = null;
  }
  cleanup(ws);
}

function cleanup(ws) {
  ws.onclose = null;
  ws.onerror = null;
  ws.onmessage = null;
  ws.onopen = null;
  const sid = ws._sessionId;
  if (connections.get(sid) === ws) {
    connections.delete(sid);
  }
  try { ws.close(); } catch (_) {}
}

export function on(event, fn) {
  if (!listeners[event]) listeners[event] = [];
  listeners[event].push(fn);
}

export function off(event, fn) {
  if (!listeners[event]) return;
  listeners[event] = listeners[event].filter(f => f !== fn);
}

export function getWs(sessionId) {
  return connections.get(sessionId) || null;
}
