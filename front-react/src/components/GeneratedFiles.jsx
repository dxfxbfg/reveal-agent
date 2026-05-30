import React, { useState } from 'react';
import { formatSize, formatTime } from '../config.js';

export default function GeneratedFiles({
  taskId,
  files = [],
  activeFileId,
  onSelect,
  onDelete,
  onRename,
  onLoadVersion,
  onSaveVersion,
  onToggleExpand,
}) {
  const [renamingId, setRenamingId] = useState(null);
  const [renameValue, setRenameValue] = useState('');

  const handleStartRename = (file) => {
    setRenamingId(file.id);
    setRenameValue(file.name);
  };

  const handleFinishRename = (fileId) => {
    if (renameValue.trim() && renameValue !== files.find(f => f.id === fileId)?.name) {
      onRename(taskId, fileId, renameValue.trim());
    }
    setRenamingId(null);
    setRenameValue('');
  };

  const handleRenameKey = (e, fileId) => {
    if (e.key === 'Enter') handleFinishRename(fileId);
    if (e.key === 'Escape') { setRenamingId(null); setRenameValue(''); }
  };

  if (files.length === 0) return null;

  return (
    <div id="generated-files-list" className="generated-files-list">
      <div className="files-tab-bar">
        <button className="files-tab active" data-ftab="generated">已生成</button>
      </div>
      <div className="files-tab-content active" id="ftab-generated">
        {files.map(f => (
          <div key={f.id} className={`panel-gen-item ${f.id === activeFileId ? 'current' : ''}`}>
            <div className="panel-gen-header" onClick={() => onSelect(f.id)}>
              <button
                className={`panel-gen-expand ${f._expanded ? 'expanded' : ''}`}
                onClick={(e) => { e.stopPropagation(); onToggleExpand(taskId, f.id, !f._expanded); }}
              >
                ▶
              </button>
              <span className="panel-gen-icon">▷</span>
              {renamingId === f.id ? (
                <input
                  className="panel-gen-name-input"
                  value={renameValue}
                  onChange={e => setRenameValue(e.target.value)}
                  onBlur={() => handleFinishRename(f.id)}
                  onKeyDown={e => handleRenameKey(e, f.id)}
                  autoFocus
                  onClick={e => e.stopPropagation()}
                />
              ) : (
                <span className="panel-gen-name">{f.name}</span>
              )}
              <span className="panel-gen-meta">v{f.versions.length}</span>
              <div className="panel-gen-actions">
                <button
                  className="action-btn"
                  onClick={(e) => { e.stopPropagation(); handleStartRename(f); }}
                  title="重命名"
                >
                  ✎
                </button>
                <button
                  className="action-btn danger"
                  onClick={(e) => { e.stopPropagation(); onDelete(taskId, f.id); }}
                  title="删除"
                >
                  ×
                </button>
              </div>
            </div>

            {f._expanded && (
              <div className="panel-gen-versions">
                {f.versions.map((v, vi) => (
                  <div
                    key={vi}
                    className={`panel-ver-item ${vi === f.currentVersionIdx ? 'current' : ''}`}
                    onClick={() => onLoadVersion(taskId, f.id, vi)}
                  >
                    <span className="panel-ver-label">版本 {vi + 1}</span>
                    <span className="panel-ver-time">{formatTime(v.timestamp)}</span>
                    <div className="panel-ver-actions">
                      <button
                        className="action-btn"
                        onClick={(e) => { e.stopPropagation(); onLoadVersion(taskId, f.id, vi); }}
                        title="加载此版本"
                      >
                        ▶
                      </button>
                    </div>
                  </div>
                ))}
                <button
                  className="panel-save-ver-btn"
                  onClick={(e) => { e.stopPropagation(); onSaveVersion(taskId, f.id); }}
                >
                  + 保存当前为新版本
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
