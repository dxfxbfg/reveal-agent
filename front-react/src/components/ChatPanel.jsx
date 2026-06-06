import React, { useRef, useEffect, useState, useCallback } from 'react';
import ChatMessages from './ChatMessages.jsx';
import ToolLogPanel from './ToolLogPanel.jsx';

// 输入草稿按 taskId 存到 localStorage — 切走/刷新页面后回到当前 task 仍能看到未发送的文字
// 发送后或丢弃任务时由调用方 saveDraft(task.id, '') 移除 key
const draftKey = (taskId) => `ra_chat_draft_${taskId}`;
const loadDraft = (taskId) => {
  try { return localStorage.getItem(draftKey(taskId)) || ''; } catch { return ''; }
};
const saveDraft = (taskId, text) => {
  try {
    if (text) localStorage.setItem(draftKey(taskId), text);
    else localStorage.removeItem(draftKey(taskId));
  } catch {}
};

export default function ChatPanel({
  task, onSend, onStop, onContinue, onDiscard,
  qualityTier, pageCount, enableFeedback, autoPageCount,
  onQualityChange, onPageCountChange, onAutoPageCountChange, onEnableFeedbackChange,
  onUploadFiles, onRemoveDropped, onAddDropped,
}) {
  const scrollRef = useRef(null);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const [inputText, setInputTextRaw] = useState(() => loadDraft(task.id));
  const [dragOver, setDragOver] = useState(false);

  // 节流写入 localStorage：keystroke 高频触发的 setInputText 不每次都写盘
  // pendingDraftRef 保存"待写"的值；rAF 合并到一次写
  // 注意：必须在 useEffect 之前声明 useRef（避免 TDZ 风险 + 阅读顺序合理）
  const pendingDraftRef = useRef(null);
  const draftRafRef = useRef(null);

  const setInputText = useCallback((next) => {
    setInputTextRaw(typeof next === 'function' ? next : next);
    const value = typeof next === 'function' ? null : next;  // 函数式 setState 时读不到 prev，留空走下一次 keystroke
    pendingDraftRef.current = value;
    if (draftRafRef.current != null) return;  // 已有调度中的 rAF，跳过
    draftRafRef.current = requestAnimationFrame(() => {
      draftRafRef.current = null;
      if (pendingDraftRef.current != null) {
        saveDraft(task.id, pendingDraftRef.current);
        pendingDraftRef.current = null;
      }
    });
  }, [task.id]);

  // task 切换时（比如从 task A 切到 task B）重新读 B 的草稿
  // 否则 React 不会重新调 useState 初始化函数（仅 mount 时跑一次）
  useEffect(() => {
    setInputTextRaw(loadDraft(task.id));
    pendingDraftRef.current = null;
    if (draftRafRef.current != null) {
      cancelAnimationFrame(draftRafRef.current);
      draftRafRef.current = null;
    }
    // 把 textarea 高度重置
    requestAnimationFrame(() => {
      const ta = textareaRef.current;
      if (ta) { ta.style.height = 'auto'; }
    });
  }, [task.id]);

  // 卸载时把"还没写盘的 pending 值"flush 一次（避免 task 切换瞬间丢字）
  useEffect(() => () => {
    if (draftRafRef.current != null) {
      cancelAnimationFrame(draftRafRef.current);
      draftRafRef.current = null;
      if (pendingDraftRef.current != null) {
        saveDraft(task.id, pendingDraftRef.current);
        pendingDraftRef.current = null;
      }
    }
  }, [task.id]);

  const showEmpty = task.messages.length === 0;
  const isGenerating = task.generation.isGenerating;
  const isStopped = !!task.generation.lastSendPayload && !isGenerating;

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [task.messages.length, task.generation.toolLogs?.length, task.generation.step]);

  const handleSend = () => {
    if (!inputText.trim() || isGenerating) return;
    onSend(inputText);
    setInputTextRaw('');
    saveDraft(task.id, '');  // 显式清草稿
    pendingDraftRef.current = null;
    requestAnimationFrame(() => {
      if (textareaRef.current) textareaRef.current.style.height = 'auto';
    });
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); handleSend(); }
  };

  // 大段粘贴：paste 事件里直接读 clipboardData 一次性 setInputText
  // 避免浏览器把 paste 拆成几十次 input 事件逐字 setState
  const handlePaste = (e) => {
    const text = e.clipboardData?.getData('text');
    if (text == null) return;  // 让浏览器走默认行为
    e.preventDefault();
    const next = inputText + text;
    setInputTextRaw(next);
    saveDraft(task.id, next);  // 粘贴内容立即落盘（不走 rAF）
    pendingDraftRef.current = null;
    // 下一帧把 textarea 高度撑起来
    requestAnimationFrame(() => {
      const ta = textareaRef.current;
      if (ta) { ta.style.height = 'auto'; ta.style.height = Math.min(ta.scrollHeight, 180) + 'px'; }
    });
  };

  useEffect(() => {
    const ta = textareaRef.current;
    if (ta) { ta.style.height = 'auto'; ta.style.height = Math.min(ta.scrollHeight, 180) + 'px'; }
  }, [inputText]);

  const inputRef = useRef(inputText);
  const generatingRef = useRef(isGenerating);
  const sendRef = useRef(handleSend);
  inputRef.current = inputText;
  generatingRef.current = isGenerating;
  sendRef.current = handleSend;

  useEffect(() => {
    const handleGlobalKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && !generatingRef.current && inputRef.current.trim()) {
        e.preventDefault();
        sendRef.current();
      }
    };
    window.addEventListener('keydown', handleGlobalKey);
    return () => window.removeEventListener('keydown', handleGlobalKey);
  }, []);

  const handleDragOver = (e) => { e.preventDefault(); setDragOver(true); };
  const handleDragLeave = () => setDragOver(false);
  const handleDrop = async (e) => {
    e.preventDefault(); setDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    if (!files.length) return;
    // 同时加入参考文件列表和输入框可见 chips
    Array.from(files).forEach(f => onAddDropped({ name: f.name, size: f.size, path: null }));
    onUploadFiles(files);
  };

  const handleUploadClick = () => fileInputRef.current?.click();
  const handleFileInputChange = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    Array.from(files).forEach(f => onAddDropped({ name: f.name, size: f.size, path: null }));
    onUploadFiles(files);
    e.target.value = '';
  };

  return (
    <div id="chat-panel" onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}>
      {dragOver && <div className="drag-overlay"><div className="drag-hint">释放文件以上传参考材料</div></div>}

      <div id="chat-header">
        <span id="chat-task-title">{task.title}</span>
      </div>

      <div id="messages-area" ref={scrollRef}>
        <div id="empty-state" className={`empty-state ${showEmpty ? '' : 'hidden'}`}>
          <div className="empty-state-content">
            <div className="empty-state-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
              </svg>
            </div>
            <p>输入需求，开始生成演示文稿</p>
            <p className="hint">例如：帮我做一个关于AI发展的演示</p>
            <p className="hint" style={{ marginTop: 4 }}>可拖拽文件或点击下方 📎 按钮上传参考材料</p>
          </div>
        </div>
        <ChatMessages messages={task.messages} />
        {isStopped && (
          <div className="msg agent" style={{ animation: 'fadeInUp 0.3s ease-out' }}>
            生成已暂停。点击下方按钮继续或放弃。
          </div>
        )}
      </div>

      <ToolLogPanel taskId={task.id} toolLogs={task.generation.toolLogs}
        feedbackLogs={task.generation.feedbackLogs} knowledgeLogs={task.generation.knowledgeLogs} />

      <div id="input-area-wrapper">
        {/* 已拖入/上传的文件 chips — 在输入框上方可见 */}
        <div id="dropped-files-row">
          {task.droppedFiles?.map((f, i) => (
            <div key={i} className="dropped-chip">
              <span className="chip-icon">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
                </svg>
              </span>
              <span className="chip-name" title={f.name}>{f.name}</span>
              <button className="chip-remove" onClick={() => onRemoveDropped(f.name)} title="移除">×</button>
            </div>
          ))}
        </div>

        <div id="input-row">
          <button id="attach-btn" title="上传参考文件" onClick={handleUploadClick} disabled={isGenerating}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
            </svg>
          </button>
          <input ref={fileInputRef} type="file" multiple style={{ display: 'none' }} onChange={handleFileInputChange} />
          <textarea ref={textareaRef} id="chat-input" rows="1"
            value={inputText} onChange={e => setInputText(e.target.value)} onKeyDown={handleKey}
            onPaste={handlePaste}
            placeholder="描述需求... (Enter 发送, 📎 上传文件)" disabled={isGenerating} />
          <button id="send-btn" title="发送 (Enter)" onClick={handleSend} disabled={isGenerating || !inputText.trim()}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </button>
        </div>

        <div id="config-row">
          <div className="config-group">
            <label className="config-label">质量</label>
            <select className="config-select" value={qualityTier} onChange={e => onQualityChange(e.target.value)} disabled={isGenerating}>
              <option value="fast">快速</option>
              <option value="normal">标准</option>
            </select>
          </div>
          <div className="config-group">
            <label className="config-label">页数</label>
            <select className="config-select config-pages" value={autoPageCount ? 'auto' : pageCount} onChange={e => {
              if (e.target.value === 'auto') onAutoPageCountChange(true);
              else { onAutoPageCountChange(false); onPageCountChange(Number(e.target.value)); }
            }} disabled={isGenerating}>
              {[5, 8, 10, 12, 15, 20, 25, 30].map(n => (<option key={n} value={n}>{n}页</option>))}
              <option value="auto">自适应</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
