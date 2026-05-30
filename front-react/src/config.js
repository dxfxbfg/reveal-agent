const isDev = import.meta.env.DEV;

export const API_BASE = isDev ? '' : `http://${window.location.hostname}:3001`;
const wsProto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
export const WS_URL = isDev
  ? `${wsProto}//${window.location.host}/ws`
  : `${wsProto}//${window.location.hostname}:3001/ws`;

export function genId() {
  return Math.random().toString(36).slice(2, 10);
}

export function createTask(title = '新任务') {
  return {
    id: genId(),
    title,
    messages: [],
    generatedFiles: [],
    activeFileId: null,
    generation: {
      isGenerating: false,
      step: null,
      stepLabel: null,
      startTime: null,
      abortController: null,
      lastSendPayload: null,
      toolLogs: [],
      feedbackLogs: [],
      knowledgeLogs: [],
    },
    droppedFiles: [],
    referenceFiles: [],
    model: 'normal',
    qualityTier: 'normal',
    pageCount: 10,
    autoPageCount: false,
  };
}

/* --------------- localStorage persistence --------------- */

const STORAGE_KEY = 'ra_state_v3';
const STORAGE_VERSION = 3;

// 版本迁移
function migrateState(data) {
  if (!data || typeof data !== 'object') return null;
  const version = data._v || 0;
  
  // v0 → v1: 首次版本化
  // v1 → v2: 已有 STORAGE_KEY = 'ra_state_v2'
  // v2 → v3: 流水线从 6 agent 改为 3 agent
  
  if (version < STORAGE_VERSION) {
    console.log(`[state] migrating from v${version} to v${STORAGE_VERSION}`);
    // 清理旧 key
    try { localStorage.removeItem('ra_state_v2'); } catch {}
    try { localStorage.removeItem('ra_state'); } catch {}
  }
  
  data._v = STORAGE_VERSION;
  return data;
}

function compressHtml(html) {
  if (!html) return '';
  return html
    .replace(/\n\s*/g, ' ')
    .replace(/  +/g, ' ')
    .replace(/>\s+</g, '><')
    .trim();
}

function expandHtml(html) {
  if (!html) return '';
  return html;
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return getDefaultState();
    let data = JSON.parse(raw);
    data = migrateState(data) || data;
    const tasks = (data.tasks || []).map(t => ({
      ...createTask(t.title || '新任务'),
      ...t,
      generation: {
        isGenerating: false,
        step: null,
        stepLabel: null,
        startTime: null,
        abortController: null,
        lastSendPayload: t.generation?.lastSendPayload || null,
        toolLogs: t.generation?.toolLogs || [],
        feedbackLogs: t.generation?.feedbackLogs || [],
        knowledgeLogs: t.generation?.knowledgeLogs || [],
      },
      messages: t.messages || [],
      generatedFiles: (t.generatedFiles || []).map(f => ({
        ...f,
        versions: (f.versions || []).map(v => ({
          ...v,
          html: expandHtml(v.html || ''),
        })),
      })),
      activeFileId: t.activeFileId || null,
      droppedFiles: t.droppedFiles || [],
      referenceFiles: t.referenceFiles || [],
      model: t.model || 'normal',
      qualityTier: t.qualityTier || 'normal',
      pageCount: t.pageCount || 10,
      autoPageCount: t.autoPageCount || false,
    }));

    let activeTaskId = data.activeTaskId || null;
    if (tasks.length === 0) {
      const nt = createTask();
      tasks.push(nt);
      activeTaskId = nt.id;
    } else if (!activeTaskId || !tasks.find(t => t.id === activeTaskId)) {
      activeTaskId = tasks[0].id;
    }

    return {
      tasks,
      activeTaskId,
      model: data.model || 'normal',
      qualityTier: data.qualityTier || 'normal',
      customApis: data.customApis || [],
    };
  } catch (e) {
    console.warn('[state] load failed, using defaults:', e.message);
    return getDefaultState();
  }
}

function getDefaultState() {
  const t = createTask();
  return { tasks: [t], activeTaskId: t.id, model: 'normal', qualityTier: 'normal', customApis: [] };
}

