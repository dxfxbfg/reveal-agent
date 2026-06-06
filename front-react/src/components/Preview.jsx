import React, { useRef, useEffect, useCallback, useState } from 'react';

// 幻灯片索引持久化 — 切到 ControlPanel 再切回,或 srcdoc 重新注入时,保留当前位置
// localStorage key: ra_preview_slide_idx_<taskId> = "h,v"
// 写入时机：srcdoc 内 reveal 触发 slidechanged 时上报
// 恢复时机：srcdoc 注入时把要恢复的索引内联到脚本里（避免父→子异步握手）

// 占位符必须是字符串字面量,直接出现在注入脚本里,再用 string.replace 替换
// 千万不能写成 ${...} — 那会被 JSX 解析为表达式
const RESTORE_H_PLACEHOLDER = '__RESTORE_H__';
const RESTORE_V_PLACEHOLDER = '__RESTORE_V__';

const slideIdxKey = (taskId) => `ra_preview_slide_idx_${taskId}`;

const safeGet = (key) => { try { return localStorage.getItem(key); } catch { return null; } };
const safeSet = (key, val) => { try { localStorage.setItem(key, val); } catch {} };

// 从 localStorage 读出 { h, v }；解析失败/越界返回 null
const loadSavedIdx = (taskId) => {
  if (!taskId) return null;
  const raw = safeGet(slideIdxKey(taskId));
  if (!raw) return null;
  const parts = raw.split(',');
  if (parts.length !== 2) return null;
  const h = parseInt(parts[0], 10);
  const v = parseInt(parts[1], 10);
  if (!Number.isInteger(h) || h < 0 || !Number.isInteger(v) || v < 0) return null;
  return { h, v };
};

