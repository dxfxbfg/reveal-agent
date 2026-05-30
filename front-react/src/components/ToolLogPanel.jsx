import React, { useState } from 'react';

export default function ToolLogPanel({ taskId, toolLogs = [], feedbackLogs = [], knowledgeLogs = [] }) {
  const [expanded, setExpanded] = useState(false);
  const totalEntries = toolLogs.length + feedbackLogs.length + knowledgeLogs.length;
  if (totalEntries === 0) return null;

  return (
    <div className="tool-log-panel">
      <div className="tool-log-header" onClick={() => setExpanded(!expanded)}>
        <span>系统日志 ({totalEntries})</span>
        <span style={{ fontSize: 10 }}>{expanded ? '▾' : '▸'}</span>
      </div>
      {expanded && (
        <div className="tool-log-entries">
          {toolLogs.map((l, i) => (
            <div key={i} className="tool-log-entry tool-call">
              <span className="log-icon">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
              </span>
              <span className="log-name">{l.name}</span>
              {l.args && <span className="log-detail">({JSON.stringify(l.args).slice(0, 60)})</span>}
              {l.result && <span className="log-result">{typeof l.result === 'string' ? l.result.slice(0, 40) : JSON.stringify(l.result).slice(0, 40)}</span>}
            </div>
          ))}
          {feedbackLogs.map((l, i) => (
            <div key={`fb-${i}`} className="tool-log-entry feedback">
              <span className="log-icon">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  {l.score >= 0.8 ? <polyline points="20 6 9 17 4 12"/> : l.score >= 0.65 ? <><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></> : <><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></>}
                </svg>
              </span>
              <span className="log-label">质量评估</span>
              <span className="log-score">得分 {Math.round(l.score * 100)}</span>
              <span className="log-detail">{l.feedback?.slice(0, 50)}</span>
            </div>
          ))}
          {knowledgeLogs.map((l, i) => (
            <div key={`kc-${i}`} className="tool-log-entry knowledge">
              <span className="log-icon">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
              </span>
              <span className="log-label">知识编译</span>
              <span className="log-detail">{l.topic?.slice(0, 50)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
