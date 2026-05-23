/* global React */
// Shared UI primitives + Icons for CDS SME

// =============================================================================
// ICONS (lucide-style, stroke 1.75)
// =============================================================================
const Icon = ({ d, size = 18, stroke = 1.75, fill = "none", children, style }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill={fill}
    stroke="currentColor"
    strokeWidth={stroke}
    strokeLinecap="round"
    strokeLinejoin="round"
    style={style}
    aria-hidden="true"
  >
    {d ? <path d={d} /> : children}
  </svg>
);

const I = {
  Grid: (p) => (
    <Icon {...p}>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </Icon>
  ),
  ClipboardList: (p) => (
    <Icon {...p}>
      <rect x="8" y="3" width="8" height="4" rx="1" />
      <path d="M8 5H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
      <path d="M8 12h0M12 12h4M8 16h0M12 16h4" />
    </Icon>
  ),
  HelpCircle: (p) => (
    <Icon {...p}>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.5 9a2.5 2.5 0 0 1 5 0c0 1.5-2.5 2-2.5 4" />
      <path d="M12 17h.01" />
    </Icon>
  ),
  Layers: (p) => (
    <Icon {...p}>
      <path d="M12 3 3 8l9 5 9-5-9-5z" />
      <path d="m3 13 9 5 9-5" />
      <path d="m3 18 9 5 9-5" />
    </Icon>
  ),
  Sliders: (p) => (
    <Icon {...p}>
      <line x1="4" y1="6" x2="20" y2="6" />
      <line x1="4" y1="12" x2="20" y2="12" />
      <line x1="4" y1="18" x2="20" y2="18" />
      <circle cx="9" cy="6" r="2" fill="var(--surface)" />
      <circle cx="15" cy="12" r="2" fill="var(--surface)" />
      <circle cx="8" cy="18" r="2" fill="var(--surface)" />
    </Icon>
  ),
  Sparkles: (p) => (
    <Icon {...p}>
      <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" />
      <path d="M12 8.5 13 11l2.5 1-2.5 1-1 2.5-1-2.5L8.5 12 11 11z" fill="currentColor" stroke="none" />
    </Icon>
  ),
  BarChart: (p) => (
    <Icon {...p}>
      <line x1="4" y1="20" x2="20" y2="20" />
      <rect x="6" y="11" width="3" height="9" rx="0.5" />
      <rect x="11" y="6" width="3" height="14" rx="0.5" />
      <rect x="16" y="14" width="3" height="6" rx="0.5" />
    </Icon>
  ),
  Search: (p) => (
    <Icon {...p}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </Icon>
  ),
  Bell: (p) => (
    <Icon {...p}>
      <path d="M6 8a6 6 0 1 1 12 0c0 4 1.5 6 2 7H4c.5-1 2-3 2-7Z" />
      <path d="M10 19a2 2 0 0 0 4 0" />
    </Icon>
  ),
  Settings: (p) => (
    <Icon {...p}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </Icon>
  ),
  LogOut: (p) => (
    <Icon {...p}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </Icon>
  ),
  ChevronRight: (p) => <Icon {...p} d="m9 6 6 6-6 6" />,
  ChevronLeft: (p) => <Icon {...p} d="m15 6-6 6 6 6" />,
  ChevronDown: (p) => <Icon {...p} d="m6 9 6 6 6-6" />,
  Plus: (p) => <Icon {...p} d="M12 5v14M5 12h14" />,
  Filter: (p) => <Icon {...p} d="M3 4h18l-7 9v6l-4 2v-8L3 4z" />,
  Download: (p) => (
    <Icon {...p}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </Icon>
  ),
  Upload: (p) => (
    <Icon {...p}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </Icon>
  ),
  More: (p) => (
    <Icon {...p}>
      <circle cx="5" cy="12" r="1.4" fill="currentColor" />
      <circle cx="12" cy="12" r="1.4" fill="currentColor" />
      <circle cx="19" cy="12" r="1.4" fill="currentColor" />
    </Icon>
  ),
  Eye: (p) => (
    <Icon {...p}>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
    </Icon>
  ),
  Edit: (p) => (
    <Icon {...p}>
      <path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4z" />
    </Icon>
  ),
  Trash: (p) => (
    <Icon {...p}>
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </Icon>
  ),
  Check: (p) => <Icon {...p} d="M5 13l4 4L19 7" />,
  X: (p) => <Icon {...p} d="M6 6l12 12M18 6L6 18" />,
  AlertTriangle: (p) => (
    <Icon {...p}>
      <path d="M10.3 3.86a2 2 0 0 1 3.4 0l8.4 14a2 2 0 0 1-1.7 3H3.6a2 2 0 0 1-1.7-3z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </Icon>
  ),
  Info: (p) => (
    <Icon {...p}>
      <circle cx="12" cy="12" r="9" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </Icon>
  ),
  TrendingUp: (p) => (
    <Icon {...p}>
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
      <polyline points="16 7 22 7 22 13" />
    </Icon>
  ),
  TrendingDown: (p) => (
    <Icon {...p}>
      <polyline points="22 17 13.5 8.5 8.5 13.5 2 7" />
      <polyline points="16 17 22 17 22 11" />
    </Icon>
  ),
  Save: (p) => (
    <Icon {...p}>
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
      <polyline points="17 21 17 13 7 13 7 21" />
      <polyline points="7 3 7 8 15 8" />
    </Icon>
  ),
  Send: (p) => <Icon {...p} d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z" />,
  Diamond: (p) => <Icon {...p} d="M12 2 22 12 12 22 2 12z" />,
  CheckCircle: (p) => (
    <Icon {...p}>
      <circle cx="12" cy="12" r="9" />
      <path d="m8 12 3 3 5-6" />
    </Icon>
  ),
  Clock: (p) => (
    <Icon {...p}>
      <circle cx="12" cy="12" r="9" />
      <polyline points="12 7 12 12 15 14" />
    </Icon>
  ),
  Pencil: (p) => (
    <Icon {...p}>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4z" />
    </Icon>
  ),
  Globe: (p) => (
    <Icon {...p}>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
    </Icon>
  ),
  Building: (p) => (
    <Icon {...p}>
      <rect x="4" y="3" width="16" height="18" rx="1.5" />
      <path d="M8 7h2M14 7h2M8 11h2M14 11h2M8 15h2M14 15h2M10 21v-3h4v3" />
    </Icon>
  ),
  Tag: (p) => (
    <Icon {...p}>
      <path d="m20.6 13.4-7.2 7.2a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8z" />
      <line x1="7" y1="7" x2="7.01" y2="7" />
    </Icon>
  ),
  Star: (p) => <Icon {...p} d="m12 2 3.1 6.3 7 1-5 4.9 1.2 6.9L12 17.8 5.7 21l1.2-6.9-5-4.9 7-1z" />,
  Loader: (p) => (
    <Icon {...p}>
      <line x1="12" y1="2" x2="12" y2="6" />
      <line x1="12" y1="18" x2="12" y2="22" />
      <line x1="4.93" y1="4.93" x2="7.76" y2="7.76" />
      <line x1="16.24" y1="16.24" x2="19.07" y2="19.07" />
      <line x1="2" y1="12" x2="6" y2="12" />
      <line x1="18" y1="12" x2="22" y2="12" />
    </Icon>
  ),
  ArrowRight: (p) => <Icon {...p} d="M5 12h14M13 5l7 7-7 7" />,
  ArrowLeft: (p) => <Icon {...p} d="M19 12H5M12 5l-7 7 7 7" />,
  Bookmark: (p) => <Icon {...p} d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />,
  Cpu: (p) => (
    <Icon {...p}>
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <rect x="9" y="9" width="6" height="6" />
      <path d="M9 1v3M15 1v3M9 20v3M15 20v3M20 9h3M20 14h3M1 9h3M1 14h3" />
    </Icon>
  ),
  Database: (p) => (
    <Icon {...p}>
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M3 5v6c0 1.7 4 3 9 3s9-1.3 9-3V5" />
      <path d="M3 11v6c0 1.7 4 3 9 3s9-1.3 9-3v-6" />
    </Icon>
  ),
};

