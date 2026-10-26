import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 9);
    const newToast = { id, message, type };

    setToasts((prev) => [...prev, newToast]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div
        style={{
          position: 'fixed',
          top: '1.5rem',
          right: '1.5rem',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
          pointerEvents: 'none',
        }}
      >
        {toasts.map((toast) => {
          let bg = '#1e293b';
          let border = '#334155';
          let Icon = Info;
          let iconColor = '#38bdf8';

          if (toast.type === 'success') {
            bg = '#064e3b';
            border = '#059669';
            Icon = CheckCircle2;
            iconColor = '#34d399';
          } else if (toast.type === 'error') {
            bg = '#7f1d1d';
            border = '#dc2626';
            Icon = AlertCircle;
            iconColor = '#f87171';
          } else if (toast.type === 'warning') {
            bg = '#78350f';
            border = '#d97706';
            Icon = AlertTriangle;
            iconColor = '#fbbf24';
          }

          return (
            <div
              key={toast.id}
              style={{
                pointerEvents: 'auto',
                background: bg,
                border: `1px solid ${border}`,
                color: 'white',
                padding: '0.85rem 1.25rem',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                minWidth: '300px',
                maxWidth: '450px',
                boxShadow: '0 10px 15px -3px rgba(0,0,0,0.3)',
                fontSize: '0.875rem',
                fontWeight: 500,
                animation: 'scaleUp 0.2s ease-out',
              }}
            >
              <Icon size={18} color={iconColor} style={{ flexShrink: 0 }} />
              <div style={{ flex: 1 }}>{toast.message}</div>
              <button
                onClick={() => removeToast(toast.id)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'rgba(255,255,255,0.7)',
                  cursor: 'pointer',
                  padding: 2,
                }}
              >
                <X size={16} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
