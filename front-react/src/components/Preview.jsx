import React, { useRef, useEffect, useCallback, useState } from 'react';

export default function Preview({ html, active = true }) {
  const ref = useRef(null);
  const readyRef = useRef(false);
  const pendingNavRef = useRef([]);
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [retryNonce, setRetryNonce] = useState(0);

  // 监听 iframe 内的 ready / error 信号
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
      }
    }
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  // 每次 html 变化 → 重新注入并重置 ready 状态
  useEffect(() => {
    if (ref.current && html) {
      readyRef.current = false;
      setReady(false);
      setLoadError(null);
      pendingNavRef.current = [];

      const enhancedHtml = html.replace(
        '</body>',
        `<script>
          (function(){
            var r, attempts = 0;
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
              // 通知父页面：已就绪
              try { parent.postMessage({ revealReady: true }, '*'); } catch(e){}
            }
            setup();
          })();
        </script>
      </body>`
      );
      ref.current.srcdoc = enhancedHtml;
    }
  }, [html, retryNonce]);

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
            <path d="M12 2L2 7l10 5 10-5-10-5z"/>
            <path d="M2 17l10 5 10-5"/>
            <path d="M2 12l10 5 10-5"/>
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
