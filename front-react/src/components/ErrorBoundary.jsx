import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, showStack: false, copied: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // 关键：toast / 上报 / 持久化场景下挂到全局
    console.error('[ErrorBoundary]', error, info.componentStack);
    if (typeof window !== 'undefined' && window.__hermes_report_error__) {
      try { window.__hermes_report_error__(error, info); } catch (_) {}
    }
  }

  handleCopy = async () => {
    const { error } = this.state;
    if (!error) return;
    const text = `${error.name || 'Error'}: ${error.message}\n${error.stack || ''}`;
    try {
      await navigator.clipboard.writeText(text);
      this.setState({ copied: true });
      setTimeout(() => this.setState({ copied: false }), 1500);
    } catch (_) {
      // fallback：选中文本让用户手动复制
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); this.setState({ copied: true }); } catch (_) {}
      document.body.removeChild(ta);
      setTimeout(() => this.setState({ copied: false }), 1500);
    }
  };

  handleReset = () => {
    this.setState({ hasError: false, error: null, showStack: false, copied: false });
    // 不直接 reload——给应用一次自我恢复的机会（zustand / react state 仍然在）
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const { error, showStack, copied } = this.state;
      return (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          height: '100vh', fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
          color: 'var(--text)', background: 'var(--bg)', padding: 24,
        }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--error)" strokeWidth="1.5" style={{ marginBottom: 16 }}>
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>应用出现错误</h2>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20, maxWidth: 480, textAlign: 'center' }}>
            {error?.message || '未知错误'}
          </p>

          {error?.stack && (
            <div style={{ width: '100%', maxWidth: 640, marginBottom: 20 }}>
              <button
                onClick={() => this.setState((s) => ({ showStack: !s.showStack }))}
                style={{
                  padding: '4px 10px', borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border)', background: 'transparent',
                  color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 12,
                }}
              >
                {showStack ? '隐藏' : '查看'} 堆栈信息
              </button>
              {showStack && (
                <pre style={{
                  marginTop: 8, padding: 12, maxHeight: 240, overflow: 'auto',
                  background: 'var(--bg-secondary, rgba(0,0,0,0.05))',
                  border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
                  fontSize: 11, lineHeight: 1.5, color: 'var(--text-secondary)',
                  whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                }}>{error.stack}</pre>
              )}
            </div>
          )}

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={this.handleCopy}
              style={{
                padding: '8px 16px', borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border)', background: 'transparent',
                color: 'var(--text)', cursor: 'pointer', fontSize: 13,
              }}
            >
              {copied ? '已复制' : '复制错误'}
            </button>
            <button
              onClick={this.handleReset}
              style={{
                padding: '8px 16px', borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border)', background: 'transparent',
                color: 'var(--text)', cursor: 'pointer', fontSize: 13,
              }}
            >
              尝试恢复
            </button>
            <button
              onClick={this.handleReload}
              style={{
                padding: '8px 16px', borderRadius: 'var(--radius-sm)',
                border: 'none', background: 'var(--accent)', color: '#fff',
                cursor: 'pointer', fontSize: 13,
              }}
            >
              重新加载
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