// =============================================================================
// PRIMITIVES
// =============================================================================
function Button({ children, variant = "primary", size, block, icon, iconRight, ...rest }) {
  const cls = [
    "btn",
    `btn--${variant}`,
    size && `btn--${size}`,
    block && "btn--block",
    !children && icon && "btn--icon",
  ].filter(Boolean).join(" ");
  return (
    <button className={cls} {...rest}>
      {icon}
      {children}
      {iconRight}
    </button>
  );
}

function Badge({ children, variant = "neutral", dot }) {
  return (
    <span className={`badge badge--${variant}`}>
      {dot && <span className="dot" />}
      {children}
    </span>
  );
}

function Stat({ label, value, icon, accent = "primary", delta, deltaDir, progress }) {
  return (
    <div className={`stat stat--${accent}`}>
      <div className={`stat__icon stat__icon--${accent}`}>{icon}</div>
      <div className="stat__label">{label}</div>
      <div className="stat__value">{value}</div>
      {delta && (
        <span className={`stat__delta stat__delta--${deltaDir || "up"}`}>
          {deltaDir === "down" ? <I.TrendingDown size={12} /> : <I.TrendingUp size={12} />}
          {delta}
        </span>
      )}
      <div className="stat__rule" style={{ "--w": (progress ?? 65) + "%" }} />
    </div>
  );
}

