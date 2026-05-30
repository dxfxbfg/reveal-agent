import React, { useState, useEffect, useRef, useCallback } from 'react';
import { API_BASE, genId } from '../config.js';
import { connectWS, on, off } from '../ws.js';
import { addToast } from './Toast.jsx';

const TASKS_KEY = 'anim_tasks_v2';
const loadTasks = () => { try { return JSON.parse(localStorage.getItem(TASKS_KEY) || '[]'); } catch { return []; } };
const saveTasks = (t) => { try { localStorage.setItem(TASKS_KEY, JSON.stringify(t)); } catch {} };

function createTask() {
  return { id: genId(), title: '新动画', mode: 'ppt', msgs: [], files: [], activeFileId: null, refFiles: [] };
}

export default function AnimationWorkspace({ customApis }) {
  const [tasks, setTasks] = useState(() => { const s = loadTasks(); return s.length > 0 ? s : [createTask()]; });
  const [activeId, setActiveId] = useState(() => tasks[0]?.id || null);
  const task = tasks.find(t => t.id === activeId) || tasks[0];
  const taskRef = useRef(task); taskRef.current = task;

  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const [showCode, setShowCode] = useState(false);
  const [editCode, setEditCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [fileTab, setFileTab] = useState('generated');
  const [dragOver, setDragOver] = useState(false);
  const scrollRef = useRef(null);
  const fileInputRef = useRef(null);
  const sessionRef = useRef(genId());
  const abortRef = useRef(null);

  const activeFile = task.files.find(f => f.id === task.activeFileId);
  const pptFiles = task.files.filter(f => f.mode === 'ppt');
  const flowFiles = task.files.filter(f => f.mode === 'flowchart');

  const updateTask = useCallback((id, updater) => {
    setTasks(prev => { const n = prev.map(t => t.id === id ? (typeof updater === 'function' ? updater(t) : { ...t, ...updater }) : t); saveTasks(n); return n; });
  }, []);

  useEffect(() => { saveTasks(tasks); }, [tasks]);

  useEffect(() => {
    const sid = sessionRef.current;
    connectWS(sid);
    const handleDone = (data) => {
      if (data._sessionId === sid) {
        const t = taskRef.current;
        const newFile = { id: genId(), name: `${t.mode === 'ppt' ? 'PPT' : 'Flow'}_${new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`, html: data.html || '', mode: t.mode, timestamp: Date.now() };
        updateTask(t.id, prev => ({ ...prev, files: [newFile, ...prev.files], activeFileId: newFile.id, msgs: [...prev.msgs, { role: 'agent', content: '动画已生成', fileId: newFile.id, ts: Date.now() }] }));
        setIsGenerating(false);
        addToast('动画生成完成!', 'success');
      }
    };
    const handleError = (data) => { if (data._sessionId === sid) { setError(data.message || '生成失败'); setIsGenerating(false); } };
    const handleStep = (data) => { if (data._sessionId === sid) { /* progress shown in chat */ } };
    on('done', handleDone); on('error', handleError); on('agent_step', handleStep);
    return () => { off('done', handleDone); off('error', handleError); off('agent_step', handleStep); };
  }, [updateTask]);

  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [task.msgs.length]);

  const handleSend = async () => {
    if (!input.trim() || isGenerating) return;
    const text = input.trim();
    const t = taskRef.current;
    setInput(''); setError('');
    updateTask(t.id, prev => ({ ...prev, msgs: [...prev.msgs, { role: 'user', content: text, ts: Date.now() }] }));
    if (t.msgs.length === 0) updateTask(t.id, { title: text.slice(0, 30) });
    setIsGenerating(true);

    const endpoint = t.mode === 'ppt' ? '/api/generate-animation-ppt' : '/api/generate-animation-flowchart';
    const body = { sessionId: sessionRef.current, ...(t.mode === 'ppt' ? { message: text } : { html: text, message: '按流程图风格呈现' }) };
    const ctrl = new AbortController(); abortRef.current = ctrl;
    try {
      await fetch(`${API_BASE}${endpoint}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: ctrl.signal });
    } catch (err) {
      if (err.name === 'AbortError') return;
      setError('发送失败: ' + err.message); setIsGenerating(false);
    }
  };

  const handleStop = () => { abortRef.current?.abort(); setIsGenerating(false); };
  const handleKey = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } };
  const handleNew = () => { const t = createTask(); setTasks(prev => [...prev, t]); setActiveId(t.id); };
  const handleDeleteTask = (id) => { setTasks(prev => { const n = prev.filter(t => t.id !== id); if (activeId === id) setActiveId(n[0]?.id || null); return n; }); };
  const handleDeleteFile = (id) => { updateTask(task.id, t => ({ ...t, files: t.files.filter(f => f.id !== id), activeFileId: t.activeFileId === id ? (t.files.filter(f => f.id !== id)[0]?.id || null) : t.activeFileId })); };
  const handleExportFile = (f) => { const b = new Blob([f.html], { type: 'text/html' }); const u = URL.createObjectURL(b); const a = document.createElement('a'); a.href = u; a.download = `anim_${f.mode}_${f.id}.html`; a.click(); URL.revokeObjectURL(u); };
  const handleCopyCode = async (html) => {
    try { await navigator.clipboard.writeText(html); setCopied(true); setTimeout(() => setCopied(false), 2000); }
    catch { const ta = document.createElement('textarea'); ta.value = html; ta.style.position = 'fixed'; ta.style.opacity = '0'; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta); setCopied(true); setTimeout(() => setCopied(false), 2000); }
  };

  const handleCodeChange = (e) => {
    setEditCode(e.target.value);
  };

  const handleSaveCode = () => {
    if (activeFile && editCode) {
      updateTask(task.id, t => ({
        ...t,
        files: t.files.map(f => f.id === activeFile.id ? { ...f, html: editCode, timestamp: Date.now() } : f),
      }));
      addToast('代码已保存', 'success');
    }
  };

  // 预处理 iframe HTML：PPT 模板用 vw/vh 自适应，无需缩放
  const prepareHtml = (html, mode) => {
    if (mode === 'ppt') {
      // PPT 模板本身用 100vw/100vh，直接渲染即可
      return html.replace('</head>',
        '<meta name="viewport" content="width=device-width,initial-scale=1.0"><style>html,body{overflow:hidden!important;margin:0!important;padding:0!important}</style></head>');
    }
    if (mode === 'flowchart') {
      // 流程图模板 .an 元素默认 opacity:0，需要确保 active section 的动画触发
      return html.replace('</head>',
        '<style>section.active .an,section.active .an[class*="delay"]{animation:fadeInUp 0.8s ease forwards!important}</style></head>');
    }
    return html;
  };
  const handleDragOver = (e) => { e.preventDefault(); setDragOver(true); }; const handleDragLeave = () => setDragOver(false);
  const handleDrop = async (e) => { e.preventDefault(); setDragOver(false); const fs = Array.from(e.dataTransfer.files); if (!fs.length) return; const fd = new FormData(); fd.append('taskId', task.id); fs.forEach(f => fd.append('files', f)); try { const r = await fetch(`${API_BASE}/api/upload`, { method: 'POST', body: fd }); const d = await r.json(); if (d.files) { const refs = d.files.map(f => ({ id: f.id || genId(), name: f.filename, size: f.size, path: f.path, ts: Date.now() })); updateTask(task.id, t => ({ ...t, refFiles: [...t.refFiles, ...refs] })); } } catch {} };
  const handleUpload = async (e) => { const fs = Array.from(e.target.files); if (!fs.length) return; const fd = new FormData(); fd.append('taskId', task.id); fs.forEach(f => fd.append('files', f)); try { const r = await fetch(`${API_BASE}/api/upload`, { method: 'POST', body: fd }); const d = await r.json(); if (d.files) { const refs = d.files.map(f => ({ id: f.id || genId(), name: f.filename, size: f.size, path: f.path, ts: Date.now() })); updateTask(task.id, t => ({ ...t, refFiles: [...t.refFiles, ...refs] })); } } catch {} e.target.value = ''; };
  const handleRemoveRef = (i) => { updateTask(task.id, t => ({ ...t, refFiles: t.refFiles.filter((_, j) => j !== i) })); };

  return (
    <div id="animation-workspace">
      <div id="animation-sidebar">
        <div className="animation-sidebar-header"><span className="animation-sidebar-title">动画任务</span><button className="animation-sidebar-new" onClick={handleNew}>+ 新建</button></div>
        <div className="animation-sidebar-list">
          {tasks.map(t => (<div key={t.id} className={`animation-task-item ${t.id === activeId ? 'active' : ''}`} onClick={() => setActiveId(t.id)}><span className="animation-task-title">{t.title}</span>{tasks.length > 1 && <button className="animation-task-del" onClick={e => { e.stopPropagation(); handleDeleteTask(t.id); }}>×</button>}</div>))}
        </div>
      </div>

      <div id="animation-chat-panel" onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}>
        {dragOver && <div className="drag-overlay"><div className="drag-hint">释放文件以上传</div></div>}
        <div className="animation-chat-header">
          <span className="animation-chat-title">{task.title}</span>
          <div className="animation-chat-actions">
            <button className={`anim-mode-btn ${task.mode === 'ppt' ? 'active' : ''}`} onClick={() => updateTask(task.id, { mode: 'ppt' })} disabled={isGenerating}>PPT</button>
            <button className={`anim-mode-btn ${task.mode === 'flowchart' ? 'active' : ''}`} onClick={() => updateTask(task.id, { mode: 'flowchart' })} disabled={isGenerating}>流程图</button>
          </div>
        </div>

        <div className="animation-chat-body" ref={scrollRef}>
          {task.msgs.length === 0 && (
            <div className="animation-chat-empty">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              <p>{task.mode === 'ppt' ? '输入科普文本，生成 PPT 动画' : '粘贴 HTML，生成流程图'}</p>
              <p className="hint">{task.mode === 'ppt' ? '26 个 Level2 模板自动选用' : '14 个 Animation 模板自动选用'}</p>
            </div>
          )}
          {task.msgs.map((m, i) => (
            <div key={i} className={`anim-msg ${m.role}`}>
              <div className="anim-msg-content">{m.content}</div>
              {m.fileId && (() => { const f = task.files.find(ff => ff.id === m.fileId); return f ? (
                <div className="anim-msg-file">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="20" height="14" rx="3"/><path d="M2 9h20"/></svg>
                  <span>{f.name}</span>
                  <button className="anim-msg-preview-btn" onClick={() => { updateTask(task.id, { activeFileId: f.id }); setShowCode(false); }}>预览</button>
                </div>
              ) : null; })()}
            </div>
          ))}
          {isGenerating && (<div className="anim-msg agent"><div className="anim-msg-content"><div className="btn-spinner" style={{ width: 12, height: 12, borderWidth: 2, borderColor: 'rgba(0,0,0,0.15)', borderTopColor: 'var(--accent)', display: 'inline-block', marginRight: 6 }} />正在生成{task.mode === 'ppt' ? ' PPT' : ' 流程图'}...</div></div>)}
          {error && <div className="animation-error">{error}</div>}
        </div>

        <div className="animation-chat-input-row">
          {isGenerating ? (
            <div className="anim-gen-row">
              <div className="anim-gen-btn disabled" style={{ flex: 1 }}><div className="btn-spinner" />生成中...</div>
              <button className="anim-stop-btn" onClick={handleStop}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="6" y="6" width="12" height="12" rx="2"/></svg></button>
            </div>
          ) : (
            <>
              <textarea className="anim-chat-input" value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKey}
                placeholder={task.mode === 'ppt' ? '输入科普文本... (Enter 发送)' : '粘贴 HTML 代码... (Enter 发送)'} rows={2} disabled={isGenerating} />
              <button className="anim-send-btn" onClick={handleSend} disabled={!input.trim()}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
              </button>
            </>
          )}
        </div>

        {task.refFiles.length > 0 && (
          <div className="anim-ref-chips">
            {task.refFiles.map((f, i) => (<div key={i} className="anim-ref-chip" title={f.name}><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg><span>{f.name}</span><button className="anim-ref-remove" onClick={() => handleRemoveRef(i)}>×</button></div>))}
          </div>
        )}
      </div>

      <div id="animation-preview-panel">
        <div className="animation-preview-header">
          <span className="animation-preview-title">{activeFile ? activeFile.name : '预览区'}</span>
          <div className="animation-preview-actions">
            {activeFile && (<>
              <button className={`animation-view-toggle ${!showCode ? 'active' : ''}`} onClick={() => setShowCode(false)}>预览</button>
              <button className={`animation-view-toggle ${showCode ? 'active' : ''}`} onClick={() => { setEditCode(activeFile.html); setShowCode(true); }}>代码</button>
              <button className="animation-export-btn" onClick={() => handleCopyCode(activeFile.html)} style={{ padding: '3px 10px', fontSize: '10px' }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>{copied ? '已复制' : '复制'}
              </button>
              <button className="animation-export-btn" onClick={() => handleExportFile(activeFile)} style={{ padding: '3px 10px', fontSize: '10px' }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>下载
              </button>
            </>)}
          </div>
        </div>
        <div className="animation-preview-frame">
          {activeFile ? (showCode ? (
            <div className="animation-code-panel">
              <textarea className="animation-code-view" value={editCode}
                onChange={handleCodeChange} spellCheck={false} />
              <button className="animation-code-save-btn" onClick={handleSaveCode}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                保存代码
              </button>
            </div>
          ) : <iframe srcDoc={prepareHtml(activeFile.html, activeFile.mode)} title="Preview" sandbox="allow-scripts allow-same-origin" style={{ width: '100%', height: '100%', border: 'none', background: '#fff' }} />) : (
            <div className="animation-empty-preview"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.3"><rect x="2" y="4" width="20" height="14" rx="3"/><path d="M2 9h20"/></svg><p>输入内容后点击发送</p></div>
          )}
        </div>
      </div>

      <div id="animation-file-panel">
        <div className="animation-file-tabs">
          <button className={`animation-file-tab ${fileTab !== 'reference' ? 'active' : ''}`} onClick={() => setFileTab('generated')}>生成文件</button>
          <button className={`animation-file-tab ${fileTab === 'reference' ? 'active' : ''}`} onClick={() => setFileTab('reference')}>参考文件</button>
          {fileTab === 'reference' && <button className="animation-file-upload" onClick={() => fileInputRef.current?.click()} title="上传"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg></button>}
        </div>
        <div className="animation-file-list">
          {fileTab === 'reference' ? (task.refFiles.length === 0 ? <div className="animation-file-empty"><p>上传参考文件</p></div> : task.refFiles.map((f, i) => (<div key={i} className="anim-ref-item" title={f.name}><div className="anim-ref-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg></div><div className="anim-ref-info"><span className="anim-ref-name">{f.name}</span></div><button className="anim-ref-remove-btn" onClick={() => handleRemoveRef(i)}><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button></div>))) : (task.files.length === 0 ? <div className="animation-file-empty">暂无文件</div> : (<>
            {pptFiles.length > 0 && (<div className="animation-file-group"><div className="animation-file-group-title">PPT ({pptFiles.length})</div>{pptFiles.map(f => (<div key={f.id} className={`animation-file-item ${f.id === task.activeFileId ? 'active' : ''}`} onClick={() => updateTask(task.id, { activeFileId: f.id })}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="20" height="14" rx="3"/><path d="M2 9h20"/></svg><span className="animation-file-name">{f.name}</span><button className="animation-file-del" onClick={e => { e.stopPropagation(); handleDeleteFile(f.id); }}>×</button></div>))}</div>)}
            {flowFiles.length > 0 && (<div className="animation-file-group"><div className="animation-file-group-title">流程图 ({flowFiles.length})</div>{flowFiles.map(f => (<div key={f.id} className={`animation-file-item ${f.id === task.activeFileId ? 'active' : ''}`} onClick={() => updateTask(task.id, { activeFileId: f.id })}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="8" y="14" width="7" height="7" rx="1"/></svg><span className="animation-file-name">{f.name}</span><button className="animation-file-del" onClick={e => { e.stopPropagation(); handleDeleteFile(f.id); }}>×</button></div>))}</div>)}
          </>))}
        </div>
      </div>
      <input ref={fileInputRef} type="file" multiple style={{ display: 'none' }} onChange={handleUpload} />
    </div>
  );
}
