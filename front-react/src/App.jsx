import React, { useEffect, useCallback, useRef, useReducer, useState } from 'react';
import { initialState, reducer, genId, API_BASE, getCustomApiForModel } from './config.js';
import { connectWS, on, off } from './ws.js';
import * as draftStore from './draftStore.js';
import Sidebar from './components/Sidebar.jsx';
import ChatPanel from './components/ChatPanel.jsx';
import MainPanel from './components/MainPanel.jsx';
import RightPanel from './components/RightPanel.jsx';
import AnimationWorkspace from './components/AnimationWorkspace.jsx';
import ConsultingWorkspace from './components/ConsultingWorkspace.jsx';
import ControlPanel from './components/ControlPanel.jsx';
import ConfirmModal from './components/ConfirmModal.jsx';
import ToastContainer, { addToast } from './components/Toast.jsx';

export default function App() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const { tasks, activeTaskId, customApis = [] } = state;
  const task = tasks.find(t => t.id === activeTaskId) || tasks[0];
  const taskRef = useRef(task);
  taskRef.current = task;

  // workspace 选中状态持久化 — 刷新页面/关闭浏览器后回到上次所在的工作区
  // 只接受 4 个已知 workspace 值，防止 localStorage 被人为污染后页面渲染异常
  const [workspace, setWorkspaceRaw] = useState(() => {
    try {
      const saved = localStorage.getItem('ra_active_workspace');
      return ['slides', 'animation', 'consulting', 'control'].includes(saved) ? saved : 'slides';
    } catch { return 'slides'; }
  });
  const setWorkspace = (next) => {
    setWorkspaceRaw(next);
    try { localStorage.setItem('ra_active_workspace', next); } catch {}
  };
  const [confirmAction, setConfirmAction] = useState(null);
  const [globalModel, setGlobalModel] = useState(() => {
    try { return localStorage.getItem('globalModel') || 'normal'; } catch { return 'normal'; }
  });
  const [showApiModal, setShowApiModal] = useState(false);
  const [apiName, setApiName] = useState('');
  const [apiUrl, setApiUrl] = useState('');
  const [apiKey, setApiKey] = useState('');

  useEffect(() => {
    const ids = new Set(tasks.map(t => t.id));
    ids.forEach(id => connectWS(id));
  }, [tasks.length]);

  useEffect(() => {
    if (activeTaskId) connectWS(activeTaskId);
  }, [activeTaskId]);

  useEffect(() => {
    const handleStep = (data) => {
      const id = data._sessionId || data.taskId;
      if (id) dispatch({ type: 'UPDATE_STEP', taskId: id, step: data.step, label: data.message });
    };
    const handleTool = (data) => {
      const id = data._sessionId || data.taskId;
      if (id) dispatch({ type: 'ADD_TOOL_LOG', taskId: id, name: data.name, args: data.args, result: data.result });
    };
    const handleFeedback = (data) => {
      const id = data._sessionId || data.taskId;
      if (id) dispatch({ type: 'ADD_FEEDBACK_LOG', taskId: id, round: data.round, score: data.score, feedback: data.feedback });
    };
    const handleKnowledge = (data) => {
      const id = data._sessionId || data.taskId;
      if (id) dispatch({ type: 'ADD_KNOWLEDGE_LOG', taskId: id, status: data.status, topic: data.topic });
    };
    const handleDone = (data) => {
      const id = data._sessionId || data.taskId;
      if (id) {
        const fileId = genId();
        dispatch({
          type: 'FINISH_GENERATION',
          taskId: id,
          fileId,
          html: data.html,
          agentMessage: '演示文稿已生成。',
        });
        addToast('幻灯片生成完成!', 'success');
      }
    };
    const handleError = (data) => {
      const id = data._sessionId || data.taskId;
      if (id) {
        dispatch({ type: 'FAIL_GENERATION', taskId: id, error: data.message });
        addToast(data.message, 'error');
      }
    };

    on('agent_step', handleStep);
    on('tool_call', handleTool);
    on('feedback_round', handleFeedback);
    on('knowledge_compile', handleKnowledge);
    on('done', handleDone);
    on('error', handleError);

    return () => {
      off('agent_step', handleStep);
      off('tool_call', handleTool);
      off('feedback_round', handleFeedback);
      off('knowledge_compile', handleKnowledge);
      off('done', handleDone);
      off('error', handleError);
    };
  }, []);

  const sendMessage = useCallback(async (text) => {
    if (!text.trim()) return;
    const t = taskRef.current;
    dispatch({ type: 'ADD_MESSAGE', taskId: t.id, role: 'user', content: text });
    if (t.messages.length === 0) {
      dispatch({ type: 'SET_TASK_TITLE', id: t.id, title: text.slice(0, 30) });
    }

    const customApi = getCustomApiForModel(globalModel, customApis);
    const currentHtml = (() => {
      const activeFile = t.generatedFiles.find(f => f.id === t.activeFileId);
      return activeFile?.versions[activeFile.currentVersionIdx]?.html || '';
    })();

    const payload = {
      sessionId: t.id,
      message: text,
      history: t.messages.map(m => ({ role: m.role, content: m.content })),
      files: t.droppedFiles.filter(f => f.path),   // 只传已经上传到服务器的文件
      qualityTier: t.qualityTier,
      pageCount: t.autoPageCount ? 0 : (t.pageCount || 10),
      enableFeedback: t.qualityTier === 'normal',
      model: customApi ? 'custom' : globalModel,
      ...(customApi ? { apiUrl: customApi.url, apiKey: customApi.key } : {}),
      currentHtml,
    };

    const controller = new AbortController();
    dispatch({ type: 'START_GENERATION', taskId: t.id, payload, controller });

    try {
      const resp = await fetch(`${API_BASE}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      if (!resp.ok) {
        const errText = await resp.text();
        throw new Error(errText);
      }
    } catch (err) {
      if (err.name === 'AbortError') return;
      dispatch({ type: 'FAIL_GENERATION', taskId: t.id, error: '发送失败: ' + err.message });
      addToast('发送失败: ' + err.message, 'error');
    }
  }, [customApis]);

  const continueGeneration = useCallback(async () => {
    const t = taskRef.current;
    const payload = t.generation.lastSendPayload;
    if (!payload) return addToast('没有可恢复的状态', 'error');
    const controller = new AbortController();
    dispatch({ type: 'START_GENERATION', taskId: t.id, payload, controller });
    try {
      const resp = await fetch(`${API_BASE}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      if (!resp.ok) {
        const errText = await resp.text();
        throw new Error(errText);
      }
    } catch (err) {
      if (err.name === 'AbortError') return;
      dispatch({ type: 'FAIL_GENERATION', taskId: t.id, error: '生成失败: ' + err.message });
      addToast('生成失败: ' + err.message, 'error');
    }
  }, []);

  const handleStop = () => {
    task.generation.abortController?.abort();
    dispatch({ type: 'STOP_GENERATION', taskId: task.id });
  };

  const handleDiscard = () => {
    setConfirmAction({
      type: 'discard',
      title: '放弃生成？',
      message: '当前生成进度将被丢弃，无法恢复。',
      onConfirm: () => {
        dispatch({ type: 'STOP_GENERATION', taskId: task.id });
        dispatch({ type: 'CLEAR_LAST_PAYLOAD', taskId: task.id });
        dispatch({ type: 'CLEAR_DROPPED_FILES', taskId: task.id });
        setConfirmAction(null);
      },
      onCancel: () => setConfirmAction(null),
    });
  };

  const handleEditFileHtml = useCallback((fileId, html) => {
    dispatch({ type: 'EDIT_FILE_VERSION', taskId: task.id, fileId, html });
  }, [task.id]);

  const switchTask = (id) => dispatch({ type: 'SET_ACTIVE_TASK', id });
  const newTask = () => dispatch({ type: 'ADD_TASK' });
  const deleteTask = (id) => {
    draftStore.remove(id);  // 同步清掉被删 task 的草稿
    dispatch({ type: 'DELETE_TASK', id });
  };

  // 启动时清理孤儿草稿（task 列表里已不存在的 id 直接清掉）
  // 读 LRU 索引 → 跟当前 task 列表对比 → 多余的全删
  useEffect(() => {
    try {
      const idx = JSON.parse(localStorage.getItem('ra_chat_draft_index') || '[]');
      const validIds = new Set(tasks.map(t => t.id));
      const orphans = (Array.isArray(idx) ? idx : [])
        .map(e => e?.id)
        .filter(id => typeof id === 'string' && !validIds.has(id));
      if (orphans.length > 0) draftStore.cleanupOrphans(orphans);
    } catch {}
  }, []);  // 只在 mount 跑一次

  const selectFile = (fileId) => dispatch({ type: 'SET_CURRENT_FILE', taskId: task.id, fileId });
  const deleteFile = (taskId, fileId) => dispatch({ type: 'DELETE_FILE', taskId, fileId });
  const renameFile = (taskId, fileId, name) => dispatch({ type: 'RENAME_FILE', taskId, fileId, name });
  const loadVersion = (taskId, fileId, verIdx) => dispatch({ type: 'LOAD_FILE_VERSION', taskId, fileId, verIdx });
  const saveVersion = useCallback((taskId, fileId) => {
    const t = tasks.find(t => t.id === taskId);
    const f = t?.generatedFiles.find(g => g.id === fileId);
    if (!f) return;
    const html = f.versions[f.currentVersionIdx]?.html;
    if (html) {
      dispatch({ type: 'ADD_FILE_VERSION', taskId, fileId, html });
      addToast(`已保存为版本 ${f.versions.length + 1}`, 'success');
    }
  }, [tasks]);

  const toggleExpand = (taskId, fileId, expanded) => dispatch({ type: 'EXPAND_FILE', taskId, fileId, expanded });

  const handleUploadFiles = async (files) => {
    const formData = new FormData();
    formData.append('taskId', task.id);
    files.forEach(f => formData.append('files', f));
    try {
      const resp = await fetch(`${API_BASE}/api/upload`, { method: 'POST', body: formData });
      const data = await resp.json();
      if (data.files) {
        // 同时加入参考文件列表和更新 droppedFiles 的 server path
        const pathMap = {};
        data.files.forEach(f => {
          pathMap[f.filename] = f.path;
          dispatch({
            type: 'ADD_REFERENCE_FILE',
            taskId: task.id,
            file: {
              id: f.id || genId(),
              name: f.filename,
              size: f.size,
              content: f.content || '',
              timestamp: Date.now(),
            },
          });
        });
        // 关键修复：把 server 返回的 path 同步到 droppedFiles，这样后端才能读到文件内容
        if (Object.keys(pathMap).length > 0) {
          dispatch({ type: 'SET_DROPPED_PATHS', taskId: task.id, pathMap });
        }
      }
    } catch (err) {
      console.error('Upload failed:', err);
    }
  };

  const removeDropped = (fileName) => dispatch({ type: 'REMOVE_DROPPED_FILE', taskId: task.id, fileName });
  const addDropped = (file) => dispatch({ type: 'ADD_DROPPED_FILE', taskId: task.id, file });

  const uploadComplete = (files) => {
    files.forEach(f => dispatch({ type: 'ADD_REFERENCE_FILE', taskId: task.id, file }));
  };
  const removeReference = (idx) => dispatch({ type: 'REMOVE_REFERENCE_FILE', taskId: task.id, idx });

  const handleModelChange = (model) => {
    setGlobalModel(model);
    localStorage.setItem('globalModel', model);
    const labels = { normal: 'MiniMax M2.7', sonnet: 'Claude Sonnet', haiku: 'Claude Haiku', 'gpt-4o': 'GPT-4o' };
    const label = labels[model] || model;
    addToast(`已切换至 ${label}`, 'success');
  };
  const handleQualityChange = (tier) => {
    dispatch({ type: 'SET_QUALITY_TIER', taskId: task.id, tier });
  };
  const handleSaveApi = () => {
    if (!apiName.trim() || !apiUrl.trim() || !apiKey.trim()) return;
    dispatch({ type: 'ADD_CUSTOM_API', api: { name: apiName.trim(), url: apiUrl.trim(), key: apiKey.trim() } });
    setApiName(''); setApiUrl(''); setApiKey('');
    setShowApiModal(false);
    addToast(`已添加: ${apiName.trim()}`, 'success');
  };

  const activeFile = task.generatedFiles.find(f => f.id === task.activeFileId);

  return (
    <>
      <div id="header">
        <div className="header-brand">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <rect x="2" y="4" width="20" height="14" rx="3" fill="none"/>
            <path d="M2 9h20"/>
            <circle cx="7" cy="6.5" r="1" fill="currentColor"/>
            <circle cx="10.5" cy="6.5" r="1" fill="currentColor"/>
            <circle cx="14" cy="6.5" r="1" fill="currentColor"/>
          </svg>
          <h1>reveal<span>-agent</span></h1>
        </div>

        <div id="workspace-tabs">
          <button
            className={`ws-tab ${workspace === 'slides' ? 'active' : ''}`}
            onClick={() => setWorkspace('slides')}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="4" width="20" height="14" rx="3"/>
              <path d="M2 9h20"/>
            </svg>
            幻灯片
          </button>
          <button
            className={`ws-tab ${workspace === 'animation' ? 'active' : ''}`}
            onClick={() => setWorkspace('animation')}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="5 3 19 12 5 21 5 3"/>
            </svg>
            动画
          </button>
          <button
            className={`ws-tab ${workspace === 'consulting' ? 'active' : ''}`}
            onClick={() => setWorkspace('consulting')}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <line x1="3" y1="9" x2="21" y2="9"/>
              <line x1="9" y1="21" x2="9" y2="9"/>
            </svg>
            咨询
          </button>
          <button
            className={`ws-tab ${workspace === 'control' ? 'active' : ''}`}
            onClick={() => setWorkspace('control')}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06-.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
            控制台
          </button>
        </div>

        <div id="header-controls">
          <select className="header-model-select" value={globalModel}
            onChange={e => handleModelChange(e.target.value)}>
            <option value="normal">MiniMax M2.7</option>
            <option value="sonnet">Claude Sonnet</option>
            <option value="haiku">Claude Haiku</option>
            <option value="gpt-4o">GPT-4o</option>
            {(customApis || []).map(a => (
              <option key={`custom-${a.name}`} value={`custom-${a.name}`}>{a.name}</option>
            ))}
          </select>
          <button className="header-api-btn" onClick={() => setShowApiModal(true)} title="自定义API">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
          </button>
        </div>
      </div>

      <div className="main-panel" style={{ display: workspace === 'slides' ? 'flex' : 'none' }}>
        <Sidebar
          tasks={tasks}
          activeTaskId={activeTaskId}
          onSwitch={switchTask}
          onNew={newTask}
          onDelete={deleteTask}
        />

        <div id="workspace">
          <ChatPanel
            task={task}
            qualityTier={task.qualityTier}
            pageCount={task.pageCount}
            autoPageCount={task.autoPageCount}
            enableFeedback={task.enableFeedback}
            onQualityChange={handleQualityChange}
            onPageCountChange={(c) => dispatch({ type: 'SET_PAGE_COUNT', taskId: task.id, count: c })}
            onAutoPageCountChange={(v) => dispatch({ type: 'SET_AUTO_PAGE_COUNT', taskId: task.id, value: v })}
            onEnableFeedbackChange={(v) => dispatch({ type: 'SET_ENABLE_FEEDBACK', taskId: task.id, value: v })}
            onSend={sendMessage}
            onStop={handleStop}
            onContinue={continueGeneration}
            onDiscard={handleDiscard}
            onUploadFiles={handleUploadFiles}
            onRemoveDropped={removeDropped}
            onAddDropped={addDropped}
          />

            <MainPanel
              task={task}
              activeFile={activeFile}
              active={workspace === 'slides'}
              onStop={handleStop}
            onContinue={continueGeneration}
            onDiscard={handleDiscard}
            onEditFileHtml={handleEditFileHtml}
          />
        </div>

        <RightPanel
          task={task}
          onSelectFile={selectFile}
          onDeleteFile={deleteFile}
          onRenameFile={renameFile}
          onLoadVersion={loadVersion}
          onSaveVersion={saveVersion}
          onToggleExpand={toggleExpand}
          onUploadComplete={uploadComplete}
          onRemoveReference={removeReference}
          onAddDropped={addDropped}
        />
      </div>

      <div className="main-panel" style={{ display: workspace === 'animation' ? 'flex' : 'none' }}>
        <AnimationWorkspace customApis={customApis} />
      </div>

      <div className="main-panel" style={{ display: workspace === 'consulting' ? 'flex' : 'none' }}>
        <ConsultingWorkspace customApis={customApis} />
      </div>

      <div className="main-panel" style={{ display: workspace === 'control' ? 'flex' : 'none' }}>
        <ControlPanel />
      </div>

      {confirmAction && (
        <ConfirmModal
          type={confirmAction.type}
          title={confirmAction.title}
          message={confirmAction.message}
          onConfirm={confirmAction.onConfirm}
          onCancel={confirmAction.onCancel}
        />
      )}

      {showApiModal && (
        <div className="confirm-overlay" onClick={() => setShowApiModal(false)}>
          <div className="confirm-card api-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-icon-wrap">
              <div className="modal-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24">
                  <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                </svg>
              </div>
            </div>
            <div className="modal-title-text">添加自定义 API</div>
            <div className="modal-body">
              <div className="form-group">
                <label>名称</label>
                <input type="text" placeholder="My API" value={apiName} onChange={e => setApiName(e.target.value)} />
              </div>
              <div className="form-group">
                <label>API URL</label>
                <input type="text" placeholder="https://api.example.com/v1/chat/completions" value={apiUrl} onChange={e => setApiUrl(e.target.value)} />
              </div>
              <div className="form-group">
                <label>API Key</label>
                <input type="password" placeholder="sk-..." value={apiKey} onChange={e => setApiKey(e.target.value)} />
              </div>
            </div>
            <div className="confirm-actions">
              <button className="confirm-btn secondary" onClick={() => setShowApiModal(false)}>取消</button>
              <button className="confirm-btn primary" onClick={handleSaveApi}>保存</button>
            </div>
          </div>
        </div>
      )}

      <ToastContainer />
    </>
  );
}
