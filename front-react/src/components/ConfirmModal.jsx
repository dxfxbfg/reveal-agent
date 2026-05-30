import React, { useEffect, useRef } from 'react';

export default function ConfirmModal({ type, title, message, onConfirm, onCancel }) {
  const overlayRef = useRef(null);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape' && onCancel) onCancel();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onCancel]);

  const iconMap = {
    warning: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
        <line x1="12" y1="9" x2="12" y2="13"/>
        <line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>
    ),
    error: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <circle cx="12" cy="12" r="10"/>
        <line x1="15" y1="9" x2="9" y2="15"/>
        <line x1="9" y1="9" x2="15" y2="15"/>
      </svg>
    ),
    info: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="16" x2="12" y2="12"/>
        <line x1="12" y1="8" x2="12.01" y2="8"/>
      </svg>
    ),
  };

  return (
    <div className="confirm-overlay" ref={overlayRef} onClick={onCancel}>
      <div className="confirm-card" onClick={e => e.stopPropagation()}>
        <div className={`confirm-icon ${type}`}>
          {iconMap[type] || iconMap.info}
        </div>
        <div className="confirm-title">{title}</div>
        <div className="confirm-message">{message}</div>
        <div className="confirm-actions">
          {onCancel && (
            <button className="confirm-btn secondary" onClick={onCancel}>
              {type === 'discard' ? '取消' : '取消'}
            </button>
          )}
          <button className={`confirm-btn ${type === 'discard' ? 'danger' : 'primary'}`} onClick={onConfirm}>
            {type === 'discard' ? '放弃' : '确认'}
          </button>
        </div>
      </div>
    </div>
  );
}
