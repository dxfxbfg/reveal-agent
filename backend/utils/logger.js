//轻量级结构化日志工具
//
//目标：把 backend/ 里散乱的 console.log/error/warn统一收敛，方便运维 grep / 按级别过滤 / 按组件聚合
//
//特性：
// -5 个级别：debug / info / warn / error / fatal
// - 每条日志带 ISO 时间戳 +级别 +组件标签（[tag]）+消息
// -第二个参数支持附加上下文对象（HTTP 请求/任务 ID/文件路径/错误对象）
// → 在 JSON模式下会展开成结构化字段；plain模式下会追加在尾部用 [k=v] 表示
// - 输出格式受 LOG_FORMAT 环境变量控制：
// LOG_FORMAT=json → 单行 JSON（适合日志聚合系统）
// LOG_FORMAT=plain →人类可读（默认，开发时用）
// 未设置时默认 plain
// -最低级别受 LOG_LEVEL 控制（debug < info < warn < error < fatal），低于此级别的日志被丢弃
// 未设置时默认 info
// -错误对象会被特殊处理：把 err.message / err.stack 自动展开
// - JSON模式下，logger 内置字段（ts/level/tag/message）保留优先级，不会被 ctx覆盖
//
//迁移路径（drop-in替换）：
// import { logger } from './utils/logger.js';
// const log = logger.child('pipeline');
// log.info('Saved to', filePath);
// log.error('Pipeline failed', err, { sessionId, fileId });
// //旧：console.log('[pipeline] Saved to', filePath);
//
// 设计取舍：
// - 不引外部依赖（pino / winston），避免增加 backend node_modules体积
// （上次迭代后端才 -250MB，这次不要回退）
// -同步输出到 stdout/stderr：调试时无缓冲，但生产可通过进程外重定向
// - 不带 file/line 号定位（避免 V8性能抖动 +调试定位靠 tag 就够）
// -线程/会话 ID 不在 logger内部维护，调用方按需附加到 ctx

const LEVELS = { debug:10, info:20, warn:30, error:40, fatal:50 };
const DEFAULT_LEVEL = 'info';
const DEFAULT_FORMAT = 'plain';
// logger 内置字段，ctx 中的同名 key不会覆盖它们
const RESERVED_FIELDS = ['ts', 'level', 'tag', 'message'];

const envLevel = (process.env.LOG_LEVEL || '').toLowerCase();
const envFormat = (process.env.LOG_FORMAT || '').toLowerCase();

const minLevel = LEVELS[envLevel] ?? LEVELS[DEFAULT_LEVEL];
const jsonMode = envFormat === 'json';

//错误对象标准化：返回 { message, stack, name } 三件套
const serializeError = (err) => {
 if (err instanceof Error) {
 return {
 name: err.name,
 message: err.message,
 stack: err.stack,
 };
 }
 return null;
};

//规范化 ctx：把 Error 实例展开，把其他对象转成可序列化形式
const normalizeCtx = (ctx) => {
 if (ctx == null) return null;
 if (ctx instanceof Error) return serializeError(ctx);
 if (typeof ctx === 'object') {
 //浅克隆，避免污染原对象
 const out = {};
 for (const [k, v] of Object.entries(ctx)) {
 out[k] = v instanceof Error ? serializeError(v) : v;
 }
 return out;
 }
 return { value: ctx };
};

//拼接消息参数（与 console.log行为一致：第一个是格式串，其余是值）
// 这里简化：只做空值保护，不做 %s格式化
const joinArgs = (args) =>
 args
 .map((a) => {
 if (a == null) return String(a);
 if (typeof a === 'string') return a;
 if (a instanceof Error) return a.message;
 try { return JSON.stringify(a); } catch { return String(a); }
 })
 .join(' ');

const emit = (level, tag, args) => {
 if (LEVELS[level] < minLevel) return;
 const ts = new Date().toISOString();
 //分离所有 Error 参数到 ctx.error，剩下参数里如果最后一个是普通对象则视为 ctx
 let ctx = null;
 const kept = [];
 for (let i =0; i < args.length; i++) {
 const a = args[i];
 if (a instanceof Error) {
 if (!ctx) ctx = {};
 ctx.error = serializeError(a);
 } else {
 kept.push(a);
 }
 }
 //剩下的最后一个如果是普通对象，视为结构化 ctx
 if (kept.length >=2) {
 const last = kept[kept.length -1];
 if (last && typeof last === 'object') {
 const obj = normalizeCtx(last);
 if (obj) {
 if (!ctx) ctx = {};
 Object.assign(ctx, obj);
 kept.pop();
 }
 }
 }
 const message = joinArgs(kept);

 if (jsonMode) {
 const record = { ts, level, tag, message };
 if (ctx) {
 for (const [k, v] of Object.entries(ctx)) {
 // logger 内置字段保留优先级，ctx 同名 key 不覆盖
 if (!RESERVED_FIELDS.includes(k)) record[k] = v;
 }
 }
 const line = JSON.stringify(record);
 if (level === 'error' || level === 'fatal') process.stderr.write(line + '\n');
 else process.stdout.write(line + '\n');
 } else {
 const ctxStr = ctx
 ? ' ' + Object.entries(ctx).map(([k, v]) => {
 const val = typeof v === 'object' ? JSON.stringify(v) : String(v);
 return `${k}=${val}`;
 }).join(' ')
 : '';
 const line = `${ts} ${level.toUpperCase().padEnd(5)} [${tag}] ${message}${ctxStr}`;
 if (level === 'error' || level === 'fatal') process.stderr.write(line + '\n');
 else process.stdout.write(line + '\n');
 }
};

const makeChild = (tag) => {
 const log = (level) => (...args) => emit(level, tag, args);
 return {
 debug: log('debug'),
 info: log('info'),
 warn: log('warn'),
 error: log('error'),
 fatal: log('fatal'),
 // 直接调用 child('foo')再次嵌套 → 'parent:foo'
 child: (sub) => makeChild(`${tag}:${sub}`),
 };
};

export const logger = {
 child: makeChild,
 //顶层 helper（无 tag，输出 [root]）
 debug: (...args) => emit('debug', 'root', args),
 info: (...args) => emit('info', 'root', args),
 warn: (...args) => emit('warn', 'root', args),
 error: (...args) => emit('error', 'root', args),
 fatal: (...args) => emit('fatal', 'root', args),
};

//启动 banner：调用方在应用启动时一次性打，便于运维确认日志格式生效
export const printLoggerBanner = () => {
 if (jsonMode) {
 process.stdout.write(JSON.stringify({
 ts: new Date().toISOString(),
 level: 'info',
 tag: 'root',
 message: 'logger initialized',
 format: 'json',
 minLevel: Object.keys(LEVELS).find((k) => LEVELS[k] === minLevel),
 }) + '\n');
 } else {
 process.stdout.write(`logger: format=plain minLevel=${Object.keys(LEVELS).find((k) => LEVELS[k] === minLevel)}\n`);
 }
};
