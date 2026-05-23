// ============================================================
// Toast System — CDS SME
// Hook: useToast() => { toast, success, error, warning, info }
// Provider: <ToastProvider /> wrap App.tsx
// ============================================================
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Icons } from './Icons';

export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

export interface ToastInput {
  title?: string;
  description?: string;
  message?: string; // alias cho description khi gọi nhanh
  variant?: ToastVariant;
  duration?: number; // ms, 0 = không tự đóng
}

interface ToastItem extends Required<Pick<ToastInput, 'variant'>> {
  id: string;
  title?: string;
  description?: string;
  duration: number;
  createdAt: number;
}

interface ToastContextValue {
  toast: (input: ToastInput) => string;
  success: (msg: string, opts?: Omit<ToastInput, 'variant' | 'description'>) => string;
  error: (msg: string, opts?: Omit<ToastInput, 'variant' | 'description'>) => string;
  warning: (msg: string, opts?: Omit<ToastInput, 'variant' | 'description'>) => string;
  info: (msg: string, opts?: Omit<ToastInput, 'variant' | 'description'>) => string;
  dismiss: (id: string) => void;
  clear: () => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

// --- Helper: tạo ID ổn định ---
function makeId(): string {
  return `t_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

// --- Provider ---
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: string) => {
    setItems((prev) => prev.filter((t) => t.id !== id));
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
  }, []);

  const clear = useCallback(() => {
    setItems([]);
    timersRef.current.forEach((t) => clearTimeout(t));
    timersRef.current.clear();
  }, []);

  const toast = useCallback(
    (input: ToastInput) => {
      const id = makeId();
      const description = input.description ?? input.message;
      const item: ToastItem = {
        id,
        variant: input.variant ?? 'info',
        title: input.title,
        description,
        duration: typeof input.duration === 'number' ? input.duration : 4200,
        createdAt: Date.now(),
      };
      setItems((prev) => [...prev, item]);
      if (item.duration > 0) {
        const timer = setTimeout(() => dismiss(id), item.duration);
        timersRef.current.set(id, timer);
      }
      return id;
    },
    [dismiss]
  );

  const success = useCallback(
    (msg: string, opts?: Omit<ToastInput, 'variant' | 'description'>) =>
      toast({ ...opts, variant: 'success', description: msg }),
    [toast]
  );
  const error = useCallback(
    (msg: string, opts?: Omit<ToastInput, 'variant' | 'description'>) =>
      toast({ ...opts, variant: 'error', description: msg, duration: opts?.duration ?? 6000 }),
    [toast]
  );
  const warning = useCallback(
    (msg: string, opts?: Omit<ToastInput, 'variant' | 'description'>) =>
      toast({ ...opts, variant: 'warning', description: msg }),
    [toast]
  );
  const info = useCallback(
    (msg: string, opts?: Omit<ToastInput, 'variant' | 'description'>) =>
      toast({ ...opts, variant: 'info', description: msg }),
    [toast]
  );

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach((t) => clearTimeout(t));
      timers.clear();
    };
  }, []);

  const value = useMemo<ToastContextValue>(
    () => ({ toast, success, error, warning, info, dismiss, clear }),
    [toast, success, error, warning, info, dismiss, clear]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastViewport items={items} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

// --- Hook ---
export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast phải được dùng bên trong <ToastProvider>');
  }
  return ctx;
}

// --- Viewport (UI) ---
interface ToastViewportProps {
  items: ToastItem[];
  onDismiss: (id: string) => void;
}

const VARIANT_STYLES: Record<
  ToastVariant,
  { bg: string; border: string; icon: React.ReactNode; iconBg: string; titleColor: string }
> = {
  success: {
    bg: 'var(--success-tint, #ecf9f2)',
    border: 'oklch(0.82 0.08 155)',
    icon: <Icons.CheckCircle size={18} />,
    iconBg: 'oklch(0.55 0.13 155)',
    titleColor: 'oklch(0.32 0.13 155)',
  },
  error: {
    bg: 'var(--danger-tint, #fef2f2)',
    border: 'oklch(0.82 0.1 25)',
    icon: <Icons.AlertTriangle size={18} />,
    iconBg: 'var(--danger, #c0392b)',
    titleColor: 'oklch(0.4 0.18 25)',
  },
  warning: {
    bg: 'var(--accent-tint, #fffbeb)',
    border: 'oklch(0.82 0.1 70)',
    icon: <Icons.AlertTriangle size={18} />,
    iconBg: 'oklch(0.62 0.14 70)',
    titleColor: 'oklch(0.38 0.14 70)',
  },
  info: {
    bg: 'var(--primary-tint, #eff6ff)',
    border: 'oklch(0.85 0.07 200)',
    icon: <Icons.Info size={18} />,
    iconBg: 'var(--primary, #1e60a8)',
    titleColor: 'var(--primary, #1e60a8)',
  },
};

function ToastViewport({ items, onDismiss }: ToastViewportProps) {
  return (
    <div
      role="region"
      aria-label="Thông báo"
      style={{
        position: 'fixed',
        top: 20,
        right: 20,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        maxWidth: 'min(420px, calc(100vw - 32px))',
        pointerEvents: 'none',
      }}
    >
      {items.map((t) => (
        <ToastCard key={t.id} item={t} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

function ToastCard({ item, onDismiss }: { item: ToastItem; onDismiss: (id: string) => void }) {
  const v = VARIANT_STYLES[item.variant];
  return (
    <div
      role={item.variant === 'error' ? 'alert' : 'status'}
      aria-live={item.variant === 'error' ? 'assertive' : 'polite'}
      style={{
        pointerEvents: 'auto',
        background: v.bg,
        border: `1px solid ${v.border}`,
        borderRadius: 'var(--r-md, 12px)',
        padding: '12px 14px',
        boxShadow: '0 10px 30px -10px rgba(15, 23, 42, 0.18), 0 4px 10px -4px rgba(15, 23, 42, 0.08)',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
        backdropFilter: 'blur(8px) saturate(140%)',
        animation: 'cds-toast-in 220ms cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      <div
        aria-hidden="true"
        style={{
          width: 30,
          height: 30,
          borderRadius: 999,
          background: v.iconBg,
          color: '#fff',
          display: 'grid',
          placeItems: 'center',
          flexShrink: 0,
          marginTop: 1,
        }}
      >
        {v.icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        {item.title && (
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: v.titleColor,
              marginBottom: item.description ? 2 : 0,
              lineHeight: 1.35,
            }}
          >
            {item.title}
          </div>
        )}
        {item.description && (
          <div
            style={{
              fontSize: 13,
              color: 'var(--text, #1a1410)',
              lineHeight: 1.45,
              wordBreak: 'break-word',
            }}
          >
            {item.description}
          </div>
        )}
      </div>
      <button
        type="button"
        aria-label="Đóng thông báo"
        onClick={() => onDismiss(item.id)}
        style={{
          flexShrink: 0,
          background: 'transparent',
          border: 'none',
          color: 'var(--text-muted, #7a736b)',
          width: 26,
          height: 26,
          borderRadius: 6,
          display: 'grid',
          placeItems: 'center',
          cursor: 'pointer',
          transition: 'background 160ms ease, color 160ms ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(0,0,0,0.05)';
          e.currentTarget.style.color = 'var(--text, #1a1410)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'transparent';
          e.currentTarget.style.color = 'var(--text-muted, #7a736b)';
        }}
      >
        <Icons.X size={14} />
      </button>
      <style>{`
        @keyframes cds-toast-in {
          from { transform: translateX(16px) scale(0.98); opacity: 0; }
          to   { transform: translateX(0) scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
