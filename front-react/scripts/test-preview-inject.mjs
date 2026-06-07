#!/usr/bin/env node
// previewInjectScript 自检脚本
//
// 0 依赖：用 node 原生 assert + 直接 import ESM 模块（Node 18+ 支持）。
// 覆盖 buildPreviewScript 的关键边界：sanity fallback、脚本结构、postMessage 协议字符串。
//
// 跑法：
//   node front-react/scripts/test-preview-inject.mjs
//
// 改了 previewInjectScript.js 后跑一遍，立即知道有没有 regression。

import { strict as assert } from 'node:assert';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const modulePath = path.join(__dirname, '..', 'src', 'previewInjectScript.js');

let { buildPreviewScript } = await import(modulePath);

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

console.log('previewInjectScript self-test:');

// 1. 正常入参：restoreH=3, restoreV=1 应该内联进脚本
test('正常整数参数被内联进脚本', () => {
  const script = buildPreviewScript(3, 1);
  assert.match(script, /<script>/, '应包含 <script> 标签');
  assert.match(script, /<\/script>/, '应包含 </script> 闭合');
  assert.match(script, /var restoreH = 3;/, 'restoreH 应被内联为数字');
  assert.match(script, /var restoreV = 1;/, 'restoreV 应被内联为数字');
});

// 2. 0 是合法值（slide 0 是首页），不能被当成"未设置"
test('restoreH=0, restoreV=0 不被 fallback 覆盖', () => {
  const script = buildPreviewScript(0, 0);
  assert.match(script, /var restoreH = 0;/, 'restoreH=0 必须保留为 0');
  assert.match(script, /var restoreV = 0;/, 'restoreV=0 必须保留为 0');
});

// 3. NaN fallback 到 0
test('restoreH=NaN 时 fallback 到 0', () => {
  const script = buildPreviewScript(NaN, 0);
  assert.match(script, /var restoreH = 0;/, 'NaN 必须 fallback 到 0');
});

// 4. 负数 fallback 到 0
test('restoreH=-1 时 fallback 到 0', () => {
  const script = buildPreviewScript(-1, 0);
  assert.match(script, /var restoreH = 0;/, '负数必须 fallback 到 0');
});

// 5. 非整数（浮点）fallback 到 0
test('restoreH=2.5 时 fallback 到 0', () => {
  const script = buildPreviewScript(2.5, 0);
  assert.match(script, /var restoreH = 0;/, '非整数必须 fallback 到 0');
});

// 6. undefined fallback 到 0
test('restoreH=undefined 时 fallback 到 0', () => {
  const script = buildPreviewScript(undefined, undefined);
  assert.match(script, /var restoreH = 0;/, 'undefined 必须 fallback 到 0');
  assert.match(script, /var restoreV = 0;/, 'undefined 必须 fallback 到 0');
});

// 7. 字符串入参（前端 type coercion 漂移的常见来源）fallback 到 0
test('字符串 "5" 不被信任，fallback 到 0', () => {
  const script = buildPreviewScript('5', '0');
  assert.match(script, /var restoreH = 0;/, '字符串必须 fallback 到 0');
  assert.match(script, /var restoreV = 0;/, '字符串必须 fallback 到 0');
});

// 8. Infinity 是 Number.isInteger false，应 fallback
test('restoreH=Infinity 时 fallback 到 0', () => {
  const script = buildPreviewScript(Infinity, 0);
  assert.match(script, /var restoreH = 0;/, 'Infinity 必须 fallback 到 0');
});

// 9. postMessage 协议字符串必须存在（Preview.jsx 依赖这些做 nav 派发）
test('postMessage 协议字符串全部存在', () => {
  const script = buildPreviewScript(0, 0);
  // ready 握手
  assert.match(script, /revealReady/, 'ready 握手协议缺失');
  // nav 命令
  assert.match(script, /revealNav/, 'nav 命令协议缺失');
  // 错误上报
  assert.match(script, /revealError/, '错误上报协议缺失');
  // 索引变化上报
  assert.match(script, /revealSlideIdx/, '索引变化上报协议缺失');
});

// 10. nav 命令四条分支都覆盖（prev/next/first/last）
test('nav 命令 4 条分支都在脚本中', () => {
  const script = buildPreviewScript(0, 0);
  assert.match(script, /r\.prev\(\)/, 'prev 分支缺失');
  assert.match(script, /r\.next\(\)/, 'next 分支缺失');
  assert.match(script, /r\.slide\(0\)/, 'first 分支缺失');
  assert.match(script, /r\.slide\(r\.getTotalSlides\(\) - 1\)/, 'last 分支缺失');
});

