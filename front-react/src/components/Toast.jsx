import React, { useState, useEffect } from 'react';

let toastId = 0;
const listeners = new Set();

export function addToast(message, type = 'info') {
  const id = ++toastId;
  listeners.forEach(fn => fn({ id, message, type }));
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const handler = (toast) => {
      setToasts(prev => [...prev, toast]);
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== toast.id));
      }, 4000);
    };
    listeners.add(handler);
    return () => listeners.delete(handler);
  }, []);

  return (
    <div id="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast ${t.type === 'error' ? 'error' : 'success'}`}>
          {t.message}
        </div>
      ))}
    </div>
  );
}