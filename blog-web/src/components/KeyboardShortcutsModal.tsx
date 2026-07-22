import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Command, X, Search, Bookmark, Home } from 'lucide-react';

export default function KeyboardShortcutsModal() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger hotkeys if typing in inputs/textareas
      const activeTag = document.activeElement?.tagName.toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea' || (document.activeElement as HTMLElement)?.isContentEditable) {
        return;
      }

      if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        e.preventDefault();
        setIsOpen(prev => !prev);
      } else if (e.key === 'Escape') {
        setIsOpen(false);
      } else if (e.key === '/' && !isOpen) {
        e.preventDefault();
        navigate('/arama');
      } else if ((e.key === 'h' || e.key === 'H') && !isOpen) {
        navigate('/');
      } else if ((e.key === 'b' || e.key === 'B') && !isOpen) {
        navigate('/kaydedilenler');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, navigate]);

  if (!isOpen) return null;

  const shortcuts = [
    { key: '?', description: 'Klavye kısayolları menüsünü aç / kapat', icon: Command },
    { key: '/', description: 'Hızlı Arama sayfasına git', icon: Search },
    { key: 'H', description: 'Anasayfaya dön', icon: Home },
    { key: 'B', description: 'Kaydedilen yazılara git', icon: Bookmark },
    { key: 'Esc', description: 'Açık pencereyi / modalı kapat', icon: X },
  ];

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: 'rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(6px)',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        animation: 'fadeIn 0.2s ease-out',
      }}
      onClick={() => setIsOpen(false)}
    >
      <div
        className="glass-card"
        style={{
          width: '100%',
          maxWidth: '520px',
          padding: '28px',
          background: 'var(--card-bg)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
          border: '1px solid var(--accent-mid)',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--accent-light)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Command size={18} />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Klavye Kısayolları</h3>
          </div>
          <button onClick={() => setIsOpen(false)} className="btn-ghost" style={{ padding: '6px' }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {shortcuts.map((sc, i) => {
            const Icon = sc.icon;
            return (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  background: 'var(--bg-color)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--card-border)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                  <Icon size={16} style={{ color: 'var(--text-muted)' }} />
                  <span>{sc.description}</span>
                </div>
                <kbd
                  style={{
                    background: 'var(--card-bg)',
                    border: '1px solid var(--card-border)',
                    boxShadow: '0 2px 0 var(--card-border)',
                    borderRadius: '6px',
                    padding: '4px 10px',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    fontFamily: 'monospace',
                    color: 'var(--accent)',
                  }}
                >
                  {sc.key}
                </kbd>
              </div>
            );
          })}
        </div>

        <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          İpucu: Herhangi bir sayfada klavyenizden <kbd style={{ padding: '2px 6px', borderRadius: '4px', background: 'var(--bg-color)' }}>?</kbd> tuşuna basarak bu rehberi açabilirsiniz.
        </div>
      </div>
    </div>
  );
}
