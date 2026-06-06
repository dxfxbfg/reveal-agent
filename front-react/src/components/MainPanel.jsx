import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import Preview from './Preview.jsx';
import ExportPanel from './ExportPanel.jsx';

function extractSlideText(html) {
  if (!html) return '';
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const sections = doc.querySelectorAll('section');
  if (!sections.length) return html;

  const parts = [];
  sections.forEach((sec, i) => {
    const title = sec.querySelector('h1, h2, h3, h4')?.textContent || `幻灯片 ${i + 1}`;
    const paragraphs = sec.querySelectorAll('p, li');
    const lines = Array.from(paragraphs).map(p => p.textContent.trim()).filter(Boolean);
    parts.push(`## ${title}\n${lines.join('\n')}`);
  });
  return parts.join('\n\n');
}

export default function MainPanel({ task, activeFile, onStop, onContinue, onDiscard, active = true, onEditFileHtml }) {
  const [tab, setTab] = useState('preview');
  const [elapsed, setElapsed] = useState(0);
  const [textContent, setTextContent] = useState('');
  const [codeContent, setCodeContent] = useState('');
  const codeTimerRef = useRef(null);
  const html = activeFile?.versions[activeFile.currentVersionIdx]?.html || '';
  const isGenerating = task.generation.isGenerating;
  const stepLabel = task.generation.stepLabel || '';
  const step = task.generation.step;

  useEffect(() => {
    if (!isGenerating) { setElapsed(0); return; }
    setElapsed(0);
    const id = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(id);
  }, [isGenerating]);

  useEffect(() => {
    if (html) {
      setTextContent(extractSlideText(html));
    } else {
      setTextContent('');
    }
  }, [html]);

  // tab 切换到文字/代码时从最新 html 同步
  useEffect(() => {
    if (tab === 'text' && html) {
      setTextContent(extractSlideText(html));
    }
    if (tab === 'code' && html) {
      setCodeContent(html);
    }
  }, [tab, html]);

  useEffect(() => {
    if (tab === 'code' && html && html !== codeContent) {
      setCodeContent(html);
    }
  }, [html, tab]);

  const handleCodeChange = useCallback((e) => {
    const val = e.target.value;
    setCodeContent(val);
    if (codeTimerRef.current) clearTimeout(codeTimerRef.current);
    codeTimerRef.current = setTimeout(() => {
      if (onEditFileHtml && activeFile) {
        onEditFileHtml(activeFile.id, val);
      }
    }, 800);
  }, [onEditFileHtml, activeFile]);

  const handleSaveCode = useCallback(() => {
    if (onEditFileHtml && activeFile && codeContent) {
      onEditFileHtml(activeFile.id, codeContent);
    }
  }, [onEditFileHtml, activeFile, codeContent]);

  const progressWidth = step === 'requirement-analyzer' ? '25'
    : step === 'info-collector' ? '50'
    : step === 'slide-generator' ? '80'
    : step === 'done' ? '100'
    : '5';

  return (
    <div id="center-panel">
      <div id="view-toolbar">
        <div className="view-tabs">
          <button
            className={`view-btn ${tab === 'preview' ? 'active' : ''}`}
            onClick={() => setTab('preview')}
          >
            预览
          </button>
          <button
            className={`view-btn ${tab === 'text' ? 'active' : ''}`}
            onClick={() => setTab('text')}
          >
            文字
          </button>
          <button
            className={`view-btn ${tab === 'code' ? 'active' : ''}`}
            onClick={() => setTab('code')}
          >
            代码
          </button>
        </div>
        <ExportPanel task={task} />
      </div>

      <div id="views">
        <div id="preview-view" className={`view ${tab === 'preview' ? 'active' : ''}`}>
          <Preview html={html} active={active} taskId={task.id} />
          {isGenerating && (
            <div id="progress-area">
              <div className="progress-header">
                <div className="progress-label">
                  <div className="progress-step-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/>
                      <path d="M12 6v6l4 2"/>
                    </svg>
                  </div>
                  <div>
                    <div className="progress-step-text">{stepLabel}</div>
                    <div className="progress-sub-text">{elapsed}s</div>
                  </div>
                </div>
              </div>
              <div className="progress-bar-track">
                <div className="progress-bar-fill" style={{ width: `${progressWidth}%` }} />
              </div>
              <div className="progress-actions">
                <button className="progress-btn" onClick={onContinue}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="5 3 19 12 5 21 5 3"/>
                  </svg>
                  继续
                </button>
                <button className="progress-btn" onClick={onStop}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="6" y="6" width="12" height="12" rx="2"/>
                  </svg>
                  暂停
                </button>
                <button className="progress-btn danger" onClick={onDiscard}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                  放弃
                </button>
              </div>
            </div>
          )}
        </div>
        <div id="text-view" className={`view ${tab === 'text' ? 'active' : ''}`}>
          <div id="text-editor-wrapper">
            <textarea
              id="text-editor"
              value={textContent}
              onChange={e => setTextContent(e.target.value)}
              spellCheck={false}
              placeholder="幻灯片文字内容将在此显示，可直接编辑..."
            />
          </div>
        </div>
        <div id="code-view" className={`view ${tab === 'code' ? 'active' : ''}`}>
          <textarea
            id="code-editor"
            value={codeContent}
            onChange={handleCodeChange}
            spellCheck={false}
          />
          <button className="code-save-btn" onClick={handleSaveCode} title="保存代码更改">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
            保存
          </button>
        </div>
      </div>
    </div>
  );
}
