import { Link, useNavigate } from 'react-router-dom';
import { PenSquare, LayoutDashboard, Bookmark, Search, LogOut, User, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import ThemeToggle from './ThemeToggle';
import { useAuth } from '../context/AuthContext';

const NAV_LINKS = [
  { label: 'Teknoloji', path: '/kategori/teknoloji' },
  { label: 'Tasarım', path: '/kategori/tasarim' },
  { label: 'Yazılım', path: '/kategori/yazilim' },
  { label: 'Kariyer', path: '/kategori/kariyer' },
];

export default function Header() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setMenuOpen(false);
    navigate('/');
  };

  return (
    <header className="glass" style={{
      position: 'sticky',
      top: 0,
      zIndex: 200,
    }}>
      <div className="container" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '14px 24px',
        gap: '16px',
      }}>
        {/* Logo */}
        <Link to="/" style={{
          fontFamily: 'var(--font-display)',
          fontSize: '1.5rem',
          fontWeight: 900,
          background: 'linear-gradient(135deg, var(--text-primary) 0%, var(--accent) 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          textDecoration: 'none',
          flexShrink: 0,
          letterSpacing: '-0.03em',
        }}>
          Doata
        </Link>

        {/* Category Nav */}
        <nav className="hide-on-mobile" style={{
          display: 'flex',
          gap: '4px',
          alignItems: 'center',
        }}>
          {NAV_LINKS.map(link => (
            <Link
              key={link.path}
              to={link.path}
              style={{
                padding: '6px 12px',
                fontSize: '0.85rem',
                fontWeight: 500,
                color: 'var(--text-secondary)',
                borderRadius: 'var(--radius-sm)',
                transition: 'all 0.2s',
              }}
              onMouseOver={e => {
                (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)';
                (e.currentTarget as HTMLElement).style.background = 'var(--accent-light)';
              }}
              onMouseOut={e => {
                (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)';
                (e.currentTarget as HTMLElement).style.background = 'transparent';
              }}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right Side Actions */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexShrink: 0 }}>
          <Link
            to="/arama"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '36px',
              height: '36px',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-secondary)',
              transition: 'all 0.2s',
            }}
            onMouseOver={e => {
              (e.currentTarget as HTMLElement).style.background = 'var(--accent-light)';
              (e.currentTarget as HTMLElement).style.color = 'var(--accent)';
            }}
            onMouseOut={e => {
              (e.currentTarget as HTMLElement).style.background = 'transparent';
              (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)';
            }}
            title="Ara"
          >
            <Search size={18} />
          </Link>

          <div style={{ width: '1px', height: '24px', background: 'var(--card-border)' }} />

          <ThemeToggle />

          {user ? (
            <>
              {/* Bookmarks (all users) */}
              <Link
                to="/kaydedilenler"
                className="hide-on-mobile btn-ghost"
                style={{ padding: '8px 14px', fontSize: '0.85rem' }}
                title="Kaydedilenler"
              >
                <Bookmark size={16} />
                <span>Kaydedilenler</span>
              </Link>

              {/* Admin: Write button */}
              {isAdmin && (
                <Link to="/create" className="btn-primary" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
                  <PenSquare size={16} />
                  <span className="hide-on-mobile">Yeni Yazı</span>
                </Link>
              )}

              {/* User dropdown */}
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '7px',
                    padding: '6px 10px',
                    border: '1px solid var(--card-border)',
                    borderRadius: 'var(--radius-sm)',
                    background: menuOpen ? 'var(--accent-light)' : 'transparent',
                    cursor: 'pointer',
                    color: 'var(--text-primary)',
                    transition: 'all 0.2s',
                    fontFamily: 'var(--font-sans)',
                    fontSize: '0.85rem',
                    fontWeight: 500,
                  }}
                >
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.name}
                      style={{ width: 24, height: 24, borderRadius: '50%', objectFit: 'cover' }}
                    />
                  ) : (
                    <div style={{
                      width: 24, height: 24, borderRadius: '50%',
                      background: 'var(--accent)', color: '#fff',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.72rem', fontWeight: 700,
                    }}>
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="hide-on-mobile">{user.name}</span>
                  {isAdmin && (
                    <span style={{
                      fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase',
                      letterSpacing: '0.06em', color: 'var(--accent)',
                      background: 'var(--accent-light)', padding: '2px 6px',
                      borderRadius: 'var(--radius-full)', border: '1px solid var(--accent-mid)',
                    }}>
                      Admin
                    </span>
                  )}
                  <ChevronDown size={14} style={{ transform: menuOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                </button>

                {menuOpen && (
                  <div style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    right: 0,
                    background: 'var(--card-bg)',
                    border: '1px solid var(--card-border)',
                    borderRadius: 'var(--radius-md)',
                    boxShadow: 'var(--shadow-md)',
                    padding: '8px',
                    minWidth: '180px',
                    animation: 'fadeInUp 0.2s var(--ease-out-expo) forwards',
                    zIndex: 300,
                  }}>
                    <Link
                      to="/profile"
                      onClick={() => setMenuOpen(false)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '10px',
                        padding: '10px 12px', borderRadius: 'var(--radius-sm)',
                        color: 'var(--text-secondary)', fontSize: '0.88rem', fontWeight: 500,
                        transition: 'all 0.15s',
                      }}
                      onMouseOver={e => {
                        (e.currentTarget as HTMLElement).style.background = 'var(--accent-light)';
                        (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)';
                      }}
                      onMouseOut={e => {
                        (e.currentTarget as HTMLElement).style.background = 'transparent';
                        (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)';
                      }}
                    >
                      <User size={15} /> Profilim
                    </Link>

                    {isAdmin && (
                      <Link
                        to="/admin"
                        onClick={() => setMenuOpen(false)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '10px',
                          padding: '10px 12px', borderRadius: 'var(--radius-sm)',
                          color: 'var(--text-secondary)', fontSize: '0.88rem', fontWeight: 500,
                          transition: 'all 0.15s',
                        }}
                        onMouseOver={e => {
                          (e.currentTarget as HTMLElement).style.background = 'var(--accent-light)';
                          (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)';
                        }}
                        onMouseOut={e => {
                          (e.currentTarget as HTMLElement).style.background = 'transparent';
                          (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)';
                        }}
                      >
                        <LayoutDashboard size={15} /> Admin Panel
                      </Link>
                    )}

                    <div style={{ height: '1px', background: 'var(--card-border)', margin: '6px 0' }} />

                    <button
                      onClick={handleLogout}
                      style={{
                        width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
                        padding: '10px 12px', borderRadius: 'var(--radius-sm)',
                        color: 'var(--danger)', fontSize: '0.88rem', fontWeight: 500,
                        background: 'transparent', border: 'none', cursor: 'pointer',
                        textAlign: 'left', transition: 'all 0.15s',
                        fontFamily: 'var(--font-sans)',
                      }}
                      onMouseOver={e => {
                        (e.currentTarget as HTMLElement).style.background = 'rgba(211, 69, 69, 0.08)';
                      }}
                      onMouseOut={e => {
                        (e.currentTarget as HTMLElement).style.background = 'transparent';
                      }}
                    >
                      <LogOut size={15} /> Çıkış Yap
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', gap: '8px' }}>
              <Link to="/login" className="btn-ghost" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
                Giriş Yap
              </Link>
              <Link to="/register" className="btn-primary" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
                Kayıt Ol
              </Link>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .hide-on-mobile { display: none !important; }
        }
      `}</style>
    </header>
  );
}