export default function Preview({ html, active = true, taskId }) {
  const ref = useRef(null);
  const readyRef = useRef(false);
  const pendingNavRef = useRef([]);
  // 每次重新注入时,把这个 ref 写满；注入脚本里直接读字面量,不依赖 postMessage 握手
  const pendingRestoreRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [retryNonce, setRetryNonce] = useState(0);

  // 监听 iframe 内的 ready / error / 索引上报信号
  useEffect(() => {
    function onMessage(e) {
      if (!e.data) return;
      if (e.data.revealReady === true) {
        readyRef.current = true;
        setReady(true);
        setLoadError(null);
        // 冲刷积压的 nav 命令
        const queue = pendingNavRef.current;
        pendingNavRef.current = [];
        queue.forEach((cmd) => sendNav(cmd));
      } else if (e.data.revealReady === false) {
        // srcdoc 内的 Reveal 加载失败（CDN 慢 / 不可达）
        readyRef.current = false;
        setReady(false);
        setLoadError(e.data.reason || 'Reveal.js 未能加载');
      } else if (e.data.revealError) {
        // srcdoc 内的运行时错误（如 reveal 抛出）
        setLoadError(e.data.revealError);
      } else if (e.data.revealSlideIdx) {
        // srcdoc 内 reveal 触发 slidechanged,上报当前索引
        if (!taskId) return;
        const { h, v } = e.data.revealSlideIdx;
        if (typeof h !== 'number' || typeof v !== 'number') return;
        safeSet(slideIdxKey(taskId), `${h},${v}`);
      }
    }
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [taskId]);

  // 每次 html 变化 → 重新注入并重置 ready 状态
  useEffect(() => {
    if (ref.current && html) {
      readyRef.current = false;
      setReady(false);
      setLoadError(null);
      pendingNavRef.current = [];

      // 注入前先确定要恢复的索引
      // html 变化（task 切换 / 新生成）时,默认不恢复旧 task 的位置
      // 同一个 html 重新注入（切回 workspace）时,恢复上次记录的索引
      const saved = loadSavedIdx(taskId);
      pendingRestoreRef.current = saved;

      const restoreH = saved ? String(saved.h) : '0';
      const restoreV = saved ? String(saved.v) : '0';

      const enhancedHtml = html.replace(
        '</body>',
        `<script>
          (function(){
            var r, attempts = 0, restored = false;
            // 父页面注入前内联进来的恢复索引（占位符替换）
            var restoreH = '__RESTORE_H__';
            var restoreV = '__RESTORE_V__';
            function setup(){
              r = window.Reveal;
              if(!r){
                // 最多轮询 5s（200ms × 25 次），避免 CDN 慢时永久挂起
                if (++attempts > 25) {
                  try { parent.postMessage({ revealReady: false, reason: 'Reveal.js 加载超时（CDN 不可达？）' }, '*'); } catch(e){}
                  return;
                }
                setTimeout(setup, 200);
                return;
              }
              // nav 命令：prev/next/first/last
              window.addEventListener('message', function(e){
                if(!e.data || !e.data.revealNav) return;
                var cmd = e.data.revealNav;
                if (cmd === 'prev') r.prev();
                else if (cmd === 'next') r.next();
                else if (cmd === 'first') r.slide(0);
                else if (cmd === 'last') r.slide(r.getTotalSlides() - 1);
              });
              // 点击翻页后备
              var revealEl = document.querySelector('.reveal');
              if (revealEl) {
                revealEl.addEventListener('click', function(e){
                  if (e.button !== 0) return;
                  if (window.getSelection && String(window.getSelection()).trim()) return;
                  if (e.target.closest('a, button, input, textarea, select, .controls, .progress')) return;
                  r.next();
                });
              }
              // 上报 srcdoc 内运行时报错到父页面
              window.addEventListener('error', function(ev){
                try { parent.postMessage({ revealError: (ev.message || '未知错误') + ' @ ' + (ev.filename || '?') }, '*'); } catch(_){}
              });
              window.addEventListener('unhandledrejection', function(ev){
                try { parent.postMessage({ revealError: '未捕获 Promise: ' + (ev.reason && ev.reason.message ? ev.reason.message : String(ev.reason)) }, '*'); } catch(_){}
              });
              // 索引变化时上报父页面（用于切走/重连后恢复）
              if (typeof r.on === 'function') {
                r.on('slidechanged', function(){
                  try {
                    var idx = r.getIndices();
                    parent.postMessage({ revealSlideIdx: { h: idx.h || 0, v: idx.v || 0 } }, '*');
                  } catch(_){}
                });
              }
              // reveal 就绪后,如果父页面要恢复某个索引,跳过去
              function tryRestore(){
                if (restored) return;
                if (!restoreH && restoreH !== 0) { restored = true; return; }
                var h = parseInt(restoreH, 10), v = parseInt(restoreV, 10);
                if (!Number.isInteger(h) || h < 0 || !Number.isInteger(v) || v < 0) { restored = true; return; }
                var total = (typeof r.getTotalSlides === 'function') ? r.getTotalSlides() : 0;
                if (h >= total) { restored = true; return; }
                try { r.slide(h, v); restored = true; }
                catch(_) { restored = true; }
              }
              if (typeof r.on === 'function') {
                r.on('ready', tryRestore);
              } else {
                // 旧版 reveal 没有 on(),setTimeout 兜底
                setTimeout(tryRestore, 200);
              }
              // 通知父页面：已就绪
              try { parent.postMessage({ revealReady: true }, '*'); } catch(e){}
            }
            setup();
          })();
        </script>
      </body>`
      )
      // 把占位符替换为真实数值
      .replace(RESTORE_H_PLACEHOLDER, restoreH)
      .replace(RESTORE_V_PLACEHOLDER, restoreV);
      ref.current.srcdoc = enhancedHtml;
    }
  }, [html, retryNonce, taskId]);

  // workspace 切走时释放 iframe 资源（srcdoc 内嵌的 reveal.js + PDF/图片会一直占内存）
  // 切回时通过 retryNonce 触发上面的 effect 重新注入
  useEffect(() => {
    if (active || !html) return;
    // 不 active 时清空 srcdoc
    if (ref.current?.srcdoc) ref.current.srcdoc = '';
    readyRef.current = false;
    setReady(false);
    pendingNavRef.current = [];
  }, [active, html]);

  useEffect(() => {
    if (!active && html) {
      // 切回时 force re-inject（如果 html 不变，retryNonce 仍能触发 effect）
      setRetryNonce(n => n + 1);
    }
  }, [active]);  // 仅 active 变化时触发

  const sendNav = useCallback((cmd) => {
    const win = ref.current?.contentWindow;
    if (!win) return;
    if (!readyRef.current) {
      // 还没就绪，先排队；ready 后会冲刷
      pendingNavRef.current.push(cmd);
      return;
    }
    win.postMessage({ revealNav: cmd }, '*');
  }, []);

  useEffect(() => {
    if (!active) return;
    const handleKey = (e) => {
      if (!ref.current) return;
      // 避免在输入控件里拦截
      const tag = document.activeElement?.tagName;
      if (tag === 'TEXTAREA' || tag === 'INPUT' || tag === 'SELECT') return;
      // 避免在 iframe 内（focus 进了 srcdoc 的内容）
      if (document.activeElement === ref.current) return;
      switch (e.key) {
        case 'ArrowRight':
        case 'ArrowDown':
        case ' ':
          e.preventDefault();
          sendNav('next');
          break;
        case 'ArrowLeft':
        case 'ArrowUp':
          e.preventDefault();
          sendNav('prev');
          break;
        case 'Home':
          e.preventDefault();
          sendNav('first');
          break;
        case 'End':
          e.preventDefault();
          sendNav('last');
          break;
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [sendNav, active]);

  return (
    <div id="preview-wrapper" data-preview-ready={ready ? 'true' : 'false'}>
      <div id="preview-placeholder" className={html ? 'hidden' : ''}>
        <div className="placeholder-card">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
          </svg>
        </div>
        <div className="placeholder-info">
          <div className="placeholder-title">预览区</div>
          <div className="placeholder-sub">生成演示文稿后将在此显示</div>
        </div>
      </div>
      {loadError && (
        <div id="preview-error" role="alert">
          <div className="preview-error-icon" aria-hidden="true">⚠</div>
          <div className="preview-error-body">
            <div className="preview-error-title">预览加载失败</div>
            <div className="preview-error-msg">{loadError}</div>
            <div className="preview-error-hint">可能原因：CDN 不可达 / 沙盒禁用脚本 / 生成内容含语法错误</div>
          </div>
          <button
            type="button"
            className="preview-error-retry"
            onClick={() => {
              setLoadError(null);
              setRetryNonce(n => n + 1);
            }}
          >
            重试
          </button>
        </div>
      )}
      <iframe
        ref={ref}
        id="preview-iframe"
        sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-modals"
        tabIndex={-1}
        style={{ display: html ? 'block' : 'none' }}
        title="preview"
      />
    </div>
  );
}