// 11. 轮询超时兜底（25 次 × 200ms = 5s）
test('轮询超时上限 25 次（5s 兜底）', () => {
  const script = buildPreviewScript(0, 0);
  assert.match(script, /attempts > 25/, '超时上限必须是 25');
  assert.match(script, /setTimeout\(setup, 200\)/, '轮询间隔必须是 200ms');
  // 超时时必须发 revealReady:false
  assert.match(script, /revealReady: false/, '超时通知协议缺失');
});

// 12. 恢复逻辑：脚本内的 tryRestore 必须在 r.on('ready', ...) 里注册
test('tryRestore 通过 reveal.on("ready") 注册', () => {
  const script = buildPreviewScript(3, 1);
  assert.match(script, /r\.on\(['"]ready['"],\s*tryRestore\)/, 'tryRestore 注册方式错误');
});

// 13. 恢复逻辑兜底：旧版 reveal 没 r.on() 也要 setTimeout 调 tryRestore
test('旧版 reveal 无 on() 时 setTimeout 兜底', () => {
  const script = buildPreviewScript(0, 0);
  assert.match(script, /setTimeout\(tryRestore, 200\)/, '旧版 reveal 兜底缺失');
});

// 14. tryRestore 内的边界：restoreH 是非数字字符串时不应崩溃
test('tryRestore 内的 parseInt 容错逻辑存在', () => {
  const script = buildPreviewScript(0, 0);
  // 脚本里必须用 parseInt 二次校验
  assert.match(script, /parseInt\(restoreH, 10\)/, 'parseInt 二次校验缺失');
  assert.match(script, /parseInt\(restoreV, 10\)/, 'parseInt 二次校验缺失');
  // 必须检查 Number.isInteger
  assert.match(script, /Number\.isInteger/, 'Number.isInteger 校验缺失');
});

// 15. tryRestore 内的总张数上限保护（h2 >= total 不 slide）
test('tryRestore 有总张数上限保护', () => {
  const script = buildPreviewScript(0, 0);
  assert.match(script, /h2 >= total/, '总张数上限保护缺失');
  assert.match(script, /r\.getTotalSlides/, 'getTotalSlides 调用缺失');
});

// 16. 错误上报：window.onerror + unhandledrejection 都覆盖
test('onerror + unhandledrejection 都上报给父页面', () => {
  const script = buildPreviewScript(0, 0);
  assert.match(script, /addEventListener\(['"]error['"]/, 'window.onerror 监听缺失');
  assert.match(script, /addEventListener\(['"]unhandledrejection['"]/, 'unhandledrejection 监听缺失');
});

// 17. 点击翻页后备：点击 reveal 区域时 next()
test('点击翻页后备存在', () => {
  const script = buildPreviewScript(0, 0);
  assert.match(script, /querySelector\(['"]\.reveal['"]\)/, '.reveal 元素选择器缺失');
  assert.match(script, /addEventListener\(['"]click['"]/, 'click 监听缺失');
  // 点击时不能误触 a/button/input 等交互元素
  assert.match(script, /closest\(['"]a, button, input, textarea, select/, '交互元素过滤缺失');
});

// 18. slidechanged 索引上报
test('slidechanged 时上报当前索引', () => {
  const script = buildPreviewScript(0, 0);
  assert.match(script, /r\.on\(['"]slidechanged['"]/, 'slidechanged 监听缺失');
  assert.match(script, /r\.getIndices\(\)/, 'getIndices 调用缺失');
});

// 19. 输出始终是单行可拼的 <script> 块（不应有外部依赖 require/import）
test('脚本是自包含的（无外部 require/import）', () => {
  const script = buildPreviewScript(0, 0);
  assert.doesNotMatch(script, /\brequire\(/, '不应有 require() 调用');
  assert.doesNotMatch(script, /\bimport\s+/, '不应有 import 语句');
});

// 20. 数字转字符串后不含引号（防止 '3'; 变成字面字符串）
test('数字内联时不被加引号（应是裸数字，不是字符串字面量）', () => {
  const script = buildPreviewScript(3, 1);
  // 关键：内联应该是 var restoreH = 3; 而不是 var restoreH = "3";
  assert.match(script, /var restoreH = 3;/);
  assert.doesNotMatch(script, /var restoreH = ['"]3['"]/, '数字被加引号会导致脚本 parseInt 失败');
});

console.log(`\nresult: ${pass} passed, ${fail} failed`);
if (fail > 0) {
  console.log('\nfailures:');
  for (const { name, err } of failures) {
    console.log(`  - ${name}: ${err.message}`);
  }
  process.exit(1);
}
