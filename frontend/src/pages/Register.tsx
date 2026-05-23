import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Icons } from '@/components/ui/Icons';

interface FormErrors {
  hoTen?: string;
  email?: string;
  matKhau?: string;
  xacNhanMatKhau?: string;
}

// ============================================================
// REGISTER PAGE — CDS SME Design
// ============================================================
export function Register() {
  const { register, isLoading } = useAuth();
  const [hoTen, setHoTen] = useState('');
  const [email, setEmail] = useState('');
  const [matKhau, setMatKhau] = useState('');
  const [xacNhanMatKhau, setXacNhanMatKhau] = useState('');
  const [soDienThoai, setSoDienThoai] = useState('');
  const [tenDoanhnghiep, setTenDoanhnghiep] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [serverError, setServerError] = useState('');

  const validate = (): boolean => {
    const next: FormErrors = {};
    if (!hoTen.trim()) next.hoTen = 'Vui lòng nhập họ tên';
    if (!email.trim()) next.email = 'Vui lòng nhập email';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = 'Email không hợp lệ';
    if (!matKhau) next.matKhau = 'Vui lòng nhập mật khẩu';
    else if (matKhau.length < 8) next.matKhau = 'Mật khẩu cần ít nhất 8 ký tự';
    if (matKhau !== xacNhanMatKhau) next.xacNhanMatKhau = 'Mật khẩu xác nhận không khớp';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError('');
    if (!validate()) return;
    try {
      await register({
        email: email.trim().toLowerCase(),
        matKhau,
        hoTen: hoTen.trim(),
        soDienThoai: soDienThoai.trim() || undefined,
        tenDoanhnghiep: tenDoanhnghiep.trim() || undefined,
      });
    } catch (err: unknown) {
      setServerError(
        (err as { message?: string })?.message ??
          'Đăng ký không thành công. Vui lòng kiểm tra lại thông tin.'
      );
    }
  };

  const FieldError = ({ msg }: { msg?: string }) =>
    msg ? (
      <div className="field__error" style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--danger)', marginTop: 4 }}>
        <Icons.AlertTriangle size={12} />
        {msg}
      </div>
    ) : null;

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'center',
      background: 'var(--surface-page)',
      padding: '40px 16px',
    }}>
      <div style={{
        width: '100%',
        maxWidth: 520,
        background: 'var(--surface)',
        borderRadius: 'var(--r-xl)',
        border: '1px solid var(--border)',
        boxShadow: 'var(--sh-lg)',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          padding: '28px 36px 20px',
          background: 'linear-gradient(160deg, oklch(0.43 0.075 200 / 0.06) 0%, transparent 100%)',
          borderBottom: '1px solid var(--border)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <div style={{
              width: 44, height: 44,
              display: 'grid', placeItems: 'center',
              borderRadius: 12,
              background: 'linear-gradient(135deg, var(--accent) 0%, oklch(0.62 0.16 50) 100%)',
              color: '#fff', boxShadow: 'var(--sh-md)',
            }}>
              <Icons.Diamond size={22} />
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 17, color: 'var(--text)', letterSpacing: '-0.01em' }}>CDS SME</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>Đánh giá Chuyển đổi số</div>
            </div>
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em', color: 'var(--text)', margin: 0 }}>
            Đăng ký tài khoản
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4, marginBottom: 0 }}>
            Tạo tài khoản doanh nghiệp để thực hiện đánh giá mức độ chuyển đổi số
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate style={{ padding: '24px 36px 32px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {serverError && (
            <div style={{
              display: 'flex', alignItems: 'flex-start', gap: 10,
              padding: '12px 14px', borderRadius: 'var(--r-md)',
              background: 'var(--danger-tint)', border: '1px solid oklch(0.85 0.06 25)',
              fontSize: 13, color: 'var(--danger)',
            }}>
              <Icons.AlertTriangle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
              {serverError}
            </div>
          )}

          {/* Họ tên */}
          <div className="field">
            <label className="field__label" htmlFor="reg-hoten">
              Họ và tên <span style={{ color: 'var(--danger)' }}>*</span>
            </label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-subtle)', pointerEvents: 'none' }}>
                <Icons.User size={16} />
              </span>
              <input
                id="reg-hoten"
                type="text"
                className={`input${errors.hoTen ? ' input--error' : ''}`}
                style={{ paddingLeft: 40 }}
                placeholder="Nguyễn Văn A"
                value={hoTen}
                onChange={(e) => setHoTen(e.target.value)}
                autoComplete="name"
                required
              />
            </div>
            <FieldError msg={errors.hoTen} />
          </div>

          {/* Email */}
          <div className="field">
            <label className="field__label" htmlFor="reg-email">
              Địa chỉ email <span style={{ color: 'var(--danger)' }}>*</span>
            </label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-subtle)', pointerEvents: 'none' }}>
                <Icons.Mail size={16} />
              </span>
              <input
                id="reg-email"
                type="email"
                className={`input${errors.email ? ' input--error' : ''}`}
                style={{ paddingLeft: 40 }}
                placeholder="lienhe@doanhnghiep.vn"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>
            <FieldError msg={errors.email} />
          </div>

          {/* Password row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="field">
              <label className="field__label" htmlFor="reg-pass">
                Mật khẩu <span style={{ color: 'var(--danger)' }}>*</span>
              </label>
              <input
                id="reg-pass"
                type="password"
                className={`input${errors.matKhau ? ' input--error' : ''}`}
                placeholder="Ít nhất 8 ký tự"
                value={matKhau}
                onChange={(e) => setMatKhau(e.target.value)}
                autoComplete="new-password"
                required
              />
              <FieldError msg={errors.matKhau} />
            </div>
            <div className="field">
              <label className="field__label" htmlFor="reg-pass2">
                Xác nhận mật khẩu <span style={{ color: 'var(--danger)' }}>*</span>
              </label>
              <input
                id="reg-pass2"
                type="password"
                className={`input${errors.xacNhanMatKhau ? ' input--error' : ''}`}
                placeholder="Nhập lại mật khẩu"
                value={xacNhanMatKhau}
                onChange={(e) => setXacNhanMatKhau(e.target.value)}
                autoComplete="new-password"
                required
              />
              <FieldError msg={errors.xacNhanMatKhau} />
            </div>
          </div>

          {/* Số điện thoại */}
          <div className="field">
            <label className="field__label" htmlFor="reg-phone">Số điện thoại</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-subtle)', pointerEvents: 'none' }}>
                <Icons.Phone size={16} />
              </span>
              <input
                id="reg-phone"
                type="tel"
                className="input"
                style={{ paddingLeft: 40 }}
                placeholder="0901 234 567"
                value={soDienThoai}
                onChange={(e) => setSoDienThoai(e.target.value)}
                autoComplete="tel"
              />
            </div>
          </div>

          {/* Tên doanh nghiệp */}
          <div className="field">
            <label className="field__label" htmlFor="reg-company">Tên doanh nghiệp</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-subtle)', pointerEvents: 'none' }}>
                <Icons.Building size={16} />
              </span>
              <input
                id="reg-company"
                type="text"
                className="input"
                style={{ paddingLeft: 40 }}
                placeholder="Công ty TNHH ..."
                value={tenDoanhnghiep}
                onChange={(e) => setTenDoanhnghiep(e.target.value)}
                autoComplete="organization"
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn--primary btn--block btn--lg"
            disabled={isLoading}
            style={{ marginTop: 4 }}
          >
            {isLoading ? (
              <>
                <Icons.Loader size={16} style={{ animation: 'spin 1s linear infinite' }} />
                Đang tạo tài khoản…
              </>
            ) : (
              <>
                Tạo tài khoản
                <Icons.ArrowRight size={16} />
              </>
            )}
          </button>

          <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
            Đã có tài khoản?{' '}
            <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>
              Đăng nhập
            </Link>
          </p>
        </form>
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
