'use client';

import React, { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

type ToastTone = 'success' | 'error' | 'info';

type ToastInput = {
  tone: ToastTone;
  title: string;
  message?: string;
};

type ToastRecord = ToastInput & { id: number };

type ToastContextValue = {
  pushToast: (toast: ToastInput) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function AdminToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastRecord[]>([]);
  const pushToast = useCallback((toast: ToastInput) => {
    const id = Date.now() + Math.random();
    setToasts((current) => [...current, { id, ...toast }]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((item) => item.id !== id));
    }, 3200);
  }, []);

  const value = useMemo(() => ({ pushToast }), [pushToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-stack" aria-live="polite" aria-atomic="true">
        {toasts.map((toast) => (
          <article key={toast.id} className={`toast toast-${toast.tone}`} role={toast.tone === 'error' ? 'alert' : 'status'}>
            <strong>{toast.title}</strong>
            {toast.message ? <p>{toast.message}</p> : null}
          </article>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useAdminToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useAdminToast must be used within AdminToastProvider.');
  }
  return context;
}
