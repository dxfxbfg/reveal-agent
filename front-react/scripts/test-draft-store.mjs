#!/usr/bin/env node
// draftStore 自检脚本
//
// 0 依赖：用 node 原生 assert + 直接 import ESM 模块（Node 18+ 支持）。
// 覆盖草稿 LRU 存储的关键不变量：MAX_KEEP 限流、20KB 截断、孤儿清理、
// 索引防漂移（损坏 JSON / 非数组 / 非对象条目）、自包含性。
//
// draftStore 依赖浏览器 localStorage，所以脚本顶部 shim 一个内存版的
// （覆盖 getItem / setItem / removeItem），每次 test() 之前重置。
//
// 跑法：
//   node front-react/scripts/test-draft-store.mjs
//
// 改了 draftStore.js 后跑一遍，立即知道有没有 regression。

import { strict as assert } from 'node:assert';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const modulePath = path.join(__dirname, '..', 'src', 'draftStore.js');

// ---------- localStorage shim（覆盖 4 个方法就够 draftStore 用了） ----------
function makeStorage() {
  const map = new Map();
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => { map.set(k, String(v)); },
    removeItem: (k) => { map.delete(k); },
    clear: () => { map.clear(); },
    _dump: () => Object.fromEntries(map),
  };
}

let storage = makeStorage();
globalThis.localStorage = storage;

// 动态 import（这样 shim 已经在 globalThis 上了，模块加载时能拿到）
let { load, save, remove, cleanupOrphans, debug } = await import(modulePath);

let pass = 0;
let fail = 0;
const failures = [];

function test(name, fn) {
  process.stdout.write(`  [..] ${name}\n`);
  try {
    fn();
    pass++;
    process.stdout.write(`  [ok] ${name}\n`);
  } catch (err) {
    fail++;
    failures.push({ name, err });
    process.stdout.write(`  [FAIL] ${name}: ${err.message}\n`);
  }
}

// 每个 test 之前清空 storage，避免互相污染
function reset() {
  storage.clear();
}

console.log('draftStore self-test:');

// 1. 加载不存在的 task → 返回空字符串
test('load 不存在的 task 返回空字符串', () => {
  reset();
  const text = load('nope');
  assert.equal(text, '', '不存在的 task 应返回空字符串');
});

// 2. load 不存在的 task 不该创建索引条目
test('load 不存在的 task 不创建索引条目', () => {
  reset();
  load('nope');
  const state = debug();
  assert.equal(state.count, 0, '不存在的 task 不应进 LRU 索引');
});

// 3. save 后再 load 能取回原文
test('save → load 往返一致', () => {
  reset();
  const { truncated } = save('t1', 'hello world');
  assert.equal(truncated, false, '短文本不应被截断');
  const text = load('t1');
  assert.equal(text, 'hello world', 'load 应返回 save 时的文本');
});

// 4. save 空文本等价于 remove（清 localStorage + 索引）
test('save 空文本等价于 remove', () => {
  reset();
  save('t1', 'first');
  assert.equal(debug().count, 1, 'save 文本后索引应有 1 条');
  save('t1', '');
  assert.equal(debug().count, 0, 'save 空文本后索引应清空');
  assert.equal(load('t1'), '', '草稿应被清掉');
});

// 5. 截断：正好 20480 字符（20KB）不截断
test('正好 20480 字符不截断', () => {
  reset();
  const text = 'a'.repeat(20480);
  const { truncated } = save('t1', text);
  assert.equal(truncated, false, '边界值 20480 不应截断');
  const stored = load('t1');
  assert.equal(stored.length, 20480, '20480 字符应原样存回');
  assert.ok(stored.startsWith('aaaa'), '应原样存回原文');
});

