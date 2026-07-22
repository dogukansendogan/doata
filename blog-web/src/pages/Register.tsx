import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { UserPlus, User, Mail, Lock, ArrowRight, CheckCircle, Globe } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { isValidEmail, isStrongPassword, sanitizeString } from '../security/sanitizer';

const PERKS = [
  'Beğeni ve yorum yapabilirsiniz',
  'Yazıları kaydedebilirsiniz',
  'Yazı arşivine erişebilirsiniz',
];

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { registerWithEmail, loginWithGoogle } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      addToast('Lütfen tüm alanları doldurun', 'error');
      return;
    }

    // Email structure check
    if (!isValidEmail(email)) {
      addToast('Geçersiz e-posta adresi biçimi.', 'error');
      return;
    }

    // Password strength check
    if (!isStrongPassword(password)) {
      addToast('Şifre en az 8 karakter uzunluğunda olmalı, en az 1 harf ve 1 rakam içermelidir.', 'error');
      return;
    }

    setLoading(true);
    try {
      const cleanName = sanitizeString(name);
      const err = await registerWithEmail(cleanName, email, password);
      if (err) {
        addToast(err, 'error');
      } else {
        addToast(`Hoş geldiniz, ${cleanName}! Hesabınız oluşturuldu 🎉`, 'success');
        navigate('/');
      }
    } catch (error) {
      console.error(error);
      addToast('Kayıt yapılırken bir hata oluştu', 'error');
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
        addToast('Google ile başarıyla kayıt olundu 🔑', 'success');
        navigate('/');
      }
    } catch (error) {
      console.error(error);
      addToast('Google ile kayıt başarısız oldu.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fade-in-up" style={{ maxWidth: '800px', margin: '60px auto' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', alignItems: 'start' }}>
        {/* Left: Perks info */}
        <div style={{ padding: '40px 0' }}>
          <span style={{
            display: 'inline-block', fontSize: '0.72rem', fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: '0.12em',
            color: 'var(--accent)', marginBottom: '16px',
          }}>
            Ücretsiz Kayıt
          </span>
          <h1 style={{ fontSize: '2rem', marginBottom: '12px', lineHeight: 1.2 }}>
            Topluluğa<br />Katıl
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.7, marginBottom: '32px' }}>
            Hesap oluşturarak Doata topluluğuna katılın ve içeriklerle etkileşime geçin.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {PERKS.map(perk => (
              <div key={perk} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <CheckCircle size={18} style={{ color: 'var(--success)', flexShrink: 0 }} />
                <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{perk}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Register Form */}
        <div className="glass-card">
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <div style={{
              display: 'inline-flex', padding: '14px', borderRadius: '50%',
              background: 'var(--accent-light)', color: 'var(--accent)',
              marginBottom: '12px',
            }}>
              <UserPlus size={24} />
            </div>
            <h2 style={{ fontSize: '1.4rem', margin: 0 }}>Hesap Oluştur</h2>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Name */}
            <div className="form-group">
              <label className="form-label" htmlFor="name">Ad Soyad</label>
              <div style={{ position: 'relative' }}>
                <User size={16} style={{
                  position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
                  color: 'var(--text-muted)', pointerEvents: 'none',
                }} />
                <input
                  id="name"
                  type="text"
                  className="form-input"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="John Doe"
                  style={{ paddingLeft: '40px' }}
                  required
                  disabled={loading}
                />
              </div>
            </div>

            {/* Email */}
            <div className="form-group">
              <label className="form-label" htmlFor="email">E-posta</label>
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
            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label className="form-label" htmlFor="password">Şifre</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{
                  position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
                  color: 'var(--text-muted)', pointerEvents: 'none',
                }} />
                <input
                  id="password"
                  type="password"
                  className="form-input"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  style={{ paddingLeft: '40px' }}
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
              style={{ width: '100%', padding: '12px', fontSize: '0.95rem', gap: '8px', justifyContent: 'center' }}
            >
              {loading ? 'Hesap Oluşturuluyor...' : 'Kayıt Ol'} <ArrowRight size={16} />
            </button>
          </form>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', margin: '16px 0', gap: '10px' }}>
            <div style={{ flex: 1, height: '1px', background: 'var(--card-border)' }} />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>veya</span>
            <div style={{ flex: 1, height: '1px', background: 'var(--card-border)' }} />
          </div>

          {/* Google Register Button */}
          <button
            onClick={handleGoogleLogin}
            type="button"
            disabled={loading}
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--card-border)',
              background: 'var(--bg-color)',
              color: 'var(--text-primary)',
              fontSize: '0.85rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              cursor: 'pointer',
              transition: 'background 0.2s',
            }}
            onMouseOver={e => (e.currentTarget.style.background = 'var(--card-border)')}
            onMouseOut={e => (e.currentTarget.style.background = 'var(--bg-color)')}
          >
            <Globe size={16} style={{ color: '#ea4335' }} />
            Google ile Kayıt Ol
          </button>

          <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Zaten üye misiniz?{' '}
            <Link to="/login" style={{ color: 'var(--accent)', fontWeight: 600 }}>
              Giriş Yap
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
