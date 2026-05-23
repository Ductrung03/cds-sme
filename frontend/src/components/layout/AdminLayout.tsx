import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Icons, Avatar } from '@/components/ui/Icons';
import { Badge } from '@/components/ui/index';

// ============================================================
// SIDEBAR NAV — Admin Layout
// ============================================================
interface NavItem {
  to: string;
  label: string;
  icon: React.ReactNode;
  end?: boolean;
  badge?: React.ReactNode;
}

const NAV_MAIN: NavItem[] = [
  { to: '/admin', label: 'Tổng quan', icon: <Icons.Grid size={18} />, end: true },
  { to: '/admin/assessments', label: 'Bài khảo sát', icon: <Icons.ClipboardList size={18} /> },
  { to: '/admin/questions', label: 'Quản lý câu hỏi', icon: <Icons.HelpCircle size={18} /> },
  { to: '/admin/appendix', label: 'Phụ lục III', icon: <Icons.Layers size={18} /> },
  { to: '/admin/score-config', label: 'Cấu hình điểm', icon: <Icons.Sliders size={18} /> },
];

const NAV_ANALYTICS: NavItem[] = [
  {
    to: '/admin/ai-review',
    label: 'AI Review',
    icon: <Icons.Sparkles size={18} />,
    badge: <Badge variant="accent" dot>8</Badge>,
  },
  { to: '/admin/reports', label: 'Báo cáo & Kết quả', icon: <Icons.BarChart size={18} /> },
];

function Sidebar() {
  const { user, logout } = useAuth();

  return (
    <aside className="sidebar">
      {/* Brand */}
      <div className="brand">
        <div className="brand__mark">
          <Icons.Diamond size={20} />
        </div>
        <div>
          <div className="brand__name">CDS SME</div>
          <div className="brand__sub">Quản trị hệ thống</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="nav" aria-label="Menu quản trị">
        <div className="nav__label">Vận hành</div>
        {NAV_MAIN.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) => `nav__item${isActive ? ' is-active' : ''}`}
          >
            <span className="ico">{item.icon}</span>
            <span>{item.label}</span>
            {item.badge}
          </NavLink>
        ))}

        <div className="nav__divider" />
        <div className="nav__label">Phân tích</div>
        {NAV_ANALYTICS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `nav__item${isActive ? ' is-active' : ''}`}
          >
            <span className="ico">{item.icon}</span>
            <span>{item.label}</span>
            {item.badge}
          </NavLink>
        ))}
      </nav>

      {/* User card */}
      <div className="sidebar__user">
        <Avatar name={user?.hoTen ?? 'Admin'} size={36} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="name" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user?.hoTen ?? 'Quản trị viên'}
          </div>
          <div className="role" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user?.email ?? 'admin@cds.vn'}
          </div>
        </div>
        <button
          type="button"
          className="icon-btn"
          title="Đăng xuất"
          onClick={logout}
          aria-label="Đăng xuất"
        >
          <Icons.LogOut size={16} />
        </button>
      </div>
    </aside>
  );
}

// ============================================================
// TOPBAR
// ============================================================
function Topbar({ crumbs }: { crumbs: string[] }) {
  return (
    <header className="topbar">
      {/* Breadcrumb */}
      <div className="crumbs">
        {crumbs.map((c, i) => (
          <span key={c} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {i > 0 && <Icons.ChevronRight size={14} style={{ opacity: 0.4 }} />}
            {crumbs.indexOf(c) === crumbs.length - 1 ? <strong>{c}</strong> : <span>{c}</span>}
          </span>
        ))}
      </div>

      {/* Search */}
      <div className="search">
        <Icons.Search size={16} style={{ color: 'var(--text-subtle)', flexShrink: 0 }} />
        <input placeholder="Tìm doanh nghiệp, câu hỏi, giải pháp…" aria-label="Tìm kiếm" />
        <kbd>⌘K</kbd>
      </div>

      {/* Actions */}
      <div className="topbar__actions">
        <button type="button" className="topbar__icon-btn" title="Hướng dẫn" aria-label="Hướng dẫn">
          <Icons.HelpCircle size={18} />
        </button>
        <button type="button" className="topbar__icon-btn" title="Thông báo" aria-label="Thông báo">
          <Icons.Bell size={18} />
          <span className="dot" />
        </button>
        <button type="button" className="topbar__icon-btn" title="Cài đặt" aria-label="Cài đặt">
          <Icons.Settings size={18} />
        </button>
      </div>
    </header>
  );
}

// Breadcrumb mapping từ pathname
function useCrumbs(): string[] {
  const location = useLocation();
  const path = location.pathname;
  if (path === '/admin') return ['Tổng quan'];
  if (path.startsWith('/admin/assessments')) {
    const parts = path.split('/').filter(Boolean);
    return parts.length > 2 ? ['Bài khảo sát', 'Chi tiết'] : ['Bài khảo sát'];
  }
  if (path.startsWith('/admin/questions')) return ['Quản lý câu hỏi'];
  if (path.startsWith('/admin/appendix')) return ['Phụ lục III'];
  if (path.startsWith('/admin/score-config')) return ['Cấu hình điểm'];
  if (path.startsWith('/admin/ai-review')) return ['AI Review'];
  if (path.startsWith('/admin/reports')) return ['Báo cáo & Kết quả'];
  return ['Quản trị'];
}

// ============================================================
// ADMIN LAYOUT ROOT
// ============================================================
export function AdminLayout() {
  const crumbs = useCrumbs();

  return (
    <div className="app">
      <Sidebar />
      <div className="main">
        <Topbar crumbs={crumbs} />
        <Outlet />
      </div>
    </div>
  );
}

// Re-export alias cũ để tương thích với App.tsx
export default AdminLayout;