function Card({ title, sub, head, action, children, foot, padding = true, className = "" }) {
  return (
    <div className={`card ${className}`}>
      {(title || head) && (
        <div className="card__head">
          <div style={{ flex: 1 }}>
            {title && <div className="card__title">{title}</div>}
            {sub && <div className="card__sub">{sub}</div>}
            {head}
          </div>
          {action}
        </div>
      )}
      <div className={padding ? "card__body" : ""} style={padding ? {} : { padding: 0 }}>
        {children}
      </div>
      {foot && <div className="card__foot">{foot}</div>}
    </div>
  );
}

function RadioCard({ label, hint, checked, onChange, suffix }) {
  return (
    <label className={`radio-card ${checked ? "is-checked" : ""}`} onClick={onChange}>
      <span className="radio-card__dot" />
      <span style={{ flex: 1 }}>
        <div className="radio-card__label">{label}</div>
        {hint && <div className="radio-card__hint">{hint}</div>}
      </span>
      {suffix}
    </label>
  );
}

function CheckCard({ label, hint, checked, onChange }) {
  return (
    <label className={`radio-card ${checked ? "is-checked" : ""}`} onClick={onChange}>
      <span className={`checkbox ${checked ? "is-checked" : ""}`} />
      <span style={{ flex: 1 }}>
        <div className="radio-card__label">{label}</div>
        {hint && <div className="radio-card__hint">{hint}</div>}
      </span>
    </label>
  );
}

function Toggle({ on, onChange }) {
  return <button className={`toggle ${on ? "is-on" : ""}`} onClick={onChange} aria-pressed={on} />;
}

function Tabs({ items, value, onChange }) {
  return (
    <div className="tabs">
      {items.map((it) => (
        <button
          key={it.value}
          className={`tab ${value === it.value ? "is-active" : ""}`}
          onClick={() => onChange(it.value)}
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

function Chip({ active, count, children, onClick }) {
  return (
    <button className={`chip ${active ? "is-active" : ""}`} onClick={onClick}>
      {children}
      {count != null && <span className="chip__count">{count}</span>}
    </button>
  );
}

function Progress({ value, variant }) {
  return (
    <div className={`progress ${variant ? "progress--" + variant : ""}`}>
      <div className="progress__bar" style={{ width: Math.max(0, Math.min(100, value)) + "%" }} />
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    draft: { v: "warning", t: "Nháp", d: true },
    submitted: { v: "accent", t: "Đã nộp", d: true },
    reviewing: { v: "info", t: "Chờ duyệt", d: true },
    scored: { v: "primary", t: "Đã chấm điểm", d: true },
    published: { v: "success", t: "Đã công bố", d: true },
  };
  const c = map[status] || { v: "neutral", t: status };
  return <Badge variant={c.v} dot={c.d}>{c.t}</Badge>;
}

function Drawer({ open, onClose, title, children, foot, width = 540 }) {
  if (!open) return null;
  return (
    <>
      <div className="scrim" onClick={onClose} />
      <aside className="drawer" style={{ width }}>
        <div className="drawer__head">
          <div className="drawer__title">{title}</div>
          <button className="btn btn--ghost btn--icon btn--sm" onClick={onClose} style={{ marginLeft: "auto" }}>
            <I.X />
          </button>
        </div>
        <div className="drawer__body">{children}</div>
        {foot && <div className="drawer__foot">{foot}</div>}
      </aside>
    </>
  );
}

function Modal({ open, onClose, children }) {
  if (!open) return null;
  return (
    <>
      <div className="scrim" onClick={onClose} />
      <div className="modal">
        <div className="modal__card">{children}</div>
      </div>
    </>
  );
}

// Avatar
function Avatar({ name, size = 36, color }) {
  const initials = (name || "?").split(" ").map((s) => s[0]).slice(-2).join("").toUpperCase();
  return (
    <div
      className="avatar"
      style={{
        width: size, height: size,
        fontSize: size * 0.36,
        background: color || undefined,
      }}
    >
      {initials}
    </div>
  );
}

// Expose
Object.assign(window, {
  I, Icon, Button, Badge, Stat, Card,
  RadioCard, CheckCard, Toggle, Tabs, Chip, Progress,
  StatusBadge, Drawer, Modal, Avatar,
});
