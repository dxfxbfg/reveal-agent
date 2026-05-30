import React, { useState, useEffect } from 'react';

const STEPS = ['init', 'requirement-analyzer', 'info-collector', 'slide-generator'];
const STEP_LABELS = {
  init: '初始化',
  'requirement-analyzer': '需求分析',
  'info-collector': '资料收集',
  'slide-generator': '生成幻灯片',
};

function formatTime(sec) {
  const m = String(Math.floor(sec / 60)).padStart(2, '0');
  const s = String(sec % 60).padStart(2, '0');
  return `${m}:${s}`;
}

export default function GenerationOverlay({ task, onStop, onContinue, onDiscard }) {
  const gen = task.generation;
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!gen.isGenerating || !gen.startTime) return;
    const iv = setInterval(() => setTick(n => n + 1), 1000);
    return () => clearInterval(iv);
  }, [gen.isGenerating, gen.startTime]);

  const stepIdx = STEPS.indexOf(gen.step);
  const elapsed = gen.startTime ? Math.floor((Date.now() - gen.startTime) / 1000) : 0;
  const isStopped = !gen.isGenerating && !!gen.lastSendPayload;

  return (
    <>
      {/* Loading overlay */}
      <div id="loading-overlay" className={`loading-overlay ${gen.isGenerating ? '' : 'hidden'}`}>
        <div id="progress-steps" className="progress-steps">
          {STEPS.map((s, i) => (
            <div
              key={s}
              className={`progress-segment ${i < stepIdx ? 'done' : ''} ${i === stepIdx ? 'active' : ''}`}
            />
          ))}
        </div>
        <div id="progress-info" className="progress-info">
          <div id="progress-step-name">{gen.stepLabel || '准备中...'}</div>
          <div id="progress-timer">{formatTime(elapsed)}</div>
        </div>
        <button id="stop-generation-btn" className="stop-generation-btn" onClick={onStop} title="停止生成">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="6" y="6" width="12" height="12" rx="2"/>
          </svg>
          停止
        </button>
      </div>

      {/* Stopped overlay */}
      <div id="stopped-overlay" className={`stopped-overlay ${isStopped ? '' : 'hidden'}`}>
        <div className="stopped-content">
          <div className="stopped-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="6" y="4" width="4" height="16" rx="1"/>
              <rect x="14" y="4" width="4" height="16" rx="1"/>
            </svg>
          </div>
          <div className="stopped-title">生成已暂停</div>
          <div className="stopped-sub">你可以继续或放弃这次生成</div>
          <div className="stopped-actions">
            <button
              id="stopped-continue-btn"
              className="stopped-btn continue"
              onClick={onContinue}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="5 3 19 12 5 21 5 3"/>
              </svg>
              继续生成
            </button>
            <button
              id="stopped-discard-btn"
              className="stopped-btn discard"
              onClick={onDiscard}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
              放弃
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
