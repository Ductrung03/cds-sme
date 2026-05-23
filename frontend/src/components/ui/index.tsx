// ============================================================
// UI Primitives — CDS SME Design System
// ============================================================
import React from 'react';
import { Icons } from './Icons';

// --- Button ---
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'accent';
  size?: 'xs' | 'sm' | 'lg';
  block?: boolean;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
  loading?: boolean;
}

export function Button({
  children,
  variant = 'primary',
  size,
  block,
  icon,
  iconRight,
  loading,
  disabled,
  className = '',
  ...rest
}: ButtonProps) {
  const cls = [
    'btn',
    `btn--${variant}`,
    size && `btn--${size}`,
    block && 'btn--block',
    !children && (icon || loading) && 'btn--icon',
    className,
  ]
    .filter(Boolean)
    .join(' ');
  return (
    <button className={cls} disabled={disabled || loading} {...rest}>
      {loading ? <Icons.Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> : icon}
      {children}
      {!loading && iconRight}
    </button>
  );
}

// --- Badge ---
interface BadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'accent' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  dot?: boolean;
}

export function Badge({ children, variant = 'neutral', dot }: BadgeProps) {
  return (
    <span className={`badge badge--${variant}`}>
      {dot && <span className="dot" />}
      {children}
    </span>
  );
}

// --- StatusBadge ---
const STATUS_MAP: Record<string, { v: BadgeProps['variant']; t: string }> = {
  draft: { v: 'warning', t: 'Nháp' },
  submitted: { v: 'accent', t: 'Đã nộp' },
  reviewing: { v: 'info', t: 'Chờ duyệt' },
  scored: { v: 'primary', t: 'Đã chấm điểm' },
  published: { v: 'success', t: 'Đã công bố' },
};

export function StatusBadge({ status }: { status: string }) {
  const c = STATUS_MAP[status] ?? { v: 'neutral' as const, t: status };
  return (
    <Badge variant={c.v} dot>
      {c.t}
    </Badge>
  );
}

// --- Card ---
interface CardProps {
  title?: React.ReactNode;
  sub?: React.ReactNode;
  head?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
  foot?: React.ReactNode;
  padding?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export function Card({ title, sub, head, action, children, foot, padding = true, className = '', style }: CardProps) {
  return (
    <div className={`card ${className}`} style={style}>
      {(title || head || action) && (
        <div className="card__head">
          <div style={{ flex: 1 }}>
            {title && <div className="card__title">{title}</div>}
            {sub && <div className="card__sub">{sub}</div>}
            {head}
          </div>
          {action}
        </div>
      )}
      <div className={padding ? 'card__body' : ''} style={padding ? {} : { padding: 0 }}>
        {children}
      </div>
      {foot && <div className="card__foot">{foot}</div>}
    </div>
  );
}

// --- StatCard ---
interface StatCardProps {
  label: string;
  value: React.ReactNode;
  icon: React.ReactNode;
  accent?: 'primary' | 'accent' | 'success' | 'info';
  delta?: string;
  deltaDir?: 'up' | 'down' | 'flat';
  progress?: number;
}

export function StatCard({ label, value, icon, accent = 'primary', delta, deltaDir, progress }: StatCardProps) {
  return (
    <div className={`stat stat--${accent}`}>
      <div className={`stat__icon stat__icon--${accent}`}>{icon}</div>
      <div className="stat__label">{label}</div>
      <div className="stat__value">{value}</div>
      {delta && (
        <span className={`stat__delta stat__delta--${deltaDir ?? 'up'}`}>
          {deltaDir === 'down' ? <Icons.TrendingDown size={12} /> : <Icons.TrendingUp size={12} />}
          {delta}
        </span>
      )}
      <div className="stat__rule" style={{ '--w': (progress ?? 65) + '%' } as React.CSSProperties} />
    </div>
  );
}

// --- Progress ---
interface ProgressProps {
  value: number;
  variant?: 'primary' | 'accent' | 'success' | 'danger';
}

export function Progress({ value, variant }: ProgressProps) {
  return (
    <div className={`progress${variant ? ' progress--' + variant : ''}`}>
      <div className="progress__bar" style={{ width: Math.max(0, Math.min(100, value)) + '%' }} />
    </div>
  );
}

// --- Chip ---
interface ChipProps {
  active?: boolean;
  count?: number;
  children: React.ReactNode;
  onClick?: () => void;
}

export function Chip({ active, count, children, onClick }: ChipProps) {
  return (
    <button className={`chip${active ? ' is-active' : ''}`} onClick={onClick} type="button">
      {children}
      {count != null && <span className="chip__count">{count}</span>}
    </button>
  );
}

// --- RadioCard ---
interface RadioCardProps {
  label: React.ReactNode;
  hint?: string;
  checked?: boolean;
  onChange?: () => void;
  suffix?: React.ReactNode;
}

export function RadioCard({ label, hint, checked, onChange, suffix }: RadioCardProps) {
  return (
    <div
      className={`radio-card${checked ? ' is-checked' : ''}`}
      onClick={onChange}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onChange?.()}
      tabIndex={0}
      role="radio"
      aria-checked={checked}
    >
      <span className="radio-card__dot" />
      <span style={{ flex: 1 }}>
        <div className="radio-card__label">{label}</div>
        {hint && <div className="radio-card__hint">{hint}</div>}
      </span>
      {suffix}
    </div>
  );
}