function saveState(state) {
  try {
    const toSave = {
      _v: STORAGE_VERSION,
      tasks: state.tasks.map(t => ({
        ...t,
        generation: {
          ...t.generation,
          abortController: null,
        },
        generatedFiles: t.generatedFiles.map(f => ({
          ...f,
          versions: f.versions.map(v => ({
            ...v,
            html: compressHtml(v.html || ''),
          })),
        })),
      })),
      activeTaskId: state.activeTaskId,
      model: state.model,
      qualityTier: state.qualityTier,
      customApis: state.customApis || [],
    };
    const json = JSON.stringify(toSave);
    if (json.length > 4 * 1024 * 1024) {
      console.warn('[state] storage too large, trimming oldest tasks');
      while (toSave.tasks.length > 1 && JSON.stringify(toSave).length > 4 * 1024 * 1024) {
        toSave.tasks.shift();
        if (toSave.activeTaskId === toSave.tasks[0]?.id) {
        }
      }
    }
    localStorage.setItem(STORAGE_KEY, json);
  } catch (e) {
    console.error('[state] save failed:', e.message);
    try {
      const minimal = {
        tasks: state.tasks.map(t => ({ ...t, generatedFiles: t.generatedFiles.map(f => ({ ...f, versions: [] })) })),
        activeTaskId: state.activeTaskId,
        model: state.model,
        qualityTier: state.qualityTier,
        customApis: state.customApis || [],
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(minimal));
    } catch (e2) {
      console.error('[state] emergency save failed:', e2.message);
    }
  }
}

/* --------------- reducer --------------- */

export const initialState = loadState();

