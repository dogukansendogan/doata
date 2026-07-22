import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, ArrowRight, Eye, EyeOff, Globe } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { loginWithEmail, loginWithGoogle } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      addToast('Lütfen tüm alanları doldurun', 'error');
      return;
    }
    setLoading(true);
    try {
      const err = await loginWithEmail(email, password);
      if (err) {
        addToast(err, 'error');
      } else {
        addToast(`Hoş geldiniz! 👋`, 'success');
        navigate('/');
      }
    } catch (error) {
      console.error(error);
      addToast('Giriş yapılırken bir hata oluştu', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const err = await loginWithGoogle();
      if (err) {
        addToast(err, 'error');
      } else {
        addToast('Google ile başarıyla giriş yapıldı 🔑', 'success');
        navigate('/');
      }
    } catch (error) {
      console.error(error);
      addToast('Google ile giriş başarısız oldu.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fade-in-up" style={{ maxWidth: '420px', margin: '60px auto' }}>
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
                required
                disabled={loading}
              />
            </div>
          </div>

          {/* Password */}
          <div className="form-group" style={{ marginBottom: '24px' }}>
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
                required
                disabled={loading}
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
            disabled={loading}
            style={{ width: '100%', padding: '14px', fontSize: '1rem', gap: '8px', justifyContent: 'center' }}
          >
            {loading ? 'Giriş Yapılıyor...' : 'Giriş Yap'} <ArrowRight size={18} />
          </button>
        </form>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', margin: '20px 0', gap: '10px' }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--card-border)' }} />
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>veya</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--card-border)' }} />
        </div>

        {/* Google Login Button */}
        <button
          onClick={handleGoogleLogin}
          type="button"
          disabled={loading}
          style={{
            width: '100%',
            padding: '12px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--card-border)',
            background: 'var(--bg-color)',
            color: 'var(--text-primary)',
            fontSize: '0.9rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            cursor: 'pointer',
            transition: 'background 0.2s',
          }}
          onMouseOver={e => (e.currentTarget.style.background = 'var(--card-border)')}
          onMouseOut={e => (e.currentTarget.style.background = 'var(--bg-color)')}
        >
          <Globe size={18} style={{ color: '#ea4335' }} />
          Google ile Giriş Yap
        </button>

        <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
          Hesabınız yok mu?{' '}
          <Link to="/register" style={{ color: 'var(--accent)', fontWeight: 600 }}>
            Kayıt Ol
          </Link>
        </div>
      </div>
    </div>
  );
}
