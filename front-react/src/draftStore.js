// 草稿 LRU 存储 — 避免长期使用累积 localStorage 配额超限
//
// 数据结构：
// - 每个 task 的草稿：localStorage['ra_chat_draft_<taskId>'] = 草稿文本
// - LRU 索引：localStorage['ra_chat_draft_index'] = JSON 数组 [{ id, ts }]，
//   按 ts 倒序排列（最新访问在前），超过上限时按 ts 升序淘汰
//
// 调用方约定：
// - 打开 task/加载草稿时调 touch(taskId)
// - 保存草稿时调 save(taskId, text)，text 为空时移除
// - 任务被删除时调 cleanup(validTaskIds) 一次性清孤儿

const INDEX_KEY = 'ra_chat_draft_index';
const DRAFT_PREFIX = 'ra_chat_draft_';
const MAX_KEEP = 20;       // 最多保留 20 个 task 的草稿（按 task 数量 LRU）
const MAX_DRAFT_SIZE = 20 * 1024;  // 单条草稿最大 20KB（防止单 task 撑爆 localStorage）

const safeGet = (key) => {
  try { return localStorage.getItem(key); } catch { return null; }
};
const safeSet = (key, val) => {
  try { localStorage.setItem(key, val); } catch {}
};
const safeRemove = (key) => {
  try { localStorage.removeItem(key); } catch {}
};

// 把超过 size 上限的 text 截断到 MAX_DRAFT_SIZE（按字符切，避免 UTF-8 surrogate 被劈开）
// 截断发生在写盘前，用户输入框里的 text 不动，只是 localStorage 里存的是截断版
// 返回 { text, truncated }，truncated 标志给调用方弹提示用
const truncateDraft = (text) => {
  if (typeof text !== 'string') return { text: '', truncated: false };
  if (text.length <= MAX_DRAFT_SIZE) return { text, truncated: false };
  return {
    text: text.slice(0, MAX_DRAFT_SIZE) + '\n\n…[草稿已截断,完整内容请尽快发送]',
    truncated: true,
  };
};

const draftKey = (taskId) => `${DRAFT_PREFIX}${taskId}`;

const readIndex = () => {
  const raw = safeGet(INDEX_KEY);
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.filter(e => e && typeof e.id === 'string') : [];
  } catch { return []; }
};

const writeIndex = (idx) => {
  if (idx.length === 0) { safeRemove(INDEX_KEY); return; }
  safeSet(INDEX_KEY, JSON.stringify(idx));
};

// 更新索引中的某个 task 条目；不存在则添加
const touchIndex = (idx, taskId) => {
  const filtered = idx.filter(e => e.id !== taskId);
  filtered.unshift({ id: taskId, ts: Date.now() });
  return filtered;
};

// 加载草稿（同时 touch 该 task 到 LRU 最新位置）
export const load = (taskId) => {
  const text = safeGet(draftKey(taskId)) || '';
  if (text) {
    const idx = readIndex();
    writeIndex(touchIndex(idx, taskId));
  }
  return text;
};

// 保存草稿（text 为空等价于 remove）
// 每次写入都会触发 LRU 淘汰检查
// 返回 true 表示被截断（调用方可弹 toast 提示）
export const save = (taskId, text) => {
  if (!text) {
    safeRemove(draftKey(taskId));
    // 从索引中移除
    const idx = readIndex().filter(e => e.id !== taskId);
    writeIndex(idx);
    return { truncated: false };
  }
  // 单条 size 上限检查：超出截断后再写盘
  const { text: storedText, truncated } = truncateDraft(text);
  safeSet(draftKey(taskId), storedText);
  const idx = readIndex();
  const next = touchIndex(idx, taskId);
  // 超过上限就淘汰最老的
  if (next.length > MAX_KEEP) {
    const evicted = next.splice(MAX_KEEP);
    evicted.forEach(e => safeRemove(draftKey(e.id)));
  }
  writeIndex(next);
  return { truncated };
};

// 移除指定 task 的草稿（任务被删除时用）
export const remove = (taskId) => {
  safeRemove(draftKey(taskId));
  const idx = readIndex().filter(e => e.id !== taskId);
  writeIndex(idx);
};

// 清理孤儿草稿（task 列表里不存在的 id 直接清掉）
// validTaskIds: 当前活跃 task 的 id 集合
// orphanIds: 调用方从索引里算出的孤儿 id 列表（避免本模块再扫一遍 localStorage）
export const cleanupOrphans = (orphanIds) => {
  if (!orphanIds || orphanIds.length === 0) return 0;
  orphanIds.forEach(id => safeRemove(draftKey(id)));
  const idx = readIndex().filter(e => !orphanIds.includes(e.id));
  writeIndex(idx);
  return orphanIds.length;
};

// 调试用：导出当前 LRU 状态
export const debug = () => {
  const idx = readIndex();
  return {
    count: idx.length,
    maxKeep: MAX_KEEP,
    entries: idx.map(e => ({ id: e.id, age: Date.now() - e.ts })),
  };
};