export function reducer(state, action) {
  let newState = state;

  switch (action.type) {

    /* ---- task management ---- */
    case 'ADD_TASK': {
      const t = createTask(action.title || '新任务');
      const tasks = [...state.tasks, t];
      newState = { ...state, tasks, activeTaskId: t.id };
      break;
    }
    case 'DELETE_TASK': {
      if (state.tasks.length <= 1) return state;
      const tasks = state.tasks.filter(t => t.id !== action.id);
      const activeTaskId = state.activeTaskId === action.id ? tasks[0]?.id || null : state.activeTaskId;
      newState = { ...state, tasks, activeTaskId };
      break;
    }
    case 'SET_ACTIVE_TASK': {
      newState = { ...state, activeTaskId: action.id };
      break;
    }
    case 'SET_TASK_TITLE': {
      const tasks = state.tasks.map(t => t.id === action.id ? { ...t, title: action.title } : t);
      newState = { ...state, tasks };
      break;
    }

    /* ---- messages ---- */
    case 'ADD_MESSAGE': {
      const tasks = state.tasks.map(t =>
        t.id === action.taskId ? { ...t, messages: [...t.messages, { role: action.role, content: action.content, ts: Date.now() }] } : t
      );
      newState = { ...state, tasks };
      break;
    }

    /* ---- generation ---- */
    case 'START_GENERATION': {
      const tasks = state.tasks.map(t =>
        t.id === action.taskId ? {
          ...t,
          generation: {
            ...t.generation,
            isGenerating: true,
            step: null,
            stepLabel: null,
            startTime: Date.now(),
            abortController: action.controller,
            lastSendPayload: action.payload,
            toolLogs: [],
            feedbackLogs: [],
            knowledgeLogs: [],
          },
        } : t
      );
      newState = { ...state, tasks };
      break;
    }
    case 'UPDATE_STEP': {
      const tasks = state.tasks.map(t =>
        t.id === action.taskId && t.generation.isGenerating
          ? { ...t, generation: { ...t.generation, step: action.step, stepLabel: action.label } }
          : t
      );
      return { ...state, tasks };
    }
    case 'ADD_TOOL_LOG': {
      const tasks = state.tasks.map(t =>
        t.id === action.taskId && t.generation.isGenerating
          ? { ...t, generation: { ...t.generation, toolLogs: [...t.generation.toolLogs, { name: action.name, args: action.args, result: action.result, time: Date.now() }] } }
          : t
      );
      return { ...state, tasks };
    }
    case 'ADD_FEEDBACK_LOG': {
      const tasks = state.tasks.map(t =>
        t.id === action.taskId && t.generation.isGenerating
          ? { ...t, generation: { ...t.generation, feedbackLogs: [...t.generation.feedbackLogs, { round: action.round, score: action.score, feedback: action.feedback, time: Date.now() }] } }
          : t
      );
      return { ...state, tasks };
    }
    case 'ADD_KNOWLEDGE_LOG': {
      const tasks = state.tasks.map(t =>
        t.id === action.taskId && t.generation.isGenerating
          ? { ...t, generation: { ...t.generation, knowledgeLogs: [...t.generation.knowledgeLogs, { status: action.status, topic: action.topic, time: Date.now() }] } }
          : t
      );
      return { ...state, tasks };
    }
    case 'FINISH_GENERATION': {
      const tasks = state.tasks.map(t =>
        t.id === action.taskId ? {
          ...t,
          generation: { ...t.generation, isGenerating: false, step: null, stepLabel: null, startTime: null, abortController: null, lastSendPayload: null },
          messages: [...t.messages, { role: 'agent', content: action.agentMessage || '演示文稿已生成。', ts: Date.now() }],
          generatedFiles: [...t.generatedFiles, {
            id: action.fileId || genId(),
            name: action.fileName || `演示 ${t.generatedFiles.length + 1}`,
            versions: [{ html: action.html, timestamp: Date.now() }],
            currentVersionIdx: 0,
          }],
          activeFileId: action.fileId || null,
        } : t
      );
      newState = { ...state, tasks };
      break;
    }
    case 'FAIL_GENERATION': {
      const tasks = state.tasks.map(t =>
        t.id === action.taskId ? {
          ...t,
          generation: { ...t.generation, isGenerating: false, step: null, stepLabel: null, startTime: null, abortController: null, lastSendPayload: null },
          messages: [...t.messages, { role: 'error', content: action.error, ts: Date.now() }],
        } : t
      );
      newState = { ...state, tasks };
      break;
    }
    case 'STOP_GENERATION': {
      const tasks = state.tasks.map(t =>
        t.id === action.taskId ? { ...t, generation: { ...t.generation, isGenerating: false, abortController: null } } : t
      );
      newState = { ...state, tasks };
      break;
    }
    case 'CLEAR_LAST_PAYLOAD': {
      const tasks = state.tasks.map(t =>
        t.id === action.taskId ? { ...t, generation: { ...t.generation, lastSendPayload: null } } : t
      );
      newState = { ...state, tasks };
      break;
    }

    /* ---- generated files ---- */
    case 'SET_CURRENT_FILE': {
      const tasks = state.tasks.map(t => t.id === action.taskId ? { ...t, activeFileId: action.fileId } : t);
      newState = { ...state, tasks };
      break;
    }
    case 'ADD_FILE_VERSION': {
      const tasks = state.tasks.map(t => {
        if (t.id !== action.taskId) return t;
        const files = t.generatedFiles.map(f => {
          if (f.id !== action.fileId) return f;
          return { ...f, versions: [...f.versions, { html: action.html, timestamp: Date.now() }], currentVersionIdx: f.versions.length };
        });
        return { ...t, generatedFiles: files };
      });
      newState = { ...state, tasks };
      break;
    }
    case 'EDIT_FILE_VERSION': {
      const tasks = state.tasks.map(t => {
        if (t.id !== action.taskId) return t;
        const files = t.generatedFiles.map(f => {
          if (f.id !== action.fileId) return f;
          const versions = f.versions.map((v, i) =>
            i === f.currentVersionIdx ? { ...v, html: action.html, timestamp: Date.now() } : v
          );
          return { ...f, versions };
        });
        return { ...t, generatedFiles: files };
      });
      newState = { ...state, tasks };
      break;
    }
    case 'LOAD_FILE_VERSION': {
      const tasks = state.tasks.map(t => {
        if (t.id !== action.taskId) return t;
        const files = t.generatedFiles.map(f => f.id === action.fileId ? { ...f, currentVersionIdx: action.verIdx } : f);
        return { ...t, generatedFiles: files, activeFileId: action.fileId };
      });
      newState = { ...state, tasks };
      break;
    }
    case 'DELETE_FILE': {
      const tasks = state.tasks.map(t => {
        if (t.id !== action.taskId) return t;
        const files = t.generatedFiles.filter(f => f.id !== action.fileId);
        const activeFileId = t.activeFileId === action.fileId ? files[0]?.id || null : t.activeFileId;
        return { ...t, generatedFiles: files, activeFileId };
      });
      newState = { ...state, tasks };
      break;
    }
    case 'RENAME_FILE': {
      const tasks = state.tasks.map(t => {
        if (t.id !== action.taskId) return t;
        const files = t.generatedFiles.map(f => f.id === action.fileId ? { ...f, name: action.name } : f);
        return { ...t, generatedFiles: files };
      });
      newState = { ...state, tasks };
      break;
    }
    case 'EXPAND_FILE': {
      const tasks = state.tasks.map(t => {
        if (t.id !== action.taskId) return t;
        const files = t.generatedFiles.map(f => f.id === action.fileId ? { ...f, _expanded: action.expanded } : f);
        return { ...t, generatedFiles: files };
      });
      newState = { ...state, tasks };
      break;
    }

    /* ---- dropped files ---- */
    case 'ADD_DROPPED_FILE': {
      const tasks = state.tasks.map(t => t.id === action.taskId ? { ...t, droppedFiles: [...t.droppedFiles, action.file] } : t);
      newState = { ...state, tasks };
      break;
    }
    case 'REMOVE_DROPPED_FILE': {
      const tasks = state.tasks.map(t => t.id === action.taskId ? { ...t, droppedFiles: t.droppedFiles.filter(f => f.name !== action.fileName) } : t);
      newState = { ...state, tasks };
      break;
    }
    case 'SET_DROPPED_PATHS': {
      const tasks = state.tasks.map(t => {
        if (t.id !== action.taskId) return t;
        const updated = t.droppedFiles.map(f => {
          if (action.pathMap[f.name]) {
            return { ...f, path: action.pathMap[f.name] };
          }
          return f;
        });
        return { ...t, droppedFiles: updated };
      });
      newState = { ...state, tasks };
      break;
    }
    case 'CLEAR_DROPPED_FILES': {
      const tasks = state.tasks.map(t => t.id === action.taskId ? { ...t, droppedFiles: [] } : t);
      newState = { ...state, tasks };
      break;
    }

    /* ---- reference files (per-task) ---- */
    case 'ADD_REFERENCE_FILE': {
      const tasks = state.tasks.map(t => t.id === action.taskId ? { ...t, referenceFiles: [...t.referenceFiles, action.file] } : t);
      newState = { ...state, tasks };
      break;
    }
    case 'REMOVE_REFERENCE_FILE': {
      const tasks = state.tasks.map(t => t.id === action.taskId ? { ...t, referenceFiles: t.referenceFiles.filter((_, i) => i !== action.idx) } : t);
      newState = { ...state, tasks };
      break;
    }
    case 'SET_REFERENCE_FILES': {
      const tasks = state.tasks.map(t => t.id === action.taskId ? { ...t, referenceFiles: action.files } : t);
      newState = { ...state, tasks };
      break;
    }

    /* ---- config ---- */
    case 'SET_MODEL': {
      const tasks = state.tasks.map(t => t.id === action.taskId ? { ...t, model: action.model } : t);
      const config = { ...state, model: action.model };
      newState = { ...config, tasks };
      break;
    }
    case 'SET_QUALITY_TIER': {
      const tasks = state.tasks.map(t => t.id === action.taskId ? { ...t, qualityTier: action.tier } : t);
      const config = { ...state, qualityTier: action.tier };
      newState = { ...config, tasks };
      break;
    }
    case 'SET_PAGE_COUNT': {
      const tasks = state.tasks.map(t => t.id === action.taskId ? { ...t, pageCount: action.count } : t);
      newState = { ...state, tasks };
      break;
    }
    case 'SET_AUTO_PAGE_COUNT': {
      const tasks = state.tasks.map(t => t.id === action.taskId ? { ...t, autoPageCount: action.value } : t);
      newState = { ...state, tasks };
      break;
    }
    case 'ADD_CUSTOM_API': {
      const apis = [...(state.customApis || []), action.api];
      const config = { ...state, customApis: apis };
      newState = { ...config };
      break;
    }
    case 'REMOVE_CUSTOM_API': {
      const apis = (state.customApis || []).filter(a => a.name !== action.name);
      const config = { ...state, customApis: apis };
      newState = { ...config };
      break;
    }

    default:
      return state;
  }

  saveState(newState);
  return newState;
}

/* --------------- helpers --------------- */

export function formatSize(bytes) {
  if (!bytes) return '';
  if (bytes < 1024) return bytes + 'B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + 'K';
  return (bytes / 1048576).toFixed(1) + 'M';
}

export function formatTime(ts) {
  return new Date(ts).toLocaleString('zh-CN', {
    month: 'numeric', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export function countPages(html) {
  if (!html) return 0;
  return (html.match(/<section/g) || []).length;
}

export function getCustomApiForModel(modelValue, customApis = []) {
  if (!modelValue?.startsWith('custom-')) return null;
  const name = modelValue.replace('custom-', '');
  return customApis.find(a => a.name === name) || null;
}
