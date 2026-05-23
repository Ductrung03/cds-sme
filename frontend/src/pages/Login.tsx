import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Icons } from '@/components/ui/Icons';

// ============================================================
// LOGIN PAGE — CDS SME Design
// ============================================================
export function Login() {
  const { login, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [matKhau, setMatKhau] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email.trim() || !matKhau) {
      setError('Vui lòng nhập đầy đủ email và mật khẩu.');
      return;
    }
    try {
      await login(email.trim().toLowerCase(), matKhau);
    } catch (err: unknown) {
      setError(
        (err as { message?: string })?.message ??
          'Đăng nhập không thành công. Vui lòng kiểm tra lại.'
      );
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--surface-page)',
      padding: '24px 16px',
    }}>
      {/* Card */}
      <div style={{
        width: '100%',
        maxWidth: 440,
        background: 'var(--surface)',
        borderRadius: 'var(--r-xl)',
        border: '1px solid var(--border)',
        boxShadow: 'var(--sh-lg)',
        overflow: 'hidden',
      }}>
        {/* Header strip */}
        <div style={{
          padding: '32px 36px 24px',
          background: `linear-gradient(160deg, oklch(0.43 0.075 200 / 0.06) 0%, transparent 100%)`,
          borderBottom: '1px solid var(--border)',
        }}>
          {/* Brand mark */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
            <div style={{
              width: 44,
              height: 44,
              display: 'grid',
              placeItems: 'center',
              borderRadius: 12,
              background: 'linear-gradient(135deg, var(--accent) 0%, oklch(0.62 0.16 50) 100%)',
              color: '#fff',
              boxShadow: 'var(--sh-md)',
            }}>
              <Icons.Diamond size={22} />
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 17, color: 'var(--text)', letterSpacing: '-0.01em' }}>
                CDS SME
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>
                Đánh giá Chuyển đổi số
              </div>
            </div>
          </div>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 24,
            fontWeight: 600,
            letterSpacing: '-0.02em',
            color: 'var(--text)',
            margin: 0,
          }}>
            Đăng nhập
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 6, marginBottom: 0 }}>
            Nhập thông tin tài khoản để tiếp tục
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate style={{ padding: '28px 36px 36px' }}>
          {error && (
            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 10,
              padding: '12px 14px',
              borderRadius: 'var(--r-md)',
              background: 'var(--danger-tint)',
              border: '1px solid oklch(0.85 0.06 25)',
              marginBottom: 20,
              fontSize: 13,
              color: 'var(--danger)',
            }}>
              <Icons.AlertTriangle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
              {error}
            </div>
          )}

          {/* Email */}
          <div className="field" style={{ marginBottom: 16 }}>
            <label className="field__label" htmlFor="login-email">
              Địa chỉ email <span className="req" style={{ color: 'var(--danger)' }}>*</span>
            </label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-subtle)', pointerEvents: 'none' }}>
                <Icons.Mail size={16} />
              </span>
              <input
                id="login-email"
                type="email"
                className="input"
                style={{ paddingLeft: 40 }}
                placeholder="ten@doanhnghiep.vn"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>
          </div>

          {/* Password */}
          <div className="field" style={{ marginBottom: 24 }}>
            <label className="field__label" htmlFor="login-pass">
              Mật khẩu <span style={{ color: 'var(--danger)' }}>*</span>
            </label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-subtle)', pointerEvents: 'none' }}>
                <Icons.Lock size={16} />
              </span>
              <input
                id="login-pass"
                type={showPass ? 'text' : 'password'}
                className="input"
                style={{ paddingLeft: 40, paddingRight: 44 }}
                placeholder="Nhập mật khẩu"
                value={matKhau}
                onChange={(e) => setMatKhau(e.target.value)}
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                aria-label={showPass ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                style={{
                  position: 'absolute',
                  right: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-subtle)',
                  cursor: 'pointer',
                  padding: 2,
                  display: 'flex',
                }}
              >
                <Icons.Eye size={16} />
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="btn btn--primary btn--block btn--lg"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Icons.Loader size={16} style={{ animation: 'spin 1s linear infinite' }} />
                Đang đăng nhập…
              </>
            ) : (
              <>
                Đăng nhập
                <Icons.ArrowRight size={16} />
              </>
            )}
          </button>

          {/* Footer */}
          <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-muted)', marginTop: 20, marginBottom: 0 }}>
            Chưa có tài khoản?{' '}
            <Link
              to="/register"
              style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}
            >
              Đăng ký ngay
            </Link>
          </p>
        </form>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
