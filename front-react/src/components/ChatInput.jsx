import React, { useState, useRef, useEffect } from 'react';
import DroppedChips from './DroppedChips.jsx';

export default function ChatInput({ onSend, onUpload, droppedFiles = [], onRemoveDropped, onAddDropped, disabled }) {
  const [text, setText] = useState('');
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const containerRef = useRef(null);

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 160) + 'px';
  }, [text]);

  const handleSend = () => {
    if (!text.trim() || disabled) return;
    onSend(text);
    setText('');
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Drag and drop on the whole input area
  const handleDragOver = (e) => {
    e.preventDefault();
    containerRef.current?.classList.add('drag-over');
  };

  const handleDragLeave = (e) => {
    if (!containerRef.current?.contains(e.relatedTarget)) {
      containerRef.current?.classList.remove('drag-over');
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    containerRef.current?.classList.remove('drag-over');

    // Check if dropping from uploaded files list
    const uploadedData = e.dataTransfer.getData('application/json');
    if (uploadedData) {
      try {
        const { type, file } = JSON.parse(uploadedData);
        if (type === 'uploaded-file' && file) {
          onAddDropped(file);
        }
      } catch (_) {}
      return;
    }

    // Check for local files
    const fileObjs = Array.from(e.dataTransfer.files);
    if (fileObjs.length) {
      if (fileInputRef.current) {
        const dt = new DataTransfer();
        fileObjs.forEach(f => dt.items.add(f));
        fileInputRef.current.files = dt.files;
        fileInputRef.current.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }
  };

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    await onUpload(files);
    e.target.value = '';
  };

  return (
    <div
      id="input-area"
      ref={containerRef}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        ref={fileInputRef}
        id="file-input"
        type="file"
        multiple
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />
      <DroppedChips files={droppedFiles} onRemove={onRemoveDropped} />
      <div id="input-top-row">
        <textarea
          ref={textareaRef}
          id="chat-input"
          rows="1"
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={handleKey}
          placeholder="描述你想要生成的演示文稿主题..."
          disabled={disabled}
        />
        <button
          id="send-btn"
          title="发送 (Enter)"
          onClick={handleSend}
          disabled={disabled || !text.trim()}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="22" y1="2" x2="11" y2="13"/>
            <polygon points="22 2 15 22 11 13 2 9 22 2"/>
          </svg>
        </button>
      </div>
    </div>
  );
}
