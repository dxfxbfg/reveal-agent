import React from 'react';

export default function ExportPanel({ task }) {
  const file = task?.generatedFiles?.find(f => f.id === task.activeFileId);
  const html = file?.versions[file.currentVersionIdx]?.html;

  const handleExportHtml = () => {
    if (!html) return;
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${file?.name || 'presentation'}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportPdf = () => {
    if (!file?.id || !html) return;
    // 客户端打印方案：在新窗口打开 HTML，触发浏览器原生 print 对话框
    // 用户可选"另存为 PDF"。无需后端 puppeteer，无 CORS，无 bundle 体积代价。
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('浏览器拦截了新窗口。请允许弹窗后重试。');
      return;
    }
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
    // 等待 reveal.js / 资源加载完成（reveal 会在 window.onload 之后初始化）
    printWindow.addEventListener('load', () => {
      // 给 reveal 一些初始化时间
      setTimeout(() => {
        try {
          printWindow.focus();
          printWindow.print();
        } catch (e) {
          console.error('Print failed:', e);
        }
      }, 800);
    });
  };

  const handleCopy = () => {
    if (!html) return;
    navigator.clipboard.writeText(html).catch(() => {});
  };

  const disabled = !html;

  return (
    <div id="export-bar">
      <button
        id="export-html"
        className="export-btn"
        onClick={handleExportHtml}
        disabled={disabled}
        title="导出 HTML"
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="7 10 12 15 17 10"/>
          <line x1="12" y1="15" x2="12" y2="3"/>
        </svg>
        HTML
      </button>
      <button
        id="export-pdf"
        className="export-btn"
        onClick={handleExportPdf}
        disabled={disabled}
        title="导出 PDF（通过浏览器打印对话框另存为 PDF）"
      >
        PDF
      </button>
      <button
        id="copy-code"
        className="export-btn"
        onClick={handleCopy}
        disabled={disabled}
        title="复制代码"
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
        </svg>
        复制
      </button>
    </div>
  );
}
