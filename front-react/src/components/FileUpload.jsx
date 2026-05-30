import React, { useRef } from 'react';
import { API_BASE } from '../config.js';

export default function FileUpload({ onUploadComplete }) {
  const fileInputRef = useRef(null);

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    const formData = new FormData();
    files.forEach(f => formData.append('files', f));

    try {
      const resp = await fetch(`${API_BASE}/api/upload`, {
        method: 'POST',
        body: formData,
      });
      const data = await resp.json();
      if (data.files) {
        const uploaded = data.files.map(f => ({
          id: f.id || Math.random().toString(36).slice(2),
          name: f.filename,
          size: f.size,
          content: f.content || '',
          timestamp: Date.now(),
        }));
        onUploadComplete(uploaded);
      }
    } catch (err) {
      console.error('Upload failed:', err);
    }

    e.target.value = '';
  };

  return (
    <div id="file-upload-area">
      <input
        ref={fileInputRef}
        id="file-input"
        type="file"
        multiple
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />
      <button
        id="add-ref-file-btn"
        className="upload-btn"
        onClick={() => fileInputRef.current?.click()}
        title="上传参考文件"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="17 8 12 3 7 8"/>
          <line x1="12" y1="3" x2="12" y2="15"/>
        </svg>
        上传文件
      </button>
    </div>
  );
}
