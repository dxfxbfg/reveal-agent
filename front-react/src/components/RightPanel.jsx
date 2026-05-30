import React, { useRef, useState } from 'react';
import { formatSize, formatTime } from '../config.js';

export default function RightPanel({
  task,
  onSelectFile,
  onDeleteFile,
  onRenameFile,
  onLoadVersion,
  onSaveVersion,
  onToggleExpand,
  onUploadComplete,
  onRemoveReference,
  onAddDropped,
}) {
  const [tab, setTab] = useState('generated');
  const [renamingId, setRenamingId] = useState(null);
  const [renameValue, setRenameValue] = useState('');
  const fileInputRef = useRef(null);

  const files = task.generatedFiles || [];
  const refs = task.referenceFiles || [];
  const activeFileId = task.activeFileId;

  const handleStartRename = (file) => {
    setRenamingId(file.id);
    setRenameValue(file.name);
  };

  const handleFinishRename = (fileId) => {
    if (renameValue.trim() && renameValue !== files.find(f => f.id === fileId)?.name) {
      onRenameFile(task.id, fileId, renameValue.trim());
    }
    setRenamingId(null);
    setRenameValue('');
  };

  const handleRenameKey = (e, fileId) => {
    if (e.key === 'Enter') handleFinishRename(fileId);
    if (e.key === 'Escape') { setRenamingId(null); setRenameValue(''); }
  };

  const handleUpload = async (e) => {
    const uploaded = Array.from(e.target.files);
    if (!uploaded.length) return;
    const formData = new FormData();
    formData.append('taskId', task.id);
    uploaded.forEach(f => formData.append('files', f));
    try {
      const resp = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await resp.json();
      if (data.files) {
        const refFiles = data.files.map(f => ({
          id: f.id || Math.random().toString(36).slice(2),
          name: f.filename,
          size: f.size,
          content: f.content || '',
          timestamp: Date.now(),
        }));
        onUploadComplete(refFiles);
      }
    } catch (err) {
      console.error('Upload failed:', err);
    }
    e.target.value = '';
  };

  return (
    <div id="right-panel">
      <div className="right-panel-header">
        <div className="right-tabs">
          <button
            className={`right-tab ${tab === 'generated' ? 'active' : ''}`}
            onClick={() => setTab('generated')}
          >
            生成文件
          </button>
          <button
            className={`right-tab ${tab === 'reference' ? 'active' : ''}`}
            onClick={() => setTab('reference')}
          >
            参考文件
          </button>
        </div>
        {tab === 'reference' && (
          <>
            <button className="right-upload-btn" onClick={() => fileInputRef.current?.click()}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="17 8 12 3 7 8"/>
                <line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              style={{ display: 'none' }}
              onChange={handleUpload}
            />
          </>
        )}
      </div>

      {tab === 'generated' && (
        <div className="right-content">
          {files.length === 0 ? (
            <div className="right-empty">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
              暂无生成文件
            </div>
          ) : (
            <div className="right-section-list">
              {files.map((f, idx) => (
                <div key={f.id} className={`right-file-item ${f.id === activeFileId ? 'active' : ''}`} style={{ animationDelay: `${idx * 0.05}s` }}>
                  <div className="right-file-header" onClick={() => onSelectFile(f.id)}>
                    <div className="right-file-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14 2 14 8 20 8"/>
                        <line x1="16" y1="13" x2="8" y2="13"/>
                        <line x1="16" y1="17" x2="8" y2="17"/>
                      </svg>
                    </div>
                    {renamingId === f.id ? (
                      <input
                        className="right-file-name-input"
                        value={renameValue}
                        onChange={e => setRenameValue(e.target.value)}
                        onBlur={() => handleFinishRename(f.id)}
                        onKeyDown={e => handleRenameKey(e, f.id)}
                        autoFocus
                        onClick={e => e.stopPropagation()}
                      />
                    ) : (
                      <span className="right-file-name">{f.name}</span>
                    )}
                    <span className="right-file-version">v{f.versions.length}</span>
                    <div className="right-file-actions">
                      <button className="right-action-btn" onClick={(e) => { e.stopPropagation(); handleStartRename(f); }} title="重命名">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                      </button>
                      <button className="right-action-btn danger" onClick={(e) => { e.stopPropagation(); onDeleteFile(task.id, f.id); }} title="删除">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6"/>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                  {f._expanded && (
                    <div className="right-file-versions">
                      {f.versions.map((v, vi) => (
                        <div
                          key={vi}
                          className={`right-ver-item ${vi === f.currentVersionIdx ? 'current' : ''}`}
                          onClick={() => onLoadVersion(task.id, f.id, vi)}
                        >
                          <div className="right-ver-icon">
                            {vi === f.currentVersionIdx ? (
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                            ) : (
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/></svg>
                            )}
                          </div>
                          <span className="right-ver-label">版本 {vi + 1}</span>
                          <span className="right-ver-time">{formatTime(v.timestamp)}</span>
                        </div>
                      ))}
                      <button
                        className="right-save-ver-btn"
                        onClick={(e) => { e.stopPropagation(); onSaveVersion(task.id, f.id); }}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 4 }}>
                          <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                          <polyline points="17 21 17 13 7 13 7 21"/>
                          <polyline points="7 3 7 8 15 8"/>
                        </svg>
                        保存为新版本
                      </button>
                    </div>
                  )}
                  <button
                    className={`right-file-expand ${f._expanded ? 'expanded' : ''}`}
                    onClick={(e) => { e.stopPropagation(); onToggleExpand(task.id, f.id, !f._expanded); }}
                  >
                    {f._expanded ? '▾' : '▸'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'reference' && (
        <div className="right-content">
          {refs.length === 0 ? (
            <div className="right-empty">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
              暂无参考文件
            </div>
          ) : (
            <div className="right-section-list">
              {refs.map((f, i) => (
                <div
                  key={i}
                  className="right-ref-item"
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('application/json', JSON.stringify({ type: 'uploaded-file', file: f }));
                  }}
                  onClick={() => onAddDropped(f)}
                  title={`点击加入上下文: ${f.name}`}
                  style={{ animationDelay: `${i * 0.05}s` }}
                >
                  <div className="right-ref-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <polyline points="14 2 14 8 20 8"/>
                      <line x1="16" y1="13" x2="8" y2="13"/>
                      <line x1="16" y1="17" x2="8" y2="17"/>
                    </svg>
                  </div>
                  <div className="right-ref-info">
                    <span className="right-ref-name">{f.name}</span>
                    <span className="right-ref-size">{formatSize(f.size)}</span>
                  </div>
                  <button
                    className="right-action-btn danger"
                    onClick={(e) => { e.stopPropagation(); onRemoveReference(i); }}
                    title="删除"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6"/>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