// --- CheckCard ---
interface CheckCardProps {
  label: React.ReactNode;
  hint?: string;
  checked?: boolean;
  onChange?: () => void;
}

export function CheckCard({ label, hint, checked, onChange }: CheckCardProps) {
  return (
    <div
      className={`radio-card${checked ? ' is-checked' : ''}`}
      onClick={onChange}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onChange?.()}
      tabIndex={0}
      role="checkbox"
      aria-checked={checked}
    >
      <span className={`checkbox${checked ? ' is-checked' : ''}`} />
      <span style={{ flex: 1 }}>
        <div className="radio-card__label">{label}</div>
        {hint && <div className="radio-card__hint">{hint}</div>}
      </span>
    </div>
  );
}

// --- Toggle ---
export function Toggle({ on, onChange }: { on: boolean; onChange: () => void }) {
  return (
    <button
      className={`toggle${on ? ' is-on' : ''}`}
      onClick={onChange}
      aria-pressed={on}
      type="button"
    />
  );
}

// --- Tabs ---
interface TabItem {
  value: string;
  label: string;
  count?: number;
}

export function Tabs({ items, value, onChange }: { items: TabItem[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="tabs">
      {items.map((it) => (
        <button
          key={it.value}
          className={`tab${value === it.value ? ' is-active' : ''}`}
          onClick={() => onChange(it.value)}
          type="button"
        >
          {it.label}
          {it.count != null && (
            <span style={{ marginLeft: 6, opacity: 0.6, fontWeight: 500 }}>· {it.count}</span>
          )}
        </button>
      ))}
    </div>
  );
}

// --- Drawer ---
interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  children: React.ReactNode;
  foot?: React.ReactNode;
  width?: number;
}

export function Drawer({ open, onClose, title, children, foot, width = 540 }: DrawerProps) {
  React.useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <>
      <div className="scrim" onClick={onClose} aria-hidden="true" />
      <aside className="drawer" style={{ width }} role="dialog" aria-modal="true" aria-label={typeof title === 'string' ? title : undefined}>
        <div className="drawer__head">
          <div className="drawer__title">{title}</div>
          <button
            className="btn btn--ghost btn--icon btn--sm"
            onClick={onClose}
            style={{ marginLeft: 'auto' }}
            aria-label="Đóng"
            type="button"
          >
            <Icons.X />
          </button>
        </div>
        <div className="drawer__body">{children}</div>
        {foot && <div className="drawer__foot">{foot}</div>}
      </aside>
    </>
  );
}

// --- Modal ---
interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export function Modal({ open, onClose, children }: ModalProps) {
  React.useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <>
      <div className="scrim" onClick={onClose} aria-hidden="true" />
      <div className="modal" role="dialog" aria-modal="true">
        <div className="modal__card">{children}</div>
      </div>
    </>
  );
}

// --- Empty State ---
export function EmptyState({
  icon,
  title,
  sub,
  action,
}: {
  icon?: React.ReactNode;
  title: string;
  sub?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="empty">
      {icon && <div className="empty__icon">{icon}</div>}
      <div className="empty__title">{title}</div>
      {sub && <div className="empty__sub">{sub}</div>}
      {action}
    </div>
  );
}

// Re-export Avatar & Icons
export { Avatar, Icons } from './Icons';

// Re-export Pagination
export { Pagination, usePagination } from './Pagination';
export type { PaginationProps } from './Pagination';
