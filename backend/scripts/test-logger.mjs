#!/usr/bin/env node
// logger 自检脚本
//
// 0 依赖：用 node 原生 assert + child_process 拉起 logger 在子进程里跑，捕获 stdout/stderr。
// 覆盖 8 个核心场景，任何一个失败整个脚本退出码非 0。
//
// 跑法：
//   node backend/scripts/test-logger.mjs
//   LOG_FORMAT=json node backend/scripts/test-logger.mjs
//
// 改了 logger.js 后跑一遍，立即知道有没有 regression。

import { strict as assert } from 'node:assert';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const loggerPath = path.join(__dirname, '..', 'utils', 'logger.js');

// 跑一个子进程，加载 logger 后执行回调（回调通过 stdin 喂入代码字符串）
// 返回 { stdout, stderr, exitCode }
function runLoggerSubprocess(code, env = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, ['-e', `
      import('${loggerPath}').then(({ logger, printLoggerBanner }) => {
        ${code}
      });
    `], {
      env: { ...process.env, ...env },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (d) => { stdout += d.toString(); });
    child.stderr.on('data', (d) => { stderr += d.toString(); });
    child.on('close', (exitCode) => resolve({ stdout, stderr, exitCode }));
    child.on('error', reject);
  });
}

let pass = 0;
let fail = 0;
const failures = [];

async function test(name, fn) {
  process.stdout.write(`  [..] ${name}\n`);
  try {
    await fn();
    pass++;
    process.stdout.write(`  [ok] ${name}\n`);
  } catch (err) {
    fail++;
    failures.push({ name, err });
    process.stdout.write(`  [FAIL] ${name}: ${err.message}\n`);
  }
}

console.log('logger self-test:');

// 1. 子 tag 输出
await test('child tag 出现在 [tag] 位置', async () => {
  const { stdout } = await runLoggerSubprocess(`
    logger.child('test').info('hello');
  `);
  assert.match(stdout, /\[test\]/);
  assert.match(stdout, /hello/);
});

// 2. 嵌套子 tag
await test('child("a").child("b") 嵌套为 [a:b]', async () => {
  const { stdout } = await runLoggerSubprocess(`
    logger.child('parent').child('child').info('nested');
  `);
  assert.match(stdout, /\[parent:child\]/);
});

// 3. LOG_LEVEL 过滤（debug 默认被丢弃）
await test('LOG_LEVEL=info 时 debug 被过滤', async () => {
  const { stdout } = await runLoggerSubprocess(`
    logger.child('t').debug('should not appear');
    logger.child('t').info('should appear');
  `);
  assert.doesNotMatch(stdout, /should not appear/);
  assert.match(stdout, /should appear/);
});

// 4. LOG_LEVEL=debug 时 debug 出现
await test('LOG_LEVEL=debug 时 debug 出现', async () => {
  const { stdout } = await runLoggerSubprocess(`
    logger.child('t').debug('debug-visible');
  `, { LOG_LEVEL: 'debug' });
  assert.match(stdout, /debug-visible/);
});

// 5. JSON 模式输出单行合法 JSON
await test('LOG_FORMAT=json 时输出单行合法 JSON', async () => {
  const { stdout } = await runLoggerSubprocess(`
    logger.child('json-test').info('json mode', { x: 1 });
  `, { LOG_FORMAT: 'json' });
  const lines = stdout.trim().split('\n').filter(Boolean);
  assert.equal(lines.length, 1, `应为 1 行 JSON，实际 ${lines.length}`);
  const obj = JSON.parse(lines[0]);
  assert.equal(obj.level, 'info');
  assert.equal(obj.tag, 'json-test');
  assert.equal(obj.message, 'json mode');
  assert.equal(obj.x, 1);
});

// 6. ctx 字段防护：ctx.level 不能覆盖 logger 内置 level
await test('JSON 模式下 ctx.level 不覆盖 logger 内置 level', async () => {
  const { stdout } = await runLoggerSubprocess(`
    logger.child('protect').info('msg', { level: 999, tier: 'd1' });
  `, { LOG_FORMAT: 'json' });
  const obj = JSON.parse(stdout.trim());
  assert.equal(obj.level, 'info', `level 字段被 ctx 覆盖！实际值: ${obj.level}`);
  assert.equal(obj.tier, 'd1', 'tier 字段应保留');
});

// 7. Error 对象自动展平
await test('Error 实例自动展平为 {name, message, stack}', async () => {
  // error 级别走 stderr，不是 stdout
  const { stdout, stderr } = await runLoggerSubprocess(`
    logger.child('err-test').error('fail', new Error('boom'), { sessionId: 's1' });
  `, { LOG_FORMAT: 'json' });
  assert.equal(stdout.trim(), '', 'error 应走 stderr，stdout 应空');
  const obj = JSON.parse(stderr.trim());
  assert.equal(obj.level, 'error');
  assert.equal(obj.error.name, 'Error');
  assert.equal(obj.error.message, 'boom');
  assert.match(obj.error.stack, /Error: boom/);
  assert.equal(obj.sessionId, 's1');
});

// 8. printLoggerBanner 输出包含 format / minLevel
await test('printLoggerBanner 输出包含 format 和 minLevel 字段', async () => {
  const { stdout } = await runLoggerSubprocess(`
    printLoggerBanner();
  `, { LOG_FORMAT: 'json', LOG_LEVEL: 'debug' });
  const obj = JSON.parse(stdout.trim());
  assert.equal(obj.format, 'json');
  assert.equal(obj.minLevel, 'debug');
  assert.equal(obj.message, 'logger initialized');
});

// 9. error 级别走 stderr，info 级别走 stdout
await test('error/fatal 走 stderr，info/warn 走 stdout', async () => {
  const { stdout, stderr } = await runLoggerSubprocess(`
    logger.child('stream').info('to-stdout');
    logger.child('stream').warn('to-stdout-too');
    logger.child('stream').error('to-stderr');
    logger.child('stream').fatal('to-stderr-too');
  `);
  assert.match(stdout, /to-stdout/);
  assert.match(stdout, /to-stdout-too/);
  assert.doesNotMatch(stdout, /to-stderr/);
  assert.doesNotMatch(stdout, /to-stderr-too/);
  assert.match(stderr, /to-stderr/);
  assert.match(stderr, /to-stderr-too/);
});

// 10. ctx 内含 undefined 值能安全处理
await test('ctx 内 undefined 不抛错', async () => {
  const { stdout } = await runLoggerSubprocess(`
    logger.child('undef').info('msg', { val: undefined, ok: 1 });
  `, { LOG_FORMAT: 'json' });
  // undefined 在 JSON.stringify 时会被丢弃，所以期望 obj.ok == 1 且无 val 字段
  const obj = JSON.parse(stdout.trim());
  assert.equal(obj.ok, 1);
  assert.equal(obj.val, undefined);
});

console.log(`\nresult: ${pass} passed, ${fail} failed`);
if (fail > 0) {
  console.log('\nfailures:');
  for (const { name, err } of failures) {
    console.log(`  - ${name}: ${err.message}`);
  }
  process.exit(1);
}
process.exit(0);
