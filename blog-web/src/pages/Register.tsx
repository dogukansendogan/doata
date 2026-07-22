import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { UserPlus, User, Mail, Lock, ArrowRight, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const PERKS = [
  'Beğeni ve yorum yapabilirsiniz',
  'Yazıları kaydedebilirsiniz',
  'Yazı arşivine erişebilirsiniz',
];

import { isValidEmail, isStrongPassword, sanitizeString } from '../security/sanitizer';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
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

    const cleanName = sanitizeString(name);
    const err = login(cleanName, email);
    if (err) {
      addToast(err, 'error');
      return;
    }

    addToast(`Hoş geldiniz, ${cleanName}! Hesabınız oluşturuldu 🎉`, 'success');
    navigate('/');
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

          <div style={{
            marginTop: '40px', padding: '20px',
            background: 'var(--accent-light)', borderRadius: 'var(--radius-md)',
            border: '1px solid var(--accent-mid)',
          }}>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              <strong style={{ color: 'var(--accent)' }}>Not:</strong> Yazı oluşturma yetkisi yalnızca yöneticilere aittir. Üyeler yorum yapabilir ve beğenebilir.
            </p>
          </div>
        </div>

        {/* Right: Form */}
        <div className="glass-card">
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <div style={{
              display: 'inline-flex', padding: '14px', borderRadius: '50%',
              background: 'var(--accent-light)', color: 'var(--accent)', marginBottom: '14px',
            }}>
              <UserPlus size={26} />
            </div>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '4px' }}>Hesap Oluştur</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Formu doldurun, hemen başlayın</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="name">Ad Soyad</label>
              <div style={{ position: 'relative' }}>
                <User size={15} style={{
                  position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)',
                  color: 'var(--text-muted)', pointerEvents: 'none',
                }} />
                <input
                  id="name"
                  type="text"
                  className="form-input"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Adınız Soyadınız"
                  style={{ paddingLeft: '38px' }}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="email">E-posta</label>
              <div style={{ position: 'relative' }}>
                <Mail size={15} style={{
                  position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)',
                  color: 'var(--text-muted)', pointerEvents: 'none',
                }} />
                <input
                  id="email"
                  type="email"
                  className="form-input"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="ornek@mail.com"
                  style={{ paddingLeft: '38px' }}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="password">Şifre</label>
              <div style={{ position: 'relative' }}>
                <Lock size={15} style={{
                  position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)',
                  color: 'var(--text-muted)', pointerEvents: 'none',
                }} />
                <input
                  id="password"
                  type="password"
                  className="form-input"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="En az 8 karakter"
                  style={{ paddingLeft: '38px' }}
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn-primary"
              style={{ width: '100%', padding: '13px', fontSize: '0.95rem', marginTop: '4px' }}
            >
              Kayıt Ol <ArrowRight size={17} />
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
            Zaten hesabınız var mı?{' '}
            <Link to="/login" style={{ color: 'var(--accent)', fontWeight: 600 }}>Giriş Yap</Link>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 640px) {
          .register-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
