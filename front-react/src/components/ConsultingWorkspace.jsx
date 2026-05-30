import React, { useState, useEffect, useRef, useCallback } from 'react';
import { API_BASE, genId, formatSize } from '../config.js';
import { connectWS, on, off } from '../ws.js';
import { addToast } from './Toast.jsx';

const TASKS_KEY = 'cons_tasks_v1';
const loadTasks = () => { try { return JSON.parse(localStorage.getItem(TASKS_KEY) || '[]'); } catch { return []; } };
const saveTasks = (t) => { try { localStorage.setItem(TASKS_KEY, JSON.stringify(t)); } catch {} };

function createTask() {
  return {
    id: genId(),
    title: '新咨询',
    msgs: [],
    ready: false,
    summary: '',
    deckType: 'general',
    pageCount: 10,
    files: [],
    activeFileId: null,
    refFiles: [],
    enableWebSearch: false,
  };
}

export default function ConsultingWorkspace({ customApis }) {
  const [tasks, setTasks] = useState(() => {
    const saved = loadTasks();
    return saved.length > 0 ? saved : [createTask()];
  });
  const [activeId, setActiveId] = useState(() => tasks[0]?.id || null);
  const task = tasks.find(t => t.id === activeId) || tasks[0];
  const taskRef = useRef(task);
  taskRef.current = task;

  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const [showCode, setShowCode] = useState(false);
  const [editMode, setEditMode] = useState(null); // null=preview, 'edit'=editing, 'code'=code
  const [editHtml, setEditHtml] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [fileTab, setFileTab] = useState('generated');
  const [consultRound, setConsultRound] = useState(0);
  const scrollRef = useRef(null);
  const fileInputRef = useRef(null);
  const sessionRef = useRef(genId());
  const abortRef = useRef(null);

  const activeFile = task.files.find(f => f.id === task.activeFileId);
  const generalFiles = task.files.filter(f => f.deckType === 'general');
  const mfgFiles = task.files.filter(f => f.deckType === 'manufacturing');

  const updateTask = useCallback((id, updater) => {
    setTasks(prev => {
      const next = prev.map(t => t.id === id ? (typeof updater === 'function' ? updater(t) : { ...t, ...updater }) : t);
      saveTasks(next);
      return next;
    });
  }, []);

  useEffect(() => { saveTasks(tasks); }, [tasks]);

  useEffect(() => {
    const sid = sessionRef.current;
    connectWS(sid);
    const handleResponse = (data) => {
      if (data._sessionId === sid && data.type === 'consulting_response') {
        updateTask(taskRef.current.id, t => ({
          ...t,
          msgs: [...t.msgs, { role: 'agent', content: data.response, questions: data.questions || [], ts: Date.now() }],
          ...(data.ready ? { ready: true, summary: data.summary || '', pageCount: data.pageCount || 10, deckType: data.deckType || 'general' } : {}),
          ...(data.webContext ? { webContext: data.webContext } : {}),
        }));
      }
    };
    const handleDone = (data) => {
      if (data._sessionId === sid) {
        const t = taskRef.current;
        const newFile = {
          id: genId(),
          name: `咨询_${t.deckType === 'manufacturing' ? '制造' : '通用'}_${new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`,
          html: data.html || '', deckType: t.deckType, timestamp: Date.now(),
        };
        updateTask(t.id, prev => ({ ...prev, files: [newFile, ...prev.files], activeFileId: newFile.id }));
        setIsGenerating(false);
        addToast('咨询演示生成完成!', 'success');
      }
    };
    const handleError = (data) => {
      if (data._sessionId === sid) { setError(data.message || '生成失败'); setIsGenerating(false); }
    };
    on('consulting_response', handleResponse);
    on('done', handleDone);
    on('error', handleError);
    return () => {
      off('consulting_response', handleResponse);
      off('done', handleDone);
      off('error', handleError);
    };
  }, [updateTask]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [task.msgs.length]);

  const handleSend = async () => {
    if (!input.trim() || isGenerating) return;
    const text = input.trim();
    const t = taskRef.current;
    setInput(''); setError('');
    updateTask(t.id, prev => ({ ...prev, msgs: [...prev.msgs, { role: 'user', content: text, ts: Date.now() }] }));
    if (t.msgs.length === 0) updateTask(t.id, { title: text.slice(0, 30) });
    setConsultRound(r => r + 1);
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    try {
      await fetch(`${API_BASE}/api/consulting-chat`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: sessionRef.current, message: text,
          history: t.msgs.map(m => ({ role: m.role, content: m.content })),
          files: t.refFiles, deckType: t.deckType,
          enableWebSearch: t.enableWebSearch,
        }),
        signal: ctrl.signal,
      });
    } catch (err) {
      if (err.name === 'AbortError') return;
      setError('发送失败: ' + err.message);
    }
  };

  const handleGenerate = async () => {
    const t = taskRef.current;
    if (!t.summary) return;
    setError(''); setIsGenerating(true); setShowCode(false);
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    try {
      await fetch(`${API_BASE}/api/generate-consulting-html`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: sessionRef.current, message: t.summary, deckType: t.deckType, pageCount: t.pageCount, files: t.refFiles, enableWebSearch: t.enableWebSearch }),
        signal: ctrl.signal,
      });
    } catch (err) {
      if (err.name === 'AbortError') return;
      setError('生成失败: ' + err.message); setIsGenerating(false);
    }
  };

  const handleNew = () => {
    const t = createTask();
    setTasks(prev => [...prev, t]); setActiveId(t.id);
  };

  const handleDelete = (id) => {
    setTasks(prev => { const n = prev.filter(t => t.id !== id); if (activeId === id) setActiveId(n[0]?.id || null); return n; });
  };

  const handleKey = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } };

  const handleStop = () => { abortRef.current?.abort(); setIsGenerating(false); };

  const handleExportFile = (f) => {
    const blob = new Blob([f.html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = `consulting_${f.deckType}_${f.id}.html`; a.click();
    URL.revokeObjectURL(url);
  };

  const handleDeleteFile = (id) => {
    updateTask(task.id, t => ({ ...t, files: t.files.filter(f => f.id !== id), activeFileId: t.activeFileId === id ? (t.files.filter(f => f.id !== id)[0]?.id || null) : t.activeFileId }));
  };

  const handleUpload = async (e) => {
    const uploaded = Array.from(e.target.files);
    if (!uploaded.length) return;
    const formData = new FormData();
    formData.append('taskId', task.id);
    uploaded.forEach(f => formData.append('files', f));
    try {
      const resp = await fetch(`${API_BASE}/api/upload`, { method: 'POST', body: formData });
      const data = await resp.json();
      if (data.files) {
        const newRefs = data.files.map(f => ({ id: f.id || genId(), name: f.filename, size: f.size, path: f.path, timestamp: Date.now() }));
        updateTask(task.id, t => ({ ...t, refFiles: [...t.refFiles, ...newRefs] }));
      }
    } catch (err) { console.error('Upload failed:', err); }
    e.target.value = '';
  };

  const handleRemoveRef = (idx) => {
    updateTask(task.id, t => ({ ...t, refFiles: t.refFiles.filter((_, i) => i !== idx) }));
  };

  const handleToggleWebSearch = () => {
    updateTask(task.id, t => ({ ...t, enableWebSearch: !t.enableWebSearch }));
  };

  const handleDragOver = (e) => { e.preventDefault(); setDragOver(true); };
  const handleDragLeave = () => setDragOver(false);
  const handleDrop = async (e) => {
    e.preventDefault(); setDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    if (!files.length) return;
    const formData = new FormData();
    formData.append('taskId', task.id);
    files.forEach(f => formData.append('files', f));
    try {
      const resp = await fetch(`${API_BASE}/api/upload`, { method: 'POST', body: formData });
      const data = await resp.json();
      if (data.files) {
        const newRefs = data.files.map(f => ({ id: f.id || genId(), name: f.filename, size: f.size, path: f.path, timestamp: Date.now() }));
        updateTask(task.id, t => ({ ...t, refFiles: [...t.refFiles, ...newRefs] }));
      }
    } catch (err) { console.error('Upload failed:', err); }
  };

  const handleStartEdit = () => {
    if (activeFile) {
      setEditHtml(activeFile.html);
      setEditMode('edit');
    }
  };

  const handleStartCodeEdit = () => {
    if (activeFile) {
      setEditHtml(activeFile.html);
      setEditMode('code');
    }
  };
  const handleSaveEdit = () => {
    if (!activeFile) return;
    updateTask(task.id, t => ({
      ...t,
      files: t.files.map(f => f.id === activeFile.id ? { ...f, html: editHtml, timestamp: Date.now() } : f),
    }));
    setEditMode(null);
  };

  const handleSaveCodeEdit = () => {
    if (!activeFile || !editHtml.trim()) return;
    updateTask(task.id, t => ({
      ...t,
      files: t.files.map(f => f.id === activeFile.id ? { ...f, html: editHtml, timestamp: Date.now() } : f),
    }));
    addToast('代码已保存', 'success');
  };

  return (
    <div id="consulting-workspace">
      {/* Task Sidebar */}
      <div id="consulting-sidebar">
        <div className="consulting-sidebar-header">
          <span className="consulting-sidebar-title">咨询任务</span>
          <button className="consulting-sidebar-new" onClick={handleNew}>+ 新建</button>
        </div>
        <div className="consulting-sidebar-list">
          {tasks.map(t => (
            <div key={t.id} className={`consulting-task-item ${t.id === activeId ? 'active' : ''}`}
              onClick={() => setActiveId(t.id)}>
              <span className="consulting-task-title">{t.title}</span>
              {tasks.length > 1 && (
                <button className="consulting-task-del" onClick={e => { e.stopPropagation(); handleDelete(t.id); }}>×</button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Chat Panel */}
      <div id="consulting-chat-panel" onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}>
        {dragOver && <div className="drag-overlay"><div className="drag-hint">释放文件以上传到参考文件</div></div>}
        <div className="consulting-chat-header">
          <span className="consulting-chat-title">{task.title}</span>
          <div className="consulting-chat-actions">
            <button className={`consulting-type-btn ${task.deckType === 'general' ? 'active' : ''}`}
              onClick={() => updateTask(task.id, { deckType: 'general' })}>通用</button>
            <button className={`consulting-type-btn ${task.deckType === 'manufacturing' ? 'active' : ''}`}
              onClick={() => updateTask(task.id, { deckType: 'manufacturing' })}>制造</button>
            <button className={`consulting-websearch-btn ${task.enableWebSearch ? 'active' : ''}`}
              onClick={handleToggleWebSearch} title={task.enableWebSearch ? '已开启网络搜索 - 点击关闭' : '开启网络搜索 - 搜索实时行业数据'}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              网络搜索
            </button>
            {task.msgs.length > 0 && (
              <button className="consulting-reset-btn" onClick={() => updateTask(task.id, { msgs: [], ready: false, summary: '', error: '' })}>重置</button>
            )}
          </div>
        </div>

        <div className="consulting-chat-body" ref={scrollRef}>
          {task.msgs.length === 0 ? (
            <div className="consulting-chat-empty">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/>
              </svg>
              <p>描述你的咨询演示需求</p>
              <p className="hint">Agent 追问缺失信息，满足标准后生成</p>
            </div>
          ) : (
            task.msgs.map((m, i) => (
              <div key={i} className={`consulting-msg ${m.role}`}>
                <div className="consulting-msg-content">{m.content}</div>
                {m.questions?.length > 0 && !task.ready && (
                  <div className="consulting-msg-questions">
                    {m.questions.map((q, qi) => (
                      <button key={qi} className="consulting-quick-btn" onClick={() => setInput(q)}>{q}</button>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
          {!task.ready && consultRound > 0 && !error && (
            <div className="consulting-progress-hint">
              需求梳理中 · 已对话 {consultRound} 轮 · 请继续补充信息
            </div>
          )}
          {task.ready && !isGenerating && (
            <div className="consulting-ready-banner">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
              <span>需求已充分 — 点击下方生成</span>
            </div>
          )}
          {error && <div className="consulting-error">{error}</div>}
        </div>

        <div className="consulting-chat-input-row">
          {task.ready && !isGenerating ? (
            <button className="consulting-gen-btn" onClick={handleGenerate}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              生成咨询演示 ({task.pageCount}页)
            </button>
          ) : isGenerating ? (
            <div className="consulting-gen-row">
              <div className="consulting-gen-btn disabled" style={{ flex: 1 }}><div className="btn-spinner" />正在生成...</div>
              <button className="consulting-stop-btn" onClick={handleStop}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>
              </button>
            </div>
          ) : (
            <>
              <textarea className="consulting-chat-input" value={input}
                onChange={e => setInput(e.target.value)} onKeyDown={handleKey}
                placeholder="输入需求... (Enter 发送)" rows={2} />
              <button className="consulting-send-btn" onClick={handleSend} disabled={!input.trim()}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
              </button>
            </>
          )}
        </div>

        {task.refFiles.length > 0 && (
          <div className="consulting-ref-chips">
            {task.refFiles.map((f, i) => (
              <div key={i} className="consulting-ref-chip" title={f.name}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                <span>{f.name}</span>
                <button className="consulting-ref-remove" onClick={() => handleRemoveRef(i)}>×</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Preview */}
      <div id="consulting-preview-panel">
        <div className="consulting-preview-header">
          <span className="consulting-preview-title">{activeFile ? activeFile.name : (task.ready ? '准备就绪' : '等待需求充分')}</span>
          <div className="consulting-preview-actions">
            <button className={`consulting-view-btn ${editMode === null ? 'active' : ''}`}
              onClick={() => activeFile && setEditMode(null)} disabled={!activeFile}>预览</button>
            <button className={`consulting-view-btn ${editMode === 'edit' ? 'active' : ''}`}
              onClick={handleStartEdit} disabled={!activeFile}>编辑</button>
            <button className={`consulting-view-btn ${editMode === 'code' ? 'active' : ''}`}
              onClick={handleStartCodeEdit} disabled={!activeFile}>代码</button>
            {editMode === 'edit' && (
              <button className="consulting-save-btn" onClick={handleSaveEdit}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                保存
              </button>
            )}
            {editMode === 'code' && (
              <button className="consulting-save-btn" onClick={handleSaveCodeEdit}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                保存
              </button>
            )}
            {activeFile && (editMode === null || editMode === 'code') && (
              <button className="consulting-export-btn" onClick={() => handleExportFile(activeFile)}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>下载
              </button>
            )}
          </div>
        </div>
        <div className="consulting-preview-frame">
          {activeFile ? (
            editMode === 'edit' ? (
              <textarea className="consulting-edit-area" value={editHtml}
                onChange={e => setEditHtml(e.target.value)} spellCheck={false} />
            ) : editMode === 'code' ? (
              <textarea className="consulting-code-view" value={editHtml}
                onChange={e => setEditHtml(e.target.value)} spellCheck={false} />
            ) : (
              <iframe srcDoc={activeFile.html} title="Consulting" sandbox="allow-scripts allow-same-origin"
                style={{ width: '100%', height: '100%', border: 'none', background: '#E5E7EB' }} />
            )
          ) : (
            <div className="consulting-empty-preview">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.3"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/></svg>
              <p>新建任务 → 对话 → 生成</p>
            </div>
          )}
        </div>
      </div>

      {/* File Panel */}
      <div id="consulting-file-panel">
        <div className="consulting-file-tabs">
          <button className={`consulting-file-tab ${fileTab !== 'reference' ? 'active' : ''}`}
            onClick={() => setFileTab('generated')}>生成文件</button>
          <button className={`consulting-file-tab ${fileTab === 'reference' ? 'active' : ''}`}
            onClick={() => setFileTab('reference')}>参考文件</button>
          {fileTab === 'reference' && (
            <button className="consulting-file-upload" onClick={() => fileInputRef.current?.click()} title="上传">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            </button>
          )}
        </div>
        <div className="consulting-file-list">
          {fileTab === 'reference' ? (
            task.refFiles.length === 0 ? (
              <div className="consulting-file-empty"><p>上传参考文件</p><p className="hint">图片/文档/代码/数据</p></div>
            ) : (
              task.refFiles.map((f, i) => (
                <div key={i} className="consulting-ref-item" title={f.name}>
                  <div className="consulting-ref-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg></div>
                  <div className="consulting-ref-info"><span className="consulting-ref-name">{f.name}</span><span className="consulting-ref-size">{formatSize(f.size)}</span></div>
                  <button className="consulting-ref-remove-btn" onClick={() => handleRemoveRef(i)}><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>
                </div>
              ))
            )
          ) : (
            task.files.length === 0 ? <div className="consulting-file-empty">暂无文件</div> : (<>
              {generalFiles.length > 0 && (<div className="consulting-file-group"><div className="consulting-file-group-title">通用 ({generalFiles.length})</div>
                {generalFiles.map(f => (<div key={f.id} className={`consulting-file-item ${f.id === task.activeFileId ? 'active' : ''}`} onClick={() => updateTask(task.id, { activeFileId: f.id })}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/></svg>
                  <span className="consulting-file-name">{f.name}</span>
                  <button className="consulting-file-del" onClick={e => { e.stopPropagation(); handleDeleteFile(f.id); }}>×</button>
                </div>))}
              </div>)}
              {mfgFiles.length > 0 && (<div className="consulting-file-group"><div className="consulting-file-group-title">制造 ({mfgFiles.length})</div>
                {mfgFiles.map(f => (<div key={f.id} className={`consulting-file-item ${f.id === task.activeFileId ? 'active' : ''}`} onClick={() => updateTask(task.id, { activeFileId: f.id })}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
                  <span className="consulting-file-name">{f.name}</span>
                  <button className="consulting-file-del" onClick={e => { e.stopPropagation(); handleDeleteFile(f.id); }}>×</button>
                </div>))}
              </div>)}
            </>)
          )}
        </div>
      </div>
    </div>
  );
}
