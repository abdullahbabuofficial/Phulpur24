'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { Icon } from './Icon';

type ToastTone = 'success' | 'error' | 'info' | 'warning';
interface Toast {
  id: string;
  tone: ToastTone;
  title: string;
  description?: string;
}

interface ToastContextValue {
  push: (input: { tone?: ToastTone; title: string; description?: string }) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  const dismiss = useCallback((id: string) => {
    setToasts((list) => list.filter((t) => t.id !== id));
    const tm = timers.current.get(id);
    if (tm) clearTimeout(tm);
    timers.current.delete(id);
  }, []);

  const push = useCallback<ToastContextValue['push']>(
    ({ tone = 'success', title, description }) => {
      const id = `t-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      setToasts((list) => [...list, { id, tone, title, description }]);
      timers.current.set(
        id,
        setTimeout(() => dismiss(id), 4200)
      );
    },
    [dismiss]
  );

  useEffect(() => () => timers.current.forEach((t) => clearTimeout(t)), []);

  return (
    <ToastContext.Provider value={{ push }}>
      {children}
      <div
        role="region"
        aria-label="Notifications"
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 top-4 z-[60] flex flex-col items-center gap-2 px-4 sm:left-auto sm:right-5 sm:items-end"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className="pointer-events-auto flex w-full max-w-sm animate-fade-in items-start gap-3 rounded-xl border border-line bg-white p-3.5 shadow-elev"
          >
            <ToastIcon tone={t.tone} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-ink">{t.title}</p>
              {t.description ? <p className="mt-0.5 text-sm text-ink-muted">{t.description}</p> : null}
            </div>
            <button
              type="button"
              onClick={() => dismiss(t.id)}
              aria-label="Dismiss notification"
              className="text-ink-faint hover:text-ink"
            >
              <Icon.Close size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastIcon({ tone }: { tone: ToastTone }) {
  const map: Record<ToastTone, { bg: string; fg: string; node: ReactNode }> = {
    success: { bg: 'bg-success-soft', fg: 'text-success', node: <Icon.CheckCircle size={16} /> },
    error: { bg: 'bg-danger-soft', fg: 'text-danger', node: <Icon.AlertTriangle size={16} /> },
    info: { bg: 'bg-info-soft', fg: 'text-info', node: <Icon.Info size={16} /> },
    warning: { bg: 'bg-warning-soft', fg: 'text-warning', node: <Icon.AlertTriangle size={16} /> },
  };
  const cfg = map[tone];
  return (
    <span
      className={`mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${cfg.bg} ${cfg.fg}`}
    >
      {cfg.node}
    </span>
  );
}
