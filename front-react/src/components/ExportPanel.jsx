import React from 'react';
import { addToast } from './Toast.jsx';

// 把 file.name（如 "演示 1" / "MyDeck"）清洗成安全的文件名后缀
// 保留中日韩 + 拉丁字母数字 + 空格/下划线/短横线，其他字符替换成下划线
// 同时收尾的 . 去掉（Windows 不允许文件名末尾是点）
const sanitizeFileBase = (name) => {
  if (!name || typeof name !== 'string') return 'presentation';
  const cleaned = name
    .replace(/[\\/:*?"<>|\u0000-\u001F]/g, '_')   // 禁用的文件名字符
    .replace(/\s+/g, ' ')                          // 折叠连续空白
    .trim();
  const safe = cleaned.replace(/\.+$/, '');        // 去掉末尾的点
  return safe || 'presentation';
};

// HTML 导出文件名后缀追加时间戳，避免同名文件多次导出被覆盖
const timestampSuffix = () => {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}`;
};

export default function ExportPanel({ task }) {
  const file = task?.generatedFiles?.find(f => f.id === task.activeFileId);
  const html = file?.versions[file.currentVersionIdx]?.html;

  const handleExportHtml = () => {
    if (!html) {
      addToast('没有可导出的内容', 'error');
      return;
    }
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${sanitizeFileBase(file?.name)}-${timestampSuffix()}.html`;
    a.click();
    URL.revokeObjectURL(url);
    addToast('HTML 已导出', 'success');
  };

  const handleExportPdf = () => {
    if (!file?.id || !html) {
      addToast('没有可导出的内容', 'error');
      return;
    }
    // 客户端打印方案：在新窗口打开 HTML，触发浏览器原生 print 对话框
    // 用户可选"另存为 PDF"。无需后端 puppeteer，无 CORS，无 bundle 体积代价。
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      // 用项目统一的 toast 替换原生 alert，与其他操作视觉一致 + 不阻塞 UI
      addToast('浏览器拦截了新窗口。请允许弹窗后重试。', 'error');
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
          addToast('已打开打印对话框,选择"另存为 PDF"即可', 'info');
        } catch (e) {
          addToast('打印失败:' + (e?.message || '未知错误'), 'error');
        }
      }, 800);
    });
  };

  const handleCopy = () => {
    if (!html) {
      addToast('没有可复制的内容', 'error');
      return;
    }
    // 复制成功/失败都给出反馈（之前是静默失败）
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(html)
        .then(() => addToast('已复制到剪贴板', 'success'))
        .catch(() => addToast('复制失败,请手动选择复制', 'error'));
    } else {
      // 极旧浏览器 fallback：使用临时 textarea + execCommand
      try {
        const ta = document.createElement('textarea');
        ta.value = html;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        const ok = document.execCommand('copy');
        document.body.removeChild(ta);
        addToast(ok ? '已复制到剪贴板' : '复制失败,请手动选择复制', ok ? 'success' : 'error');
      } catch (e) {
        addToast('复制失败:浏览器不支持自动复制', 'error');
      }
    }
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
