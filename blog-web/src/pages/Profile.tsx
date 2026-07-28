import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogOut, Bookmark, Heart, Eye, Shield, PenSquare, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import type { Post } from '../types';
import { getBookmarkedPosts, getPostsByAuthor, getPosts, getUserProfile, requestAdminRole } from '../api/posts';

function StatBadge({ icon, label, value }: { icon: React.ReactNode; label: string; value: number | string }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px',
      padding: '20px 24px',
      background: 'var(--card-bg)', border: '1px solid var(--card-border)',
      borderRadius: 'var(--radius-md)', flex: 1, minWidth: '100px',
      boxShadow: 'var(--shadow-xs)',
    }}>
      <div style={{ color: 'var(--accent)' }}>{icon}</div>
      <span style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
        {value}
      </span>
      <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)' }}>
        {label}
      </span>
    </div>
  );
}

export default function Profile() {
  const { user, logout, isAdmin } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [bookmarks, setBookmarks] = useState<Post[]>([]);
  const [myPosts, setMyPosts] = useState<Post[]>([]);
  const [allPosts, setAllPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'bookmarks' | 'activity'>('bookmarks');
  const [requestStatus, setRequestStatus] = useState<'none' | 'pending' | 'approved' | 'rejected'>('none');
  const [requestLoading, setRequestLoading] = useState(false);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    const fetchData = async () => {
      try {
        const [bm, mp, ap, up] = await Promise.all([
          getBookmarkedPosts(),
          getPostsByAuthor(user.name),
          getPosts(),
          getUserProfile(user.id)
        ]);
        setBookmarks(bm);
        setMyPosts(mp);
        setAllPosts(ap);
        if (up) {
          setRequestStatus(up.adminRequestStatus || 'none');
        }
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetchData();
  }, [user, navigate]);

  const handleRequestAdmin = async () => {
    if (!user) return;
    setRequestLoading(true);
    try {
      const success = await requestAdminRole(user.id);
      if (success) {
        setRequestStatus('pending');
        addToast('Yönetici/Yazar yetki talebiniz başarıyla gönderildi. Onay bekleniyor.', 'success');
      } else {
        addToast('Talep gönderilirken bir hata oluştu.', 'error');
      }
    } catch (e) {
      console.error(e);
      addToast('Talep gönderilirken hata oluştu.', 'error');
    } finally {
      setRequestLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    addToast('Başarıyla çıkış yaptınız', 'info');
    navigate('/');
  };

  if (!user) return null;

  const totalLiked = allPosts.filter(p => p.isLiked).length;

  return (
    <div className="profile-page fade-in" style={{ maxWidth: '860px', margin: '0 auto' }}>
      {/* Profile Hero Card */}
      <div className="glass-card" style={{ marginBottom: '24px', padding: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            {/* Avatar */}
            <div style={{
              width: 80, height: 80, borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--accent) 0%, var(--accent-hover) 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '2rem', fontWeight: 800, color: '#fff',
              boxShadow: 'var(--shadow-accent)', flexShrink: 0,
              border: '3px solid var(--card-bg)',
              fontFamily: 'var(--font-display)',
            }}>
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                <h1 style={{ fontSize: '1.6rem', margin: 0 }}>{user.name}</h1>
                {isAdmin && (
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: '4px',
                    padding: '2px 10px', borderRadius: 'var(--radius-full)',
                    background: 'var(--accent-light)', color: 'var(--accent)',
                    border: '1px solid var(--accent-mid)', fontSize: '0.72rem',
                    fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em',
                  }}>
                    <Shield size={10} /> Admin
                  </span>
                )}
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>
                {user.email}
              </p>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '4px' }}>
                {isAdmin ? 'Yönetici · İçerik oluşturabilir' : 'Okuyucu · Yorum & beğeni yapabilir'}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
            {isAdmin && (
              <Link to="/admin" className="btn-ghost" style={{ fontSize: '0.85rem' }}>
                <LayoutDashboard size={16} /> Admin Panel
              </Link>
            )}
            {!isAdmin && (
              requestStatus === 'pending' ? (
                <span style={{ 
                  fontSize: '0.78rem', fontWeight: 600, padding: '8px 14px', 
                  borderRadius: 'var(--radius-sm)', border: '1px dashed var(--warning)', 
                  color: 'var(--warning)', background: 'rgba(232,168,56,0.06)'
                }}>
                  Talep Değerlendiriliyor...
                </span>
              ) : requestStatus === 'rejected' ? (
                <button 
                  onClick={handleRequestAdmin} 
                  disabled={requestLoading} 
                  className="btn-primary" 
                  style={{ fontSize: '0.85rem', padding: '10px 18px', background: 'var(--accent)', border: 'none' }}
                >
                  {requestLoading ? 'Gönderiliyor...' : 'Yeniden Yetki İste'}
                </button>
              ) : (
                <button 
                  onClick={handleRequestAdmin} 
                  disabled={requestLoading} 
                  className="btn-primary" 
                  style={{ fontSize: '0.85rem', padding: '10px 18px' }}
                >
                  {requestLoading ? 'Gönderiliyor...' : 'Yazar Yetkisi İste'}
                </button>
              )
            )}
            <button
              onClick={handleLogout}
              className="btn-ghost"
              style={{ color: 'var(--danger)', borderColor: 'rgba(211,69,69,0.2)', fontSize: '0.85rem' }}
            >
              <LogOut size={16} /> Çıkış Yap
            </button>
          </div>
        </div>

        {/* Stats row */}
        <div style={{ display: 'flex', gap: '12px', marginTop: '28px', flexWrap: 'wrap' }}>
          <StatBadge icon={<Bookmark size={18} />} label="Kayıt" value={bookmarks.length} />
          <StatBadge icon={<Heart size={18} />} label="Beğeni" value={totalLiked} />
          <StatBadge icon={<Eye size={18} />} label="Yazı" value={allPosts.length} />
          {isAdmin && (
            <StatBadge icon={<PenSquare size={18} />} label="Yazılarım" value={myPosts.length} />
          )}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', background: 'var(--card-bg)', padding: '6px', borderRadius: 'var(--radius-md)', border: '1px solid var(--card-border)' }}>
        {[
          { key: 'bookmarks', label: '🔖 Kaydedilenler', count: bookmarks.length },
          { key: 'activity', label: '⚡ Aktivite' },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as typeof activeTab)}
            style={{
              flex: 1, padding: '10px 16px', borderRadius: 'var(--radius-sm)',
              border: 'none', cursor: 'pointer', fontFamily: 'var(--font-sans)',
              fontWeight: 600, fontSize: '0.88rem', transition: 'all 0.2s',
              background: activeTab === tab.key ? 'var(--accent)' : 'transparent',
              color: activeTab === tab.key ? '#fff' : 'var(--text-secondary)',
            }}
          >
            {tab.label} {tab.count !== undefined && `(${tab.count})`}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {loading ? (
        <div className="loading">Yükleniyor...</div>
      ) : activeTab === 'bookmarks' ? (
        <div>
          {bookmarks.length === 0 ? (
            <div className="glass-card" style={{ textAlign: 'center', padding: '60px 40px' }}>
              <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🔖</div>
              <h3 style={{ marginBottom: '8px' }}>Henüz kaydettiğiniz yazı yok</h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '20px', fontSize: '0.9rem' }}>
                Yazıları okurken 🔖 butonuna tıklayarak kaydedebilirsiniz.
              </p>
              <Link to="/" className="btn-primary">Yazılara Göz At</Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {bookmarks.map(post => (
                <Link
                  key={post.id}
                  to={`/post/${post.id}`}
                  style={{
                    display: 'grid', gridTemplateColumns: '80px 1fr',
                    gap: '16px', background: 'var(--card-bg)',
                    border: '1px solid var(--card-border)', borderRadius: 'var(--radius-md)',
                    padding: '16px', color: 'inherit', textDecoration: 'none',
                    transition: 'all 0.2s',
                  }}
                  onMouseOver={e => {
                    (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent-mid)';
                    (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)';
                    (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-sm)';
                  }}
                  onMouseOut={e => {
                    (e.currentTarget as HTMLElement).style.borderColor = 'var(--card-border)';
                    (e.currentTarget as HTMLElement).style.transform = 'none';
                    (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                  }}
                >
                  {post.coverImage ? (
                    <img src={post.coverImage} alt={post.title} style={{ width: 80, height: 60, objectFit: 'cover', borderRadius: 'var(--radius-sm)' }} />
                  ) : (
                    <div style={{ width: 80, height: 60, background: 'var(--accent-light)', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>📝</div>
                  )}
                  <div>
                    <span className="badge" style={{ marginBottom: '6px', fontSize: '0.68rem' }}>{post.category}</span>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '4px', lineHeight: 1.3 }}>{post.title}</h3>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      {post.author} · {new Date(post.createdAt).toLocaleDateString('tr-TR')} · {post.readingTime} dk
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Activity tab */
        <div className="glass-card-static">
          <h3 style={{ marginBottom: '20px', fontFamily: 'var(--font-sans)', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-secondary)' }}>
            Son Aktiviteler
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {bookmarks.slice(0, 3).map(post => (
              <div key={post.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 0', borderBottom: '1px solid var(--card-border)' }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(194,89,52,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Bookmark size={14} style={{ color: 'var(--accent)' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '0.85rem', margin: 0 }}>
                    <strong>"{post.title}"</strong> kaydedildi
                  </p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {new Date(post.createdAt).toLocaleDateString('tr-TR')}
                  </p>
                </div>
              </div>
            ))}
            {bookmarks.length === 0 && (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', padding: '20px' }}>
                Henüz aktivite yok.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}


