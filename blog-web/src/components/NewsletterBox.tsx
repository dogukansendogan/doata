import React, { useState } from 'react';
import { Mail, CheckCircle2, Sparkles } from 'lucide-react';
import { useToast } from '../context/ToastContext';

export default function NewsletterBox() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      addToast('Lütfen geçerli bir e-posta adresi giriniz', 'error');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubscribed(true);
      addToast('Tebrikler! Bültene başarıyla abone oldunuz 🎉', 'success');
    }, 600);
  };

  return (
    <div className="newsletter-box glass-card" style={{
      padding: '36px 32px',
      margin: '40px 0',
      background: 'linear-gradient(135deg, rgba(99,102,241,0.06) 0%, rgba(168,85,247,0.06) 100%)',
      border: '1px solid var(--accent-mid)',
      textAlign: 'center',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{
        width: 52, height: 52, borderRadius: '50%',
        background: 'var(--accent)', color: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 16px auto',
        boxShadow: '0 8px 20px rgba(79, 70, 229, 0.3)',
      }}>
        <Mail size={24} />
      </div>

      <h3 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '8px' }}>
        Haftalık Yazılım ve Teknoloji Bülteni
      </h3>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', maxWidth: '480px', margin: '0 auto 24px auto', lineHeight: 1.6 }}>
        En yeni frontend trendleri, mimari makaleler ve özel ipuçları her Salı doğrudan kutunuzda.
      </p>

      {subscribed ? (
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '8px',
          padding: '12px 24px', background: 'rgba(34, 197, 94, 0.12)',
          color: '#16a34a', borderRadius: '30px', fontWeight: 600, fontSize: '0.95rem',
        }}>
          <CheckCircle2 size={18} />
          Abone listemize eklendiniz! Teşekkürler.
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{
          display: 'flex', gap: '10px', justifyContent: 'center',
          maxWidth: '460px', margin: '0 auto', flexWrap: 'wrap',
        }}>
          <input
            type="email"
            placeholder="E-posta adresiniz..."
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="form-input"
            style={{ flex: 1, minWidth: '220px', borderRadius: '25px', padding: '12px 20px' }}
            required
          />
          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
            style={{ borderRadius: '25px', padding: '12px 24px', whiteSpace: 'nowrap' }}
          >
            {loading ? 'Kaydediliyor...' : 'Ücretsiz Abone Ol'}
          </button>
        </form>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginTop: '18px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
        <Sparkles size={13} style={{ color: 'var(--accent)' }} />
        <span>1,500+ yazılımcı ve geliştirici katıldı. İstediğiniz zaman ayrılabilirsiniz.</span>
      </div>
    </div>
  );
}
