import React, { useRef, useEffect, useCallback } from 'react';

export default function Preview({ html, active = true }) {
  const ref = useRef(null);

  useEffect(() => {
    if (ref.current && html) {
      const enhancedHtml = html.replace(
        '</body>',
        `<script>
          (function(){
            var r;
            function setup(){
              r = window.Reveal;
              if(!r){ setTimeout(setup,200); return; }
              window.addEventListener('message',function(e){
                if(!e.data||!e.data.revealNav) return;
                var cmd=e.data.revealNav;
                if(cmd==='prev') r.prev();
                else if(cmd==='next') r.next();
                else if(cmd==='first') r.slide(0);
                else if(cmd==='last') r.slide(r.getTotalSlides()-1);
              });
              // 点击翻页后备 — 非交互元素点击前进
              document.querySelector('.reveal').addEventListener('click',function(e){
                if(e.button!==0) return;
                if(window.getSelection&&String(window.getSelection()).trim()) return;
                if(e.target.closest('a, button, input, textarea, select, .controls, .progress')) return;
                r.next();
              });
            }
            setup();
          })();
        </script>
      </body>`
      );
      ref.current.srcdoc = enhancedHtml;
    }
  }, [html]);

  const sendNav = useCallback((cmd) => {
    if (ref.current?.contentWindow) {
      ref.current.contentWindow.postMessage({ revealNav: cmd }, '*');
    }
  }, []);

  useEffect(() => {
    if (!active) return;
    const handleKey = (e) => {
      if (!ref.current) return;
      if (document.activeElement === ref.current || document.activeElement?.tagName === 'TEXTAREA') return;
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
    <div id="preview-wrapper">
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
      <iframe
        ref={ref}
        id="preview-iframe"
        sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-modals"
        tabIndex={0}
        style={{ display: html ? 'block' : 'none' }}
        title="preview"
      />
    </div>
  );
}
