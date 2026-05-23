import { useAuth } from '@/contexts/AuthContext';
import { Outlet, Link } from 'react-router-dom';
import { Icons, Avatar } from '@/components/ui/Icons';

// ============================================================
// USER LAYOUT — Topbar glass + Outlet
// ============================================================
export function Layout() {
  const { user, logout } = useAuth();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--surface-page)' }}>
      {/* Topbar glass */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          padding: '0 32px',
          height: 64,
          background: 'rgba(255,255,255,0.8)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderBottom: '1px solid var(--border)',
          position: 'sticky',
          top: 0,
          zIndex: 20,
        }}
      >
        {/* Brand */}
        <Link
          to={user?.role === 'admin' ? '/admin' : '/'}
          style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none' }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              display: 'grid',
              placeItems: 'center',
              borderRadius: 10,
              background: 'linear-gradient(135deg, var(--accent) 0%, oklch(0.62 0.16 50) 100%)',
              color: '#fff',
              boxShadow: 'var(--sh-md)',
              flexShrink: 0,
              position: 'relative',
            }}
          >
            <Icons.Diamond size={18} />
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, color: 'var(--text)', letterSpacing: '-0.01em' }}>
              CDS SME
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>
              Đánh giá Chuyển đổi số
            </div>
          </div>
        </Link>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* User section */}
        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Avatar name={user.hoTen} size={34} />
              <div style={{ lineHeight: 1.3 }}>
                <div style={{
                  fontSize: 13, fontWeight: 600, color: 'var(--text)',
                  whiteSpace: 'nowrap', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                  {user.hoTen}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  {user.tenDoanhnghiep ?? 'Doanh nghiệp'}
                </div>
              </div>
            </div>
            <div style={{ width: 1, height: 28, background: 'var(--border)', margin: '0 4px' }} />
            <button
              type="button"
              onClick={logout}
              aria-label="Đăng xuất"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '7px 12px',
                borderRadius: 'var(--r-md)',
                border: '1px solid var(--border-strong)',
                background: '#fff',
                color: 'var(--text-muted)',
                fontSize: 13,
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all var(--dur)',
              }}
            >
              <Icons.LogOut size={14} />
              Đăng xuất
            </button>
          </div>
        )}
      </header>

      {/* Main content */}
      <main style={{ flex: 1 }}>
        <Outlet />
      </main>

      {/* Footer */}
      <footer
        style={{
          padding: '20px 32px',
          borderTop: '1px solid var(--border)',
          background: 'var(--surface)',
          textAlign: 'center',
          fontSize: 12,
          color: 'var(--text-subtle)',
        }}
      >
        © 2026 Hệ thống Đánh giá Mức độ Chuyển đổi số — Doanh nghiệp Vừa và Nhỏ
      </footer>
    </div>
  );
}
