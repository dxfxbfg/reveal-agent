import React, { useState, useCallback, useEffect, useRef } from 'react';

/* ═══════════════════════════════════════════════════════════════
   数据模型（深层版）
═══════════════════════════════════════════════════════════════ */

function createRuntimeInfo(name, version, extra = {}) {
  return {
    name, version,
    uptime: '2h 34m',
    memory: '1.2GB',
    cpu: Math.floor(Math.random() * 30 + 10) + '%',
    threads: Math.floor(Math.random() * 4 + 1),
    ...extra,
  };
}

function makeLogEntry(level, msg) {
  return { ts: Date.now(), level, msg: `[${name}] ${msg}` };
}

const runtimeInitialLogs = {
  openclaw: [
    { ts: Date.now() - 5000, level: 'info', msg: 'Gateway started on :8080' },
    { ts: Date.now() - 3200, level: 'info', msg: 'Lane queue initialized (capacity=10)' },
    { ts: Date.now() - 1800, level: 'warn', msg: 'High memory usage: 1.2GB' },
    { ts: Date.now() - 400, level: 'info', msg: 'New connection from 127.0.0.1' },
  ],
  hermes: [
    { ts: Date.now() - 6000, level: 'info', msg: 'Agent loop started' },
    { ts: Date.now() - 2500, level: 'info', msg: 'Task queued: slide-generation' },
    { ts: Date.now() - 900, level: 'info', msg: 'Model routed: claude-sonnet (code)' },
  ],
  claude_code: [
    { ts: Date.now() - 30000, level: 'info', msg: 'Claude Code disabled by user' },
  ],
};

function createRuntimes() {
  return {
    openclaw: {
      enabled: true, status: 'running', pid: 72050,
      info: createRuntimeInfo('OpenClaw', '2026.05', { connections: 4, port: 8080 }),
      logs: [...runtimeInitialLogs.openclaw],
    },
    hermes: {
      enabled: true, status: 'running',
      info: createRuntimeInfo('Hermes Agent', '1.4.2', { activeSessions: 3, totalTokens: '2.4M' }),
      logs: [...runtimeInitialLogs.hermes],
    },
    claude_code: {
      enabled: false, status: 'stopped',
      info: createRuntimeInfo('Claude Code', '0.3.1', { activeLoops: 0 }),
      logs: [...runtimeInitialLogs.claude_code],
    },
  };
}

