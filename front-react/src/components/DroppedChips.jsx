import React from 'react';
import { formatSize } from '../config.js';

export default function DroppedChips({ files, onRemove }) {
  if (!files || files.length === 0) return null;

  return (
    <div id="dropped-files" className="dropped-chips-container">
      {files.map((f, i) => (
        <div key={i} className="dropped-chip">
          <span className="chip-icon">📎</span>
          <span className="chip-name" title={f.name}>{f.name}</span>
          <span className="chip-size">{formatSize(f.size)}</span>
          <button
            className="chip-remove"
            onClick={() => onRemove(f.name)}
            title="移除"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
