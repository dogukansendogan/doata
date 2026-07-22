import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      addToast('Lütfen tüm alanları doldurun', 'error');
      return;
    }
    const name = email.split('@')[0];
    const displayName = name.charAt(0).toUpperCase() + name.slice(1);
    const err = login(displayName, email);
    if (err) {
      addToast(err, 'error');
      return;
    }
    addToast(`Hoş geldiniz, ${displayName}! 👋`, 'success');
    navigate('/');
  };

  const handleQuickAdmin = () => {
    const err = login('Admin', 'admin@doata.com');
    if (err) {
      addToast(err, 'error');
      return;
    }
    addToast('Admin olarak giriş yapıldı 🔑', 'success');
    navigate('/');
  };

  const handleQuickUser = () => {
    const err = login('Zeynep', 'zeynep@mail.com');
    if (err) {
      addToast(err, 'error');
      return;
    }
    addToast('Kullanıcı olarak giriş yapıldı 👤', 'success');
    navigate('/');
  };

  return (
    <div className="fade-in-up" style={{ maxWidth: '420px', margin: '60px auto' }}>
      {/* Card */}
      <div className="glass-card">
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            display: 'inline-flex', padding: '16px', borderRadius: '50%',
            background: 'var(--accent-light)', color: 'var(--accent)',
            marginBottom: '16px',
          }}>
            <Lock size={28} />
          </div>
          <h1 style={{ fontSize: '1.75rem', marginBottom: '6px' }}>Giriş Yap</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Hesabınıza giriş yaparak yorum ve beğeni yapabilirsiniz.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Email */}
          <div className="form-group">
            <label className="form-label" htmlFor="email">
              E-posta
            </label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{
                position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
                color: 'var(--text-muted)', pointerEvents: 'none',
              }} />
              <input
                id="email"
                type="email"
                className="form-input"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="ornek@mail.com"
                style={{ paddingLeft: '40px' }}
              />
            </div>
          </div>

          {/* Password */}
          <div className="form-group">
            <label className="form-label" htmlFor="password">
              Şifre
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{
                position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
                color: 'var(--text-muted)', pointerEvents: 'none',
              }} />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{ paddingLeft: '40px', paddingRight: '44px' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--text-muted)', padding: '4px',
                }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn-primary"
            style={{ width: '100%', padding: '14px', fontSize: '1rem', gap: '8px' }}
          >
            Giriş Yap <ArrowRight size={18} />
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
          Hesabınız yok mu?{' '}
          <Link to="/register" style={{ color: 'var(--accent)', fontWeight: 600 }}>
            Kayıt Ol
          </Link>
        </div>

        {/* Demo login buttons */}
        <div style={{
          marginTop: '28px', paddingTop: '24px',
          borderTop: '1px solid var(--card-border)',
        }}>
          <p style={{
            fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase',
            letterSpacing: '0.1em', color: 'var(--text-muted)',
            textAlign: 'center', marginBottom: '12px',
          }}>
            Demo Girişleri
          </p>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              onClick={handleQuickAdmin}
              style={{
                flex: 1, padding: '10px', borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--accent-mid)',
                background: 'var(--accent-light)', color: 'var(--accent)',
                cursor: 'pointer', fontFamily: 'var(--font-sans)',
                fontWeight: 600, fontSize: '0.82rem', transition: 'all 0.2s',
              }}
            >
              🔑 Admin
            </button>
            <button
              type="button"
              onClick={handleQuickUser}
              style={{
                flex: 1, padding: '10px', borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--card-border)',
                background: 'transparent', color: 'var(--text-secondary)',
                cursor: 'pointer', fontFamily: 'var(--font-sans)',
                fontWeight: 600, fontSize: '0.82rem', transition: 'all 0.2s',
              }}
            >
              👤 Kullanıcı
            </button>
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '10px' }}>
            Sadece admin yazı ekleyebilir. Üyeler yorum & beğeni yapabilir.
          </p>
        </div>
      </div>
    </div>
  );
}
