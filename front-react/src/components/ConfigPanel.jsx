import React, { useState } from 'react';

const MODELS = [
  { value: 'normal', label: 'Normal' },
  { value: 'haiku', label: 'Haiku' },
  { value: 'sonnet', label: 'Sonnet' },
  { value: 'opus', label: 'Opus' },
  { value: 'gpt-4o', label: 'GPT-4o' },
  { value: 'claude', label: 'Claude' },
];

const QUALITY_TIERS = [
  { value: 'fast', label: '快速' },
  { value: 'normal', label: '标准' },
  { value: 'high', label: '高质量' },
];

export default function ConfigPanel({ model, qualityTier, customApis = [], onModelChange, onQualityChange, onAddApi, onRemoveApi }) {
  const [showApiModal, setShowApiModal] = useState(false);
  const [apiName, setApiName] = useState('');
  const [apiUrl, setApiUrl] = useState('');
  const [apiKey, setApiKey] = useState('');

  const handleSaveApi = () => {
    if (!apiName.trim() || !apiUrl.trim() || !apiKey.trim()) return;
    onAddApi({ name: apiName.trim(), url: apiUrl.trim(), key: apiKey.trim() });
    setApiName('');
    setApiUrl('');
    setApiKey('');
    setShowApiModal(false);
  };

  return (
    <>
      <div id="config-bar">
        <div id="config-row">
          <div className="config-group">
            <label className="config-label">模型</label>
            <select
              id="model-select"
              className="config-select"
              value={model}
              onChange={e => onModelChange(e.target.value)}
            >
              {MODELS.map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
              {customApis.map(a => (
                <option key={`custom-${a.name}`} value={`custom-${a.name}`}>{a.name}</option>
              ))}
            </select>
          </div>
          <div className="config-group">
            <label className="config-label">质量</label>
            <select
              id="quality-tier"
              className="config-select"
              value={qualityTier}
              onChange={e => onQualityChange(e.target.value)}
            >
              {QUALITY_TIERS.map(q => (
                <option key={q.value} value={q.value}>{q.label}</option>
              ))}
            </select>
          </div>
          <button id="add-api-btn" className="config-btn" onClick={() => setShowApiModal(true)} title="添加自定义API">
            + API
          </button>
        </div>
      </div>

      {showApiModal && (
        <div className="modal-overlay" onClick={() => setShowApiModal(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">添加自定义 API</span>
              <button className="modal-close" onClick={() => setShowApiModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>名称</label>
                <input
                  id="api-name-input"
                  className="form-input"
                  type="text"
                  placeholder="My API"
                  value={apiName}
                  onChange={e => setApiName(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>API URL</label>
                <input
                  id="api-url-input"
                  className="form-input"
                  type="text"
                  placeholder="https://api.example.com/v1/chat/completions"
                  value={apiUrl}
                  onChange={e => setApiUrl(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>API Key</label>
                <input
                  id="api-key-input"
                  className="form-input"
                  type="password"
                  placeholder="sk-..."
                  value={apiKey}
                  onChange={e => setApiKey(e.target.value)}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="modal-btn cancel" onClick={() => setShowApiModal(false)}>取消</button>
              <button className="modal-btn save" onClick={handleSaveApi}>保存</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