const defaultState = () => ({
  runtimes: createRuntimes(),
  models: [
    { id: 'local-ollama', name: 'Ollama (本地)', type: 'ollama', endpoint: 'http://localhost:11434', apiKey: '', default: false, tags: ['local', 'embedding'], latency: null, testedAt: null },
    { id: 'minimax-m2.7', name: 'MiniMax M2.7', type: 'minimax', endpoint: 'https://api.minimax.chat/v1', apiKey: '', default: true, tags: ['cloud', 'fast'], latency: null, testedAt: null },
    { id: 'claude-sonnet', name: 'Claude Sonnet', type: 'anthropic', endpoint: 'https://api.anthropic.com', apiKey: '', default: false, tags: ['cloud', 'reasoning'], latency: null, testedAt: null },
    { id: 'gpt-4o', name: 'GPT-4o', type: 'openai', endpoint: 'https://api.openai.com/v1', apiKey: '', default: false, tags: ['cloud'], latency: null, testedAt: null },
  ],
  routingRules: [
    { id: 'r1', name: '代码任务', models: ['claude-sonnet', 'gpt-4o'], keywords: ['代码', 'algorithm', 'cpp', 'python', '算法'], priority: 1, enabled: true },
    { id: 'r2', name: '快速生成', models: ['minimax-m2.7', 'local-ollama'], keywords: ['生成', 'write', 'create', 'PPT', '幻灯片'], priority: 2, enabled: true },
    { id: 'r3', name: '长文本推理', models: ['claude-sonnet'], keywords: ['分析', '推理', 'explain', 'analyze'], priority: 3, enabled: false },
  ],
  mcps: [
    {
      id: 'mcp-github', name: 'GitHub', enabled: true, status: 'connected', config: { token: '' },
      tools: [
        { id: 't1', name: 'repo', label: '仓库', enabled: true },
        { id: 't2', name: 'issue', label: 'Issue', enabled: true },
        { id: 't3', name: 'pr', label: 'PR', enabled: false },
      ],
    },
    {
      id: 'mcp-filesystem', name: '文件系统', enabled: true, status: 'connected', config: {},
      tools: [
        { id: 't4', name: 'read', label: '读取', enabled: true },
        { id: 't5', name: 'write', label: '写入', enabled: true },
        { id: 't6', name: 'search', label: '搜索', enabled: true },
      ],
    },
    {
      id: 'mcp-obsidian', name: 'Obsidian', enabled: false, status: 'disconnected', config: { vaultPath: '/Users/mac/Desktop/知识库' },
      tools: [
        { id: 't7', name: 'read_note', label: '读笔记', enabled: false },
        { id: 't8', name: 'search_vault', label: '搜索', enabled: false },
        { id: 't9', name: 'write_note', label: '写笔记', enabled: false },
      ],
    },
    {
      id: 'mcp-web', name: 'Web Search', enabled: true, status: 'connected', config: {},
      tools: [
        { id: 't10', name: 'search', label: '搜索', enabled: true },
        { id: 't11', name: 'crawl', label: '爬取', enabled: true },
        { id: 't12', name: 'extract', label: '提取', enabled: false },
      ],
    },
  ],
  skills: {
    static: [
      { id: 's1', name: 'code-tutor', description: 'C++/算法题解答', source: 'agentskills.io', loaded: true, usages: 47 },
      { id: 's2', name: 'brainstorming', description: '头脑风暴', source: 'ClawHub', loaded: true, usages: 12 },
      { id: 's3', name: 'image-gen', description: '图片生成', source: 'community', loaded: true, usages: 8 },
      { id: 's4', name: 'pptx-ready', description: 'PPT 生成', source: 'ClawHub', loaded: false, usages: 3 },
    ],
    dynamic: [
      { id: 'd1', name: 'reveal-agent-pipeline', description: 'PPT 生成流水线', generatedAt: '2026-05-29', loaded: true, usages: 5 },
      { id: 'd2', name: 'llm-wiki-query', description: '知识库检索', generatedAt: '2026-05-28', loaded: false, usages: 2 },
      { id: 'd3', name: 'kanban-worker', description: 'Hermes Kanban 任务执行', generatedAt: '2026-05-30', loaded: true, usages: 1 },
    ],
  },
  memory: {
    shortTerm: { enabled: true, backend: 'memory', ttl: 3600, maxSessions: 10 },
    longTerm: { enabled: true, backend: 'sqlite-fts5', path: '~/.hermes/memory.db', dim: 384 },
    graph: [
      { id: 'n1', label: 'C++ Primer', type: 'concept', connections: ['n2', 'n3'] },
      { id: 'n2', label: 'STL 容器', type: 'concept', connections: ['n1', 'n4'] },
      { id: 'n3', label: '算法设计', type: 'task', connections: ['n1', 'n5'] },
      { id: 'n4', label: '动态规划', type: 'concept', connections: ['n2', 'n5'] },
      { id: 'n5', label: 'LeetCode 刷题', type: 'project', connections: ['n3', 'n4'] },
      { id: 'n6', label: 'CCF 认证', type: 'project', connections: ['n5'] },
      { id: 'n7', label: 'Hermes Agent', type: 'system', connections: ['n8'] },
      { id: 'n8', label: 'reveal-agent', type: 'system', connections: ['n7', 'n9'] },
      { id: 'n9', label: 'PPT 生成', type: 'task', connections: ['n8'] },
    ],
  },
  api: {
    gateway: { enabled: true, port: 8080, rateLimit: 100, retry: 3 },
    keys: [
      { id: 'k1', name: 'default', key: 'sk-****...f3a2', scopes: ['all'], created: '2026-05-01' },
      { id: 'k2', name: 'reveal-agent', key: 'sk-****...7d91', scopes: ['generate', 'upload'], created: '2026-05-28' },
    ],
    costTracking: { enabled: true, budget: 100, spent: 23.5 },
    stats: { totalCalls: 847, successRate: 98.2, avgLatency: 1.2 },
  },
});

/* ═══════════════════════════════════════════════════════════════
   WebSocket 实时流（用于运行时日志）
═══════════════════════════════════════════════════════════════ */

function useRuntimeStream(runtimes, onLogEntry) {
  const streamsRef = useRef({});

  useEffect(() => {
    Object.keys(runtimes).forEach(key => {
      const rt = runtimes[key];
      if (rt.status !== 'running') return;

      // 模拟实时日志：每 2-4 秒推送一条
      const interval = setInterval(() => {
        const levels = ['info', 'info', 'info', 'warn', 'debug'];
        const logTemplates = {
          openclaw: [
            'Heartbeat check passed',
            'Lane queue depth: ' + Math.floor(Math.random() * 8 + 1),
            'Connection pool: ' + Math.floor(Math.random() * 5 + 1) + ' active',
            'Memory pressure: ' + (Math.random() * 0.5 + 1.0).toFixed(2) + 'GB',
            'New WS connection from 127.0.0.1:' + (Math.random() * 50000 + 10000 | 0),
          ],
          hermes: [
            'Agent loop tick',
            'Token usage: ' + (Math.random() * 10000 + 1000 | 0) + ' this minute',
            'Model inference: ' + (Math.random() * 500 + 100 | 0) + 'ms',
            'Active session count: ' + (Math.random() * 3 + 2 | 0),
            'Skill loaded: ' + ['code-tutor', 'brainstorming', 'image-gen'][Math.random() * 3 | 0],
          ],
          claude_code: [
            'Tool call: ' + ['read_file', 'terminal', 'search'][Math.random() * 3 | 0],
            'Loop iteration: ' + (Math.random() * 10 + 1 | 0),
            'Context window: ' + (Math.random() * 30 + 60 | 0) + '%',
          ],
        };
        const templates = logTemplates[key] || logTemplates.openclaw;
        const entry = {
          ts: Date.now(),
          level: levels[Math.random() * 4 | 0],
          msg: templates[Math.random() * templates.length | 0],
        };
        onLogEntry(key, entry);
      }, Math.random() * 2000 + 2000);

      streamsRef.current[key] = interval;
    });

    return () => {
      Object.values(streamsRef.current).forEach(clearInterval);
      streamsRef.current = {};
    };
  }, [runtimes]);

  // 动态响应 runtimes 变化（开关切换时启停）
  useEffect(() => {
    Object.keys(runtimes).forEach(key => {
      const rt = runtimes[key];
      if (rt.status !== 'running' && streamsRef.current[key]) {
        clearInterval(streamsRef.current[key]);
        delete streamsRef.current[key];
      }
    });
  }, [runtimes]);
}

