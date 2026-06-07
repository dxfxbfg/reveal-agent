// Preview iframe srcdoc 注入脚本
//
// 这个脚本被父页面拼到 <body> 关闭标签之前，作用是：
//   1. 轮询等待 window.Reveal 就绪（CDN 慢时最多 5s）
//   2. 提供 nav 命令监听（postMessage revealNav: prev/next/first/last）
//   3. 点击翻页后备（避免 nav 命令丢失）
//   4. 上报 srcdoc 内运行时报错（window.onerror + unhandledrejection）
//   5. 上报 slidechanged 时的索引（用于切走/重连后恢复）
//   6. 收到父页面内联索引后，reaveal.on('ready') 跳过去
//
// 设计要点：
//   - 父→子通过 "__RESTORE_H__" / "__RESTORE_V__" 字符串字面量内联（不能用 ${...}，会被外层 JSX 解析）
//   - 不依赖任何外部 npm 包（避免 iframe 内 bundle 体积膨胀）
//   - 全部错误都 try/catch，不让 srcdoc 内的异常把整个 preview iframe 弄死
//
// 这个文件以前内联在 Preview.jsx 113–198 行。拆出来是为了：
//   1. Preview.jsx 减 ~80 行，可读性提升
//   2. 注入脚本可以用纯 JS 写（不用嵌在 JSX 模板字面量里），少一层转义
//   3. 后续要给 srcdoc 加能力（比如导出图片、键盘快捷键）有独立测试单元

/**
 * 构造 srcdoc 注入脚本。
 * @param {number} restoreH - 要恢复的水平 slide 索引（0-based），NaN/负数会被脚本内 fallback 到 0
 * @param {number} restoreV - 要恢复的垂直 slide 索引（0-based），同上
 * @returns {string} 可直接拼到 html `</body>` 之前的 `<script>...</script>` 块
 */
export function buildPreviewScript(restoreH, restoreV) {
  // 数字 sanity: 留个最后兜底，避免父页面传 undefined/string 导致脚本里 parseInt 拿到 NaN 之外的东西
  const h = Number.isInteger(restoreH) && restoreH >= 0 ? String(restoreH) : '0';
  const v = Number.isInteger(restoreV) && restoreV >= 0 ? String(restoreV) : '0';

  return `<script>
    (function(){
      var r, attempts = 0, restored = false;
      // 父页面注入前内联进来的恢复索引（占位符替换）
      var restoreH = ${h};
      var restoreV = ${v};
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
        // reveal 就绪后，如果父页面要恢复某个索引，跳过去
        function tryRestore(){
          if (restored) return;
          if (!restoreH && restoreH !== 0) { restored = true; return; }
          var h2 = parseInt(restoreH, 10), v2 = parseInt(restoreV, 10);
          if (!Number.isInteger(h2) || h2 < 0 || !Number.isInteger(v2) || v2 < 0) { restored = true; return; }
          var total = (typeof r.getTotalSlides === 'function') ? r.getTotalSlides() : 0;
          if (h2 >= total) { restored = true; return; }
          try { r.slide(h2, v2); restored = true; }
          catch(_) { restored = true; }
        }
        if (typeof r.on === 'function') {
          r.on('ready', tryRestore);
        } else {
          // 旧版 reveal 没有 on()，setTimeout 兜底
          setTimeout(tryRestore, 200);
        }
        // 通知父页面：已就绪（带总张数便于"已恢复到第 N/M 张"提示）
        try { parent.postMessage({ revealReady: true, total: (typeof r.getTotalSlides === 'function') ? r.getTotalSlides() : 0 }, '*'); } catch(e){}
      }
      setup();
    })();
  </script>`;
}
