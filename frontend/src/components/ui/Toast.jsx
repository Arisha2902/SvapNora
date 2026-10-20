import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';

const ToastCtx = createContext(null);

let seq = 0;

/** Imperative toast API: `const toast = useToast(); toast.success('Saved');` */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef(new Map());

  const dismiss = useCallback((id) => {
    setToasts((list) => list.filter((t) => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const push = useCallback(
    (tone, message, ttl = 4200) => {
      const id = ++seq;
      setToasts((list) => [...list, { id, tone, message }].slice(-4));
      if (ttl > 0) {
        timers.current.set(
          id,
          setTimeout(() => dismiss(id), ttl),
        );
      }
      return id;
    },
    [dismiss],
  );

  const value = useMemo(
    () => ({
      show: push,
      success: (m, ttl) => push('success', m, ttl),
      error: (m, ttl) => push('error', m, ttl),
      info: (m, ttl) => push('info', m, ttl),
      dismiss,
    }),
    [push, dismiss],
  );

  return (
    <ToastCtx.Provider value={value}>
      {children}
      <div className="toasts" role="region" aria-live="polite" aria-label="Notifications">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast--${t.tone}`} role={t.tone === 'error' ? 'alert' : 'status'}>
            <span className="toast__dot" aria-hidden="true" />
            <p className="toast__msg">{t.message}</p>
            <button className="toast__close" onClick={() => dismiss(t.id)} aria-label="Dismiss notification">
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
}