/* ═══════════════════════════════════════════════════════════════
   通用 UI 组件
═══════════════════════════════════════════════════════════════ */

function Toggle({ value, onChange }) {
  return (
    <button className={`toggle-btn ${value ? 'on' : 'off'}`} onClick={() => onChange(!value)} aria-pressed={value}>
      <span className="toggle-knob" />
    </button>
  );
}

function StatusBadge({ status }) {
  const map = { running: { label: '运行中', cls: 'success' }, stopped: { label: '已停止', cls: 'error' }, connected: { label: '已连接', cls: 'success' }, disconnected: { label: '已断开', cls: 'error' }, warning: { label: '警告', cls: 'warning' } };
  const { label, cls } = map[status] || { label: status, cls: 'default' };
  return <span className={`status-badge ${cls}`}>{label}</span>;
}

function LayerTabs({ tabs, active, onChange }) {
  return (
    <div className="layer-tabs">
      {tabs.map(t => (
        <button key={t.id} className={`layer-tab ${active === t.id ? 'active' : ''}`} onClick={() => onChange(t.id)}>
          {t.label}{t.count !== undefined && <span className="tab-count">{t.count}</span>}
        </button>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   运行时层 — 深：实时日志流 + 指标监控
═══════════════════════════════════════════════════════════════ */

const RUNTIME_META = {
  openclaw: { icon: '⚡', label: 'OpenClaw', sub: 'Gateway / Lane Queue', color: '#0071e3' },
  hermes: { icon: '🧠', label: 'Hermes Agent', sub: 'AI Agent 循环逻辑', color: '#34c759' },
  claude_code: { icon: '🔄', label: 'Claude Code', sub: 'while(tool_call) 循环', color: '#af52de' },
};

function MetricBar({ label, value, max = 100, color }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div className="metric-bar-row">
      <span className="metric-bar-label">{label}</span>
      <div className="metric-bar-track">
        <div className="metric-bar-fill" style={{ width: pct + '%', background: color }} />
      </div>
      <span className="metric-bar-value">{value}</span>
    </div>
  );
}

function RuntimeLayer({ runtimes, onUpdate }) {
  const [expandedRt, setExpandedRt] = useState(null);
  const logRefs = useRef({});

  // 实时日志流订阅
  useRuntimeStream(runtimes, (key, entry) => {
    onUpdate(key, { logs: [...(runtimes[key]?.logs || []).slice(-49), entry] });
  });

  const scrollToBottom = (key) => {
    const el = logRefs.current[key];
    if (el) setTimeout(() => { el.scrollTop = el.scrollHeight; }, 50);
  };

  return (
    <div className="runtime-layer">
      <div className="runtime-grid">
        {Object.entries(RUNTIME_META).map(([key, meta]) => {
          const rt = runtimes[key];
          if (!rt) return null;
          return (
            <div key={key} className={`runtime-card ${rt.status === 'running' ? 'active' : 'inactive'}`}
              style={{ '--rt-color': meta.color }}>
              <div className="runtime-card-header">
                <span className="runtime-icon" style={{ color: meta.color }}>{meta.icon}</span>
                <div className="runtime-info">
                  <div className="runtime-name">{meta.label}</div>
                  <div className="runtime-sub">{meta.sub}</div>
                </div>
                <Toggle value={rt.enabled} onChange={(v) => onUpdate(key, { enabled: v })} />
              </div>

              {/* 指标条 */}
              {rt.status === 'running' && (
                <div className="runtime-metrics">
                  {key === 'openclaw' && <>
                    <MetricBar label="内存" value={rt.info?.memory || '1.2GB'} max={2} color={meta.color} />
                    <MetricBar label="连接" value={rt.info?.connections || 4} max={20} color={meta.color} />
                    <MetricBar label="CPU" value={rt.info?.cpu || '15%'} max={100} color={meta.color} />
                  </>}
                  {key === 'hermes' && <>
                    <MetricBar label="会话" value={rt.info?.activeSessions || 3} max={10} color={meta.color} />
                    <MetricBar label="Token" value={rt.info?.totalTokens || '2.4M'} max={5} color={meta.color} />
                  </>}
                  {key === 'claude_code' && <>
                    <MetricBar label="活跃循环" value={rt.info?.activeLoops || 0} max={10} color={meta.color} />
                    <MetricBar label="PID" value={rt.pid || 0} max={99999} color={meta.color} />
                  </>}
                </div>
              )}

              {/* 基本信息行 */}
              <div className="runtime-info-row">
                <span className="runtime-info-item">
                  <span className="runtime-info-key">PID</span>
                  <span className="runtime-info-val">{rt.pid}</span>
                </span>
                <span className="runtime-info-item">
                  <span className="runtime-info-key">v</span>
                  <span className="runtime-info-val">{rt.info?.version}</span>
                </span>
                <span className="runtime-info-item">
                  <span className="runtime-info-key">uptime</span>
                  <span className="runtime-info-val">{rt.info?.uptime}</span>
                </span>
              </div>

              <div className="runtime-footer">
                <StatusBadge status={rt.status} />
                <button className="log-toggle-btn" onClick={() => {
                  const next = expandedRt === key ? null : key;
                  setExpandedRt(next);
                  if (next) scrollToBottom(key);
                }}>
                  {expandedRt === key ? '收起日志' : `日志 (${rt.logs?.length || 0})`}
                </button>
              </div>

              {/* 实时日志面板 */}
              {expandedRt === key && (
                <div className="runtime-log" ref={el => logRefs.current[key] = el}>
                  <div className="log-header">
                    <span className="log-title">实时日志</span>
                    <span className="log-stream-indicator">● LIVE</span>
                  </div>
                  {(rt.logs || []).map((entry, i) => (
                    <div key={i} className={`log-entry ${entry.level}`}>
                      <span className="log-ts">{new Date(entry.ts).toLocaleTimeString('zh-CN', { hour12: false })}</span>
                      <span className={`log-level ${entry.level}`}>[{entry.level.toUpperCase()}]</span>
                      <span className="log-msg">{entry.msg}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   模型配置层
═══════════════════════════════════════════════════════════════ */

function ModelLayer({ models, routingRules, onUpdate }) {
  const [tab, setTab] = useState('registry');
  const [testingId, setTestingId] = useState(null);
  const [editingModel, setEditingModel] = useState(null);
  const [showAddModel, setShowAddModel] = useState(false);
  const [newModel, setNewModel] = useState({ name: '', type: 'openai', endpoint: '', apiKey: '', tags: '' });

  const testLatency = (model) => {
    setTestingId(model.id);
    setTimeout(() => {
      const lat = (Math.random() * 300 + 50).toFixed(0);
      onUpdate('models', models.map(m => m.id === model.id ? { ...m, latency: lat + 'ms', testedAt: new Date().toLocaleString() } : m));
      setTestingId(null);
    }, 1200);
  };

  const saveModel = (m) => {
    if (editingModel) {
      onUpdate('models', models.map(x => x.id === editingModel.id ? { ...x, ...m } : x));
      setEditingModel(null);
    } else {
      onUpdate('models', [...models, { ...m, id: `m-${Date.now()}`, latency: null, testedAt: null }]);
      setShowAddModel(false);
      setNewModel({ name: '', type: 'openai', endpoint: '', apiKey: '', tags: '' });
    }
  };

  return (
    <div className="model-layer">
      <LayerTabs
        tabs={[
          { id: 'registry', label: '模型注册表', count: models.length },
          { id: 'routing', label: '路由规则', count: routingRules.length },
        ]}
        active={tab}
        onChange={setTab}
      />

      {tab === 'registry' && (
        <div className="model-list">
          {models.map(m => (
            <div key={m.id} className="model-row">
              <div className="model-info">
                <div className="model-row-top">
                  <span className="model-name">{m.name}</span>
                  <span className="model-type-tag">{m.type}</span>
                  {m.default && <span className="default-badge">默认</span>}
                </div>
                <div className="model-meta-row">
                  <span className="model-endpoint">{m.endpoint}</span>
                  <div className="model-tags">{m.tags?.map(t => <span key={t} className="model-tag">{t}</span>)}</div>
                </div>
                {m.latency && (
                  <div className="model-latency">
                    <span className="latency-value">⏱ {m.latency}</span>
                    <span className="latency-date">测试于 {m.testedAt}</span>
                  </div>
                )}
              </div>
              <div className="model-actions">
                <button className={`ctrl-btn test-btn ${testingId === m.id ? 'testing' : ''}`} onClick={() => testLatency(m)} disabled={testingId === m.id}>
                  {testingId === m.id ? '测试中...' : '测速'}
                </button>
                <button className="ctrl-btn" onClick={() => setEditingModel(m)}>编辑</button>
                <button className="ctrl-btn danger" onClick={() => onUpdate('models', models.filter(x => x.id !== m.id))}>删除</button>
              </div>
            </div>
          ))}
          <button className="add-btn" onClick={() => setShowAddModel(true)}>+ 添加模型</button>
        </div>
      )}

      {tab === 'routing' && (
        <div className="routing-list">
          {routingRules.map(r => (
            <div key={r.id} className={`routing-row ${!r.enabled ? 'disabled' : ''}`}>
              <div className="routing-top">
                <div className="routing-name">{r.name}</div>
                <Toggle value={r.enabled} onChange={(v) => onUpdate('routingRules', routingRules.map(x => x.id === r.id ? { ...x, enabled: v } : x))} />
              </div>
              <div className="routing-meta">优先级 {r.priority} · {r.models.join(', ')}</div>
              <div className="routing-keywords">{r.keywords.map(k => <span key={k} className="keyword-tag">{k}</span>)}</div>
            </div>
          ))}
        </div>
      )}

      {(showAddModel || editingModel) && (
        <div className="modal-overlay" onClick={() => { setShowAddModel(false); setEditingModel(null); }}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span>{editingModel ? '编辑模型' : '添加模型'}</span>
              <button className="modal-close" onClick={() => { setShowAddModel(false); setEditingModel(null); }}>×</button>
            </div>
            <div className="modal-body">
              {['name', 'type', 'endpoint', 'apiKey', 'tags'].map(field => (
                <div key={field} className="form-group">
                  <label>{field === 'apiKey' ? 'API Key' : field === 'tags' ? '标签 (逗号分隔)' : field}</label>
                  <input className="form-input" type={field === 'apiKey' ? 'password' : 'text'}
                    placeholder={field === 'endpoint' ? 'https://api.example.com/v1' : ''}
                    value={editingModel ? (editingModel[field] || '') : newModel[field]}
                    onChange={e => editingModel ? setEditingModel({ ...editingModel, [field]: e.target.value }) : setNewModel({ ...newModel, [field]: e.target.value })} />
                </div>
              ))}
            </div>
            <div className="modal-footer">
              <button className="modal-btn cancel" onClick={() => { setShowAddModel(false); setEditingModel(null); }}>取消</button>
              <button className="modal-btn save" onClick={() => saveModel(editingModel || newModel)}>保存</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MCP 层 — 工具级开关（已深）
═══════════════════════════════════════════════════════════════ */

function McpLayer({ mcps, onUpdate }) {
  const [expandedMcp, setExpandedMcp] = useState(null);

  const toggleTool = (mcpId, toolId) => {
    const mcp = mcps.find(x => x.id === mcpId);
    const updatedTools = mcp.tools.map(t => t.id === toolId ? { ...t, enabled: !t.enabled } : t);
    onUpdate('mcps', mcps.map(x => x.id === mcpId ? { ...x, tools: updatedTools } : x));
  };

  const totalTools = mcps.reduce((acc, m) => acc + m.tools.length, 0);
  const enabledTools = mcps.reduce((acc, m) => acc + m.tools.filter(t => t.enabled).length, 0);

  return (
    <div className="mcp-layer">
      <div className="mcp-list">
        {mcps.map(m => (
          <div key={m.id} className="mcp-row">
            <div className="mcp-row-header">
              <div className="mcp-info">
                <div className="mcp-name">{m.name}</div>
                <StatusBadge status={m.status} />
                <span className="mcp-tool-count">{m.tools.filter(t => t.enabled).length}/{m.tools.length} 工具启用</span>
              </div>
              <div className="mcp-row-actions">
                <Toggle value={m.enabled} onChange={(v) => onUpdate('mcps', mcps.map(x => x.id === m.id ? { ...x, enabled: v } : x))} />
                <button className="ctrl-btn" onClick={() => setExpandedMcp(expandedMcp === m.id ? null : m.id)}>
                  {expandedMcp === m.id ? '收起' : `工具 (${m.tools.length})`}
                </button>
              </div>
            </div>

            {/* 工具级开关展开 */}
            {expandedMcp === m.id && (
              <div className="mcp-tools-grid">
                {m.tools.map(t => (
                  <div key={t.id} className={`mcp-tool-item ${t.enabled ? 'enabled' : 'disabled'}`}>
                    <div className="mcp-tool-info">
                      <span className="tool-name">{t.label}</span>
                      <code className="tool-code">{t.name}</code>
                    </div>
                    <Toggle value={t.enabled} onChange={() => toggleTool(m.id, t.id)} />
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="mcp-footer">
        <span>{mcps.length} 个 MCP · {enabledTools}/{totalTools} 工具启用</span>
        <span className="hint">支持 44000+ 社区服务器</span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   技能库层 — 接 ClawdHub（已深）
═══════════════════════════════════════════════════════════════ */

function SkillLayer({ skills, onUpdate }) {
  const [tab, setTab] = useState('static');
  const [hubSearch, setHubSearch] = useState('');
  const [hubResults, setHubResults] = useState([]);
  const [hubLoading, setHubLoading] = useState(false);

  const toggleSkill = (skill, list) => {
    const arr = list === 'static' ? skills.static : skills.dynamic;
    const updated = arr.map(s => s.id === skill.id ? { ...s, loaded: !s.loaded } : s);
    onUpdate('skills', { ...skills, [list]: updated });
  };

  const searchClawdHub = () => {
    if (!hubSearch.trim()) return;
    setHubLoading(true);
    setTimeout(() => {
      setHubResults([
        { name: 'web-scraper', desc: '网页内容抓取技能', source: 'ClawdHub', rating: 4.8, installs: 1203, loaded: false },
        { name: 'data-visualizer', desc: '数据可视化图表生成', source: 'ClawdHub', rating: 4.5, installs: 876, loaded: false },
        { name: 'code-explainer', desc: '代码解释与文档生成', source: 'ClawdHub', rating: 4.9, installs: 2341, loaded: false },
        { name: 'ppt-template-gen', desc: 'PPT 模板自动生成', source: 'ClawdHub', rating: 4.6, installs: 567, loaded: false },
      ]);
      setHubLoading(false);
    }, 800);
  };

  const installHubSkill = (skillName) => {
    setHubResults(hubResults.map(r => r.name === skillName ? { ...r, loaded: true } : r));
    const newSkill = {
      id: `hub-${Date.now()}`,
      name: skillName,
      description: hubResults.find(r => r.name === skillName)?.desc || '',
      source: 'ClawdHub',
      loaded: true,
      usages: 0,
    };
    onUpdate('skills', { ...skills, static: [...skills.static, newSkill] });
  };

  return (
    <div className="skill-layer">
      <LayerTabs
        tabs={[
          { id: 'static', label: '静态技能', count: skills.static.length },
          { id: 'dynamic', label: '动态技能', count: skills.dynamic.length },
          { id: 'hub', label: 'ClawdHub', count: hubResults.length || null },
        ]}
        active={tab}
        onChange={setTab}
      />

      {tab === 'static' && (
        <div className="skill-list">
          {skills.static.map(s => (
            <div key={s.id} className="skill-row">
              <div className="skill-info">
                <div className="skill-name-row">
                  <span className="skill-name">{s.name}</span>
                  <span className="skill-source-tag">{s.source}</span>
                </div>
                <div className="skill-desc">{s.description}</div>
                <div className="skill-meta">使用 {s.usages} 次</div>
              </div>
              <Toggle value={s.loaded} onChange={() => toggleSkill(s, 'static')} />
            </div>
          ))}
        </div>
      )}

      {tab === 'dynamic' && (
        <div className="skill-list">
          {skills.dynamic.map(s => (
            <div key={s.id} className="skill-row">
              <div className="skill-info">
                <div className="skill-name-row">
                  <span className="skill-name">{s.name}</span>
                  <span className="skill-auto-tag">自动生成</span>
                </div>
                <div className="skill-desc">{s.description}</div>
                <div className="skill-meta"><span>{s.generatedAt}</span><span>使用 {s.usages} 次</span></div>
              </div>
              <Toggle value={s.loaded} onChange={() => toggleSkill(s, 'dynamic')} />
            </div>
          ))}
        </div>
      )}

      {tab === 'hub' && (
        <div className="skill-hub">
          <div className="hub-search-row">
            <input className="form-input hub-search-input" type="text" placeholder="搜索 ClawdHub 技能..."
              value={hubSearch} onChange={e => setHubSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && searchClawdHub()} />
            <button className="ctrl-btn primary" onClick={searchClawdHub} disabled={hubLoading}>
              {hubLoading ? '搜索中...' : '搜索'}
            </button>
          </div>
          {hubResults.length > 0 ? (
            <div className="hub-results">
              {hubResults.map(r => (
                <div key={r.name} className="hub-result-item">
                  <div className="hub-result-info">
                    <div className="hub-result-name-row">
                      <span className="hub-result-name">{r.name}</span>
                      {r.loaded && <span className="skill-loaded-badge">已安装</span>}
                    </div>
                    <span className="hub-result-desc">{r.desc}</span>
                    <div className="hub-result-meta">
                      <span>⭐ {r.rating}</span>
                      <span>📥 {r.installs}</span>
                      <span className="hub-result-source">{r.source}</span>
                    </div>
                  </div>
                  <button className="ctrl-btn install-btn" disabled={r.loaded} onClick={() => installHubSkill(r.name)}>
                    {r.loaded ? '已安装' : '安装'}
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="hub-empty">输入关键词搜索 ClawdHub 技能库</div>
          )}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   记忆层 — 配置 + Canvas 知识图谱（已深）
═══════════════════════════════════════════════════════════════ */

function MemoryGraph({ nodes }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width = canvas.offsetWidth;
    const H = canvas.height = 320;

    ctx.clearRect(0, 0, W, H);

    const colors = { concept: '#0071e3', task: '#ff9f0a', project: '#34c759', system: '#af52de' };
    const cols = 3;
    const rows = Math.ceil(nodes.length / cols);
    const cellW = W / cols;
    const cellH = H / rows;

    const layout = nodes.map((n, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = col * cellW + cellW / 2 + (Math.random() - 0.5) * cellW * 0.2;
      const y = row * cellH + cellH / 2 + (Math.random() - 0.5) * cellH * 0.2;
      return { ...n, x, y };
    });

    // Draw edges
    ctx.strokeStyle = 'rgba(0, 113, 227, 0.15)';
    ctx.lineWidth = 1.5;
    layout.forEach(node => {
      node.connections.forEach(connId => {
        const target = layout.find(n => n.id === connId);
        if (target) {
          ctx.beginPath();
          ctx.moveTo(node.x, node.y);
          ctx.lineTo(target.x, target.y);
          ctx.stroke();
        }
      });
    });

    // Draw nodes
    layout.forEach(node => {
      const color = colors[node.type] || '#6e6e73';
      const radius = node.type === 'system' ? 14 : 10;

      ctx.fillStyle = color + '22';
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#1d1d1f';
      ctx.font = '10px -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(node.label, node.x, node.y + radius + 14);
    });
  }, [nodes]);

  return <canvas ref={canvasRef} className="memory-graph-canvas" />;
}

function MemoryLayer({ memory, onUpdate }) {
  const [tab, setTab] = useState('config');

  return (
    <div className="memory-layer">
      <LayerTabs
        tabs={[
          { id: 'config', label: '配置' },
          { id: 'graph', label: '知识图谱' },
        ]}
        active={tab}
        onChange={setTab}
      />

      {tab === 'config' && (
        <>
          <div className="memory-subsystem">
            <div className="subsystem-header">
              <div className="subsystem-title">短期记忆</div>
              <Toggle value={memory.shortTerm.enabled}
                onChange={(v) => onUpdate('memory', { ...memory, shortTerm: { ...memory.shortTerm, enabled: v } })} />
            </div>
            <div className="subsystem-body">
              <div className="memory-config-row">
                <span className="config-label">后端</span>
                <select className="config-select" value={memory.shortTerm.backend}
                  onChange={e => onUpdate('memory', { ...memory, shortTerm: { ...memory.shortTerm, backend: e.target.value } })}>
                  <option value="memory">内存</option>
                  <option value="redis">Redis</option>
                </select>
              </div>
              <div className="memory-config-row">
                <span className="config-label">TTL</span>
                <input className="config-input" type="number" value={memory.shortTerm.ttl}
                  onChange={e => onUpdate('memory', { ...memory, shortTerm: { ...memory.shortTerm, ttl: parseInt(e.target.value) || 0 } })} />
                <span className="config-unit">秒</span>
              </div>
              <div className="memory-config-row">
                <span className="config-label">最大会话</span>
                <input className="config-input" type="number" value={memory.shortTerm.maxSessions}
                  onChange={e => onUpdate('memory', { ...memory, shortTerm: { ...memory.shortTerm, maxSessions: parseInt(e.target.value) || 0 } })} />
              </div>
            </div>
          </div>

          <div className="memory-subsystem">
            <div className="subsystem-header">
              <div className="subsystem-title">长期记忆</div>
              <Toggle value={memory.longTerm.enabled}
                onChange={(v) => onUpdate('memory', { ...memory, longTerm: { ...memory.longTerm, enabled: v } })} />
            </div>
            <div className="subsystem-body">
              <div className="memory-config-row">
                <span className="config-label">向量引擎</span>
                <select className="config-select" value={memory.longTerm.backend}
                  onChange={e => onUpdate('memory', { ...memory, longTerm: { ...memory.longTerm, backend: e.target.value } })}>
                  <option value="sqlite-fts5">SQLite FTS5</option>
                  <option value="chromadb">ChromaDB</option>
                  <option value="mem0">Mem0</option>
                  <option value="zep">Zep</option>
                </select>
              </div>
              <div className="memory-config-row">
                <span className="config-label">维度</span>
                <input className="config-input" type="number" value={memory.longTerm.dim}
                  onChange={e => onUpdate('memory', { ...memory, longTerm: { ...memory.longTerm, dim: parseInt(e.target.value) || 0 } })} />
              </div>
              <div className="memory-config-row">
                <span className="config-label">存储路径</span>
                <input className="config-input wide" type="text" value={memory.longTerm.path}
                  onChange={e => onUpdate('memory', { ...memory, longTerm: { ...memory.longTerm, path: e.target.value } })} />
              </div>
            </div>
          </div>
        </>
      )}

      {tab === 'graph' && (
        <div className="memory-graph-section">
          <div className="graph-legend">
            <span><i style={{ background: '#0071e3' }} /> 概念</span>
            <span><i style={{ background: '#ff9f0a' }} /> 任务</span>
            <span><i style={{ background: '#34c759' }} /> 项目</span>
            <span><i style={{ background: '#af52de' }} /> 系统</span>
          </div>
          <MemoryGraph nodes={memory.graph} />
          <div className="graph-stats">{memory.graph.length} 个节点 · {memory.graph.reduce((acc, n) => acc + n.connections.length, 0)} 条边</div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   API 层
═══════════════════════════════════════════════════════════════ */

function ApiLayer({ api, onUpdate }) {
  const [tab, setTab] = useState('gateway');
  const budgetPct = api.costTracking.budget > 0 ? (api.costTracking.spent / api.costTracking.budget * 100).toFixed(1) : 0;

  return (
    <div className="api-layer">
      <LayerTabs
        tabs={[
          { id: 'gateway', label: '网关配置' },
          { id: 'keys', label: 'API Keys', count: api.keys.length },
          { id: 'cost', label: '成本追踪' },
        ]}
        active={tab}
        onChange={setTab}
      />

      {tab === 'gateway' && (
        <div className="api-gateway-config">
          <div className="gateway-row">
            <span className="gateway-label">网关开关</span>
            <Toggle value={api.gateway.enabled} onChange={(v) => onUpdate('api', { ...api, gateway: { ...api.gateway, enabled: v } })} />
          </div>
          <div className="gateway-row">
            <span className="gateway-label">端口</span>
            <input className="config-input small" type="number" value={api.gateway.port}
              onChange={e => onUpdate('api', { ...api, gateway: { ...api.gateway, port: parseInt(e.target.value) || 8080 } })} />
          </div>
          <div className="gateway-row">
            <span className="gateway-label">速率限制</span>
            <input className="config-input small" type="number" value={api.gateway.rateLimit}
              onChange={e => onUpdate('api', { ...api, gateway: { ...api.gateway, rateLimit: parseInt(e.target.value) || 100 } })} />
            <span className="config-unit">req/min</span>
          </div>
          <div className="gateway-row">
            <span className="gateway-label">自动重试</span>
            <input className="config-input small" type="number" value={api.gateway.retry}
              onChange={e => onUpdate('api', { ...api, gateway: { ...api.gateway, retry: parseInt(e.target.value) || 3 } })} />
            <span className="config-unit">次</span>
          </div>
          <div className="gateway-stats-row">
            <div className="gateway-stat"><span className="stat-label">总调用</span><span className="stat-value">{api.stats.totalCalls}</span></div>
            <div className="gateway-stat"><span className="stat-label">成功率</span><span className="stat-value success-text">{api.stats.successRate}%</span></div>
            <div className="gateway-stat"><span className="stat-label">平均延迟</span><span className="stat-value">{api.stats.avgLatency}s</span></div>
          </div>
        </div>
      )}

      {tab === 'keys' && (
        <div className="api-keys-section">
          {api.keys.map(k => (
            <div key={k.id} className="key-row">
              <span className="key-name">{k.name}</span>
              <span className="key-value">{k.key}</span>
              <span className="key-scopes">{k.scopes.join(', ')}</span>
              <span className="key-date">{k.created}</span>
            </div>
          ))}
          <button className="add-btn">+ 添加 Key</button>
        </div>
      )}

      {tab === 'cost' && (
        <div className="cost-section">
          <div className="cost-header-row">
            <div className="cost-item"><span className="cost-label">预算</span><span className="cost-value large">${api.costTracking.budget}</span></div>
            <div className="cost-item"><span className="cost-label">已使用</span><span className="cost-value large">${api.costTracking.spent.toFixed(2)}</span></div>
            <div className="cost-item"><span className="cost-label">剩余</span><span className="cost-value large">${(api.costTracking.budget - api.costTracking.spent).toFixed(2)}</span></div>
          </div>
          <div className="cost-bar-wrap">
            <div className="cost-bar" style={{ width: `${Math.min(budgetPct, 100)}%`, background: budgetPct > 80 ? 'var(--error)' : budgetPct > 60 ? 'var(--warning)' : 'var(--success)' }} />
          </div>
          <div className="cost-bar-label">{budgetPct}% 已使用</div>
          <div className="cost-toggle-row">
            <span className="cost-label">成本追踪开关</span>
            <Toggle value={api.costTracking.enabled}
              onChange={(v) => onUpdate('api', { ...api, costTracking: { ...api.costTracking, enabled: v } })} />
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   主组件
═══════════════════════════════════════════════════════════════ */

export default function ControlPanel() {
  const [state, setState] = useState(defaultState);
  const [activeLayer, setActiveLayer] = useState('runtime');

  const layers = [
    { id: 'runtime', label: '运行时', icon: '⚙️' },
    { id: 'model', label: '模型配置', icon: '🧠' },
    { id: 'mcp', label: 'MCP 协议', icon: '🔌' },
    { id: 'skill', label: '技能库', icon: '📦' },
    { id: 'memory', label: '记忆层', icon: '💾' },
    { id: 'api', label: 'API 网关', icon: '🌐' },
  ];

  const update = useCallback((key, value) => {
    setState(prev => {
      const next = { ...prev, [key]: value };
      try { localStorage.setItem('hermes-control-state', JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('hermes-control-state');
      if (saved) setState(JSON.parse(saved));
    } catch {}
  }, []);

  const renderLayer = () => {
    switch (activeLayer) {
      case 'runtime': return <RuntimeLayer runtimes={state.runtimes}
        onUpdate={(k, v) => setState(s => ({ ...s, runtimes: { ...s.runtimes, [k]: { ...s.runtimes[k], ...v } } }))} />;
      case 'model': return <ModelLayer models={state.models} routingRules={state.routingRules} onUpdate={update} />;
      case 'mcp': return <McpLayer mcps={state.mcps} onUpdate={update} />;
      case 'skill': return <SkillLayer skills={state.skills} onUpdate={update} />;
      case 'memory': return <MemoryLayer memory={state.memory} onUpdate={update} />;
      case 'api': return <ApiLayer api={state.api} onUpdate={update} />;
      default: return null;
    }
  };

  return (
    <div id="control-panel">
      <div id="layer-nav">
        <div className="layer-nav-header">控制面板</div>
        {layers.map(l => (
          <button key={l.id} className={`layer-nav-item ${activeLayer === l.id ? 'active' : ''}`}
            onClick={() => setActiveLayer(l.id)}>
            <span className="layer-nav-icon">{l.icon}</span>
            <span className="layer-nav-label">{l.label}</span>
          </button>
        ))}
      </div>
      <div id="layer-content">{renderLayer()}</div>
    </div>
  );
}