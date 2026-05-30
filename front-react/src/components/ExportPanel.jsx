import React, { useState } from 'react';
import { API_BASE } from '../config.js';

export default function ExportPanel({ task }) {
  const [exporting, setExporting] = useState(false);
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

  const handleExportPdf = async () => {
    if (!activeFile?.id || !html) return;
    setExporting(true);
    try {
      const resp = await fetch(`${API_BASE}/api/export/pdf/${activeFile.id}`);
      if (!resp.ok) throw new Error('PDF export failed');
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'presentation.pdf';
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('PDF export failed:', err);
    } finally {
      setExporting(false);
    }
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
        disabled={disabled || exporting}
        title="导出 PDF"
      >
        {exporting ? '导出中...' : 'PDF'}
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