// 6. 截断：20481 字符触发截断
test('20481 字符触发截断 + 截断标记', () => {
  reset();
  const text = 'a'.repeat(20481);
  const { truncated } = save('t1', text);
  assert.equal(truncated, true, '20481 字符必须截断');
  const stored = load('t1');
  assert.ok(stored.length > 20480, '截断后长度应超过原文（多了截断标记）');
  assert.match(stored, /…\[草稿已截断/, '应包含截断提示文案');
});

// 7. 截断：超大文本（1MB）也要被截断
test('1MB 文本必须截断到 ≤ 20KB + 标记', () => {
  reset();
  const text = 'x'.repeat(1024 * 1024);
  const { truncated } = save('t1', text);
  assert.equal(truncated, true, '1MB 必须截断');
  const stored = load('t1');
  // 20KB + 截断标记 + 多写一个 'aaaa' 兜底（截断字符位置是 surrogate 安全）
  assert.ok(stored.length < 30 * 1024, '截断后应远小于 1MB（应 < 30KB）');
  assert.match(stored, /…\[草稿已截断/, '应包含截断提示');
});

// 8. 截断：非字符串输入（数字/null/undefined）走 fallback
test('truncateDraft 接收非字符串输入不崩', () => {
  reset();
  // save 内部会调 truncateDraft；这里直接传非字符串不抛错
  const cases = [42, null, undefined, {}, [], true];
  for (const c of cases) {
    const { truncated } = save('t1', c);
    // 内部会把 non-string 视为空，truncated=false 是预期（text 走空字符串分支）
    assert.equal(truncated, false, `save(${JSON.stringify(c)}) 不应标记 truncated`);
  }
  // load 出来的应为空字符串
  assert.equal(load('t1'), '', '非字符串 save 后 load 应为空');
});

// 9. LRU 限流：保存第 21 个 task 时，最老的被淘汰
test('LRU 限流：超过 MAX_KEEP=20 时最老的 task 被淘汰', () => {
  reset();
  // 依次保存 25 个 task 的草稿
  for (let i = 0; i < 25; i++) {
    save(`task-${i}`, `content-${i}`);
  }
  const state = debug();
  assert.equal(state.count, 20, '索引应只剩 20 条');
  assert.equal(state.maxKeep, 20, 'maxKeep 必须是 20');
  // 索引按 ts 倒序，最新的是 task-24
  assert.equal(state.entries[0].id, 'task-24', '最新 task 应在索引头部');
  // 最老的 task-0..4 已被淘汰
  for (let i = 0; i < 5; i++) {
    assert.equal(load(`task-${i}`), '', `task-${i} 应已被淘汰`);
  }
  // task-5..24 还在
  for (let i = 5; i < 25; i++) {
    assert.equal(load(`task-${i}`), `content-${i}`, `task-${i} 应保留`);
  }
});

// 10. LRU 限流：MAX_KEEP 字面量防漂移（这是关键回归保护）
test('MAX_KEEP 字面量是 20（防漂移）', () => {
  const src = fs.readFileSync(modulePath, 'utf8');
  // 必须有 `const MAX_KEEP = 20;` 这一行
  assert.match(src, /const\s+MAX_KEEP\s*=\s*20\s*;/, 'MAX_KEEP 必须保持为 20');
  // 必须有 `const MAX_DRAFT_SIZE = 20 * 1024;` 这一行
  assert.match(src, /const\s+MAX_DRAFT_SIZE\s*=\s*20\s*\*\s*1024\s*;/, 'MAX_DRAFT_SIZE 必须是 20*1024');
  // 截断标记文案不能漂移（用户能看到的提示）
  assert.match(src, /草稿已截断/, '截断标记文案必须保留');
});

// 11. LRU 顺序：touch 把已存在的 task 提到队首
test('load 同一 task 多次会把它移到 LRU 队首', () => {
  reset();
  save('a', 'aa');
  save('b', 'bb');
  save('c', 'cc');
  // 此时顺序应是 c, b, a
  assert.equal(debug().entries.map(e => e.id).join(','), 'c,b,a', '初始顺序');
  // touch a
  load('a');
  // 此时顺序应是 a, c, b
  assert.equal(debug().entries.map(e => e.id).join(','), 'a,c,b', 'load 后 a 应到队首');
});

// 12. LRU 限流：touch 之后保存 5 个新的，最老的不应是 a（a 是新激活的）
test('touch 之后老的被淘汰，touch 过的保留', () => {
  reset();
  // 先放 20 个
  for (let i = 0; i < 20; i++) save(`t-${i}`, `c-${i}`);
  // touch t-0
  load('t-0');
  // 再加 5 个新的
  for (let i = 20; i < 25; i++) save(`t-${i}`, `c-${i}`);
  // t-0 还在（因为刚 touch 过）
  assert.equal(load('t-0'), 'c-0', 't-0 应保留');
  // t-1..t-4 已被淘汰（最老的 4 个）
  for (let i = 1; i < 5; i++) {
    assert.equal(load(`t-${i}`), '', `t-${i} 应已被淘汰`);
  }
});

// 13. 孤儿清理：cleanupOrphans 删草稿 + 过滤索引 + 返回数量
test('cleanupOrphans 删草稿 + 过滤索引 + 返回数量', () => {
  reset();
  save('a', 'aa');
  save('b', 'bb');
  save('c', 'cc');
  // 当前活跃 task 只有 a 和 c，b 是孤儿
  const removed = cleanupOrphans(['b']);
  assert.equal(removed, 1, '应返回清理数量 1');
  assert.equal(load('a'), 'aa', 'a 应保留');
  assert.equal(load('b'), '', 'b 应被清掉');
  assert.equal(load('c'), 'cc', 'c 应保留');
  // 索引应只剩 a, c
  assert.equal(debug().count, 2, '索引应只剩 2 条');
});

// 14. 孤儿清理：空数组早返回 0
test('cleanupOrphans 空数组早返回 0', () => {
  reset();
  save('a', 'aa');
  const removed = cleanupOrphans([]);
  assert.equal(removed, 0, '空数组应返回 0');
  assert.equal(load('a'), 'aa', 'a 应保留');
});

// 15. 孤儿清理：传入非数组不崩
test('cleanupOrphans 接收非数组不崩', () => {
  reset();
  save('a', 'aa');
  // 非数组走早返回 0
  assert.equal(cleanupOrphans(null), 0, 'null 应返回 0');
  assert.equal(cleanupOrphans(undefined), 0, 'undefined 应返回 0');
  assert.equal(cleanupOrphans('garbage'), 0, '字符串应返回 0');
  assert.equal(load('a'), 'aa', 'a 应保留');
});

// 16. 索引防护：损坏的 JSON 回退到空数组
test('损坏 JSON 索引回退到空数组', () => {
  reset();
  // 手动写入损坏的 JSON
  storage.setItem('ra_chat_draft_index', '{not valid json');
  const state = debug();
  assert.equal(state.count, 0, '损坏 JSON 应回退到空索引');
});

// 17. 索引防护：非数组 JSON 回退到空数组
test('非数组 JSON 索引回退到空数组', () => {
  reset();
  storage.setItem('ra_chat_draft_index', JSON.stringify({ a: 1 }));
  const state = debug();
  assert.equal(state.count, 0, '非数组 JSON 应回退到空索引');
});

// 18. 索引防护：单条非对象条目被过滤
test('索引中单条非对象条目被过滤', () => {
  reset();
  storage.setItem('ra_chat_draft_index', JSON.stringify([
    { id: 't1', ts: 1000 },
    'garbage',
    null,
    42,
    { id: 't2', ts: 2000 },
    { /* no id */ ts: 3000 },
  ]));
  const state = debug();
  // 只有 t1 和 t2 留下
  assert.equal(state.count, 2, '应只剩 2 条合法对象');
  assert.ok(state.entries.find(e => e.id === 't1'), 't1 应保留');
  assert.ok(state.entries.find(e => e.id === 't2'), 't2 应保留');
});

// 19. remove：删草稿 + 从索引移除
test('remove 删草稿 + 从索引移除', () => {
  reset();
  save('t1', 'a');
  save('t2', 'b');
  remove('t1');
  assert.equal(load('t1'), '', 't1 草稿应被删');
  assert.equal(load('t2'), 'b', 't2 草稿应保留');
  assert.equal(debug().count, 1, '索引应只剩 1 条');
});

// 20. save 写盘后索引顺序：最新在头部
test('save 后最新 task 在索引头部', () => {
  reset();
  save('first', '1');
  // sleep 1ms 保证 ts 不同
  const start = Date.now();
  while (Date.now() - start < 2) {}
  save('second', '2');
  const entries = debug().entries;
  assert.equal(entries[0].id, 'second', '最新保存的应在头部');
  assert.equal(entries[1].id, 'first', '之前保存的应在后面');
});

// 21. 自包含性：draftStore 不依赖任何外部模块
test('draftStore 是自包含的（无 require/import）', () => {
  const src = fs.readFileSync(modulePath, 'utf8');
  // 源码里只允许顶部注释 + export
  // 不应有 require() / dynamic import()
  assert.doesNotMatch(src, /\brequire\(/, '不应有 require()');
  assert.doesNotMatch(src, /\bimport\s*\(/, '不应有动态 import()');
  // 不应有 npm 包名（粗略检测行首 import xxx from 'pkg'）
  const importLines = src.split('\n').filter(l => /^\s*import\b/.test(l));
  assert.equal(importLines.length, 0, '不应有静态 import 语句（应该是纯 ESM export 工具模块）');
});

// 22. 写盘 fail 防护：localStorage.setItem 抛错时 save 不应崩
test('localStorage.setItem 抛错时 save 不崩', () => {
  reset();
  // 替换 setItem 让它抛错
  const originalSetItem = storage.setItem;
  storage.setItem = () => { throw new Error('QuotaExceededError'); };
  // 这里 save 应该 try/catch 住，不抛到外面
  let threw = false;
  try {
    save('t1', 'hello');
  } catch {
    threw = true;
  }
  assert.equal(threw, false, 'setItem 抛错时 save 不应向外抛');
  storage.setItem = originalSetItem;
  // 恢复后能正常工作
  save('t1', 'hello-after');
  assert.equal(load('t1'), 'hello-after', '恢复后应能写盘');
});

console.log(`\nresult: ${pass} passed, ${fail} failed`);
if (fail > 0) {
  console.log('\nfailures:');
  for (const { name, err } of failures) {
    console.log(`  - ${name}: ${err.message}`);
  }
  process.exit(1);
}
