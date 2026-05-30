import { WS_URL } from './config.js';

const connections = new Map();
const listeners = {};

export function connectWS(sessionId) {
  const existing = connections.get(sessionId);
  if (existing && existing.readyState === WebSocket.OPEN) return;

  if (existing) {
    cleanup(existing);
  }

  const ws = new WebSocket(`${WS_URL}?session=${sessionId}`);
  ws._sessionId = sessionId;
  ws._retries = 0;
  connections.set(sessionId, ws);

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
    cleanup(ws);
    if (connections.has(sid)) return;
    if (ws._retries < 5) {
      ws._retries++;
      console.warn(`[ws] ${sid} 断开，2s 后重试 (${ws._retries}/5)`);
      setTimeout(() => connectWS(sid), 2000);
    }
  };

  ws.onerror = () => { ws.close(); };
}

function cleanup(ws) {
  ws.onclose = null;
  ws.onerror = null;
  ws.onmessage = null;
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
