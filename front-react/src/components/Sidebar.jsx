import React from 'react';

export default function Sidebar({
  tasks, activeTaskId,
  onSwitch, onNew, onDelete
}) {
  return (
    <div id="sidebar">
      <div className="sidebar-header">
        <span className="sidebar-title">任务列表</span>
        <button className="sidebar-new-btn" onClick={onNew}>+ 新建</button>
      </div>
      <div className="sidebar-list">
        {tasks.map(t => (
          <div
            key={t.id}
            className={`sidebar-task ${t.id === activeTaskId ? 'active' : ''}`}
            onClick={() => onSwitch(t.id)}
          >
            <span className="sidebar-task-title">{t.title}</span>
            {t.generation.isGenerating && (
              <span className="task-spinner" />
            )}
            <button
              className="sidebar-task-del"
              onClick={(e) => { e.stopPropagation(); if (tasks.length > 1) onDelete(t.id); }}
              title="删除任务"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
