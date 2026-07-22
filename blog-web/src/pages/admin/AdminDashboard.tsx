import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Edit, Trash2, LayoutDashboard, MessageSquare, BarChart2,
  Plus, Eye, Heart, Clock, Search, ArrowLeft, Check, X,
  TrendingUp, FileText, Filter,
} from 'lucide-react';
import type { Post, Comment, DashboardStats } from '../../types';
import { getPosts, deletePost, getDashboardStats, getAllComments, deleteComment } from '../../api/posts';

type ActiveTab = 'posts' | 'comments' | 'analytics';
type SortKey = 'views' | 'likes' | 'date';

export default function AdminDashboard() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<ActiveTab>('posts');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('date');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [postsData, statsData, commentsData] = await Promise.all([
        getPosts(),
        getDashboardStats(),
        getAllComments(),
      ]);
      setPosts(postsData);
      setStats(statsData);
      setComments(commentsData);
    } catch (err) {
      console.error('Veriler alınamadı:', err);
    } finally {
      setLoading(false);
    }
  };

  // --- Posts derived data ---
  const categories = useMemo(() => Array.from(new Set(posts.map(p => p.category))), [posts]);

  const filteredPosts = useMemo(() => {
    let result = [...posts];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(p =>
        p.title.toLowerCase().includes(q) ||
        p.author.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
      );
    }
    if (categoryFilter) {
      result = result.filter(p => p.category === categoryFilter);
    }
    result.sort((a, b) => {
      if (sortKey === 'views') return b.views - a.views;
      if (sortKey === 'likes') return b.likes - a.likes;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    return result;
  }, [posts, searchQuery, categoryFilter, sortKey]);

  // --- Delete post ---
  const confirmDelete = (id: string) => setDeletingId(id);
  const cancelDelete = () => setDeletingId(null);
  const handleDelete = async (id: string) => {
    const success = await deletePost(id);
    if (success) {
      setPosts(prev => prev.filter(p => p.id !== id));
      const newStats = await getDashboardStats();
      setStats(newStats);
    }
    setDeletingId(null);
  };

  // --- Delete comment ---
  const confirmDeleteComment = (id: string) => setDeletingCommentId(id);
  const cancelDeleteComment = () => setDeletingCommentId(null);
  const handleDeleteComment = async (comment: Comment) => {
    const success = await deleteComment(comment.postId, comment.id);
    if (success) {
      setComments(prev => prev.filter(c => c.id !== comment.id));
    }
    setDeletingCommentId(null);
  };

  // --- Analytics ---
  const topPosts = useMemo(() => [...posts].sort((a, b) => b.views - a.views).slice(0, 3), [posts]);
  const maxViews = topPosts[0]?.views || 1;

  const categoryStats = useMemo(() => {
    const map: Record<string, { count: number; likes: number }> = {};
    posts.forEach(p => {
      if (!map[p.category]) map[p.category] = { count: 0, likes: 0 };
      map[p.category].count++;
      map[p.category].likes += p.likes;
    });
    return Object.entries(map).map(([name, data]) => ({ name, ...data }));
  }, [posts]);
  const maxCatCount = Math.max(...categoryStats.map(c => c.count), 1);

  const avgLikeRatio = useMemo(() => {
    if (!posts.length) return 0;
    const total = posts.reduce((sum, p) => sum + (p.views > 0 ? p.likes / p.views : 0), 0);
    return ((total / posts.length) * 100).toFixed(1);
  }, [posts]);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', flexDirection: 'column', gap: '16px' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid var(--accent-mid)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <span style={{ color: 'var(--text-secondary)' }}>Admin paneli yükleniyor...</span>
      </div>
    );
  }

  const statCards = [
    { label: 'Toplam Yazı', value: stats?.totalPosts ?? 0, icon: <FileText size={22} />, color: '#4B6BCC' },
    { label: 'Görüntülenme', value: stats?.totalViews ?? 0, icon: <Eye size={22} />, color: '#C25934' },
    { label: 'Beğeni', value: stats?.totalLikes ?? 0, icon: <Heart size={22} />, color: '#D34545' },
    { label: 'Yorum', value: stats?.totalComments ?? 0, icon: <MessageSquare size={22} />, color: '#3E885B' },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', minHeight: '100vh', gap: 0 }}>

      {/* ====== SIDEBAR ====== */}
      <aside style={{
        background: 'var(--bg-secondary)',
        borderRight: '1px solid var(--card-border)',
        padding: '32px 0',
        display: 'flex',
        flexDirection: 'column',
        gap: 0,
        position: 'sticky',
        top: 0,
        height: '100vh',
        overflowY: 'auto',
      }}>
        {/* Logo */}
        <div style={{ padding: '0 24px 28px', borderBottom: '1px solid var(--card-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '10px',
              background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ color: '#fff', fontWeight: 800, fontSize: '1.1rem', fontFamily: 'var(--font-display)' }}>D</span>
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>Doata Admin</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Yönetim Paneli</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ padding: '20px 16px', flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {([
            { tab: 'posts', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
            { tab: 'posts', label: 'Yazılar', icon: <FileText size={18} /> },
            { tab: 'comments', label: 'Yorumlar', icon: <MessageSquare size={18} /> },
            { tab: 'analytics', label: 'Analizler', icon: <BarChart2 size={18} /> },
          ] as { tab: ActiveTab; label: string; icon: React.ReactNode }[]).map((item, idx) => (
            <button
              key={idx}
              onClick={() => setActiveTab(item.tab)}
              style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '10px 12px', borderRadius: 'var(--radius-sm)',
                background: activeTab === item.tab ? 'var(--accent-light)' : 'transparent',
                color: activeTab === item.tab ? 'var(--accent)' : 'var(--text-secondary)',
                border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left',
                fontWeight: activeTab === item.tab ? 600 : 400,
                fontSize: '0.9rem', transition: 'all 0.2s',
              }}
            >
              {item.icon}
              {item.label}
            </button>
          ))}

          <div style={{ height: '1px', background: 'var(--card-border)', margin: '12px 0' }} />

          <Link
            to="/create"
            className="btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center', fontSize: '0.88rem', padding: '10px 16px' }}
          >
            <Plus size={16} /> Yeni Yazı
          </Link>
        </nav>

        {/* Footer link */}
        <div style={{ padding: '20px 24px', borderTop: '1px solid var(--card-border)' }}>
          <Link
            to="/"
            style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '0.85rem', textDecoration: 'none' }}
          >
            <ArrowLeft size={16} /> Ana Siteye Dön
          </Link>
        </div>
      </aside>

      {/* ====== MAIN CONTENT ====== */}
      <main style={{ padding: '36px 40px', background: 'var(--bg-color)', overflowY: 'auto' }}>

        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '4px' }}>
            {activeTab === 'posts' ? 'Yazı Yönetimi' : activeTab === 'comments' ? 'Yorum Yönetimi' : 'Analizler'}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem' }}>
            {activeTab === 'posts' ? 'Tüm yazılarınızı buradan yönetin' : activeTab === 'comments' ? 'Okuyucu yorumlarını inceleyin ve yönetin' : 'Sitenizin performans analizleri'}
          </p>
        </div>

        {/* Stat Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px' }}>
          {statCards.map((card, i) => (
            <div key={i} className="stat-card" style={{
              display: 'flex', flexDirection: 'column', gap: '10px',
              padding: '20px', position: 'relative', overflow: 'hidden',
            }}>
              <div style={{
                width: '42px', height: '42px', borderRadius: 'var(--radius-sm)',
                background: `${card.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: card.color,
              }}>
                {card.icon}
              </div>
              <div>
                <div className="stat-number" style={{ fontSize: '1.8rem' }}>{card.value.toLocaleString('tr-TR')}</div>
                <div className="stat-label">{card.label}</div>
              </div>
              <div style={{
                position: 'absolute', right: '-10px', bottom: '-10px',
                width: '70px', height: '70px', borderRadius: '50%',
                background: `${card.color}0a`,
              }} />
            </div>
          ))}
        </div>

        {/* Tab bar */}
        <div style={{ display: 'flex', gap: '4px', marginBottom: '24px', borderBottom: '1px solid var(--card-border)', paddingBottom: '0' }}>
          {(['posts', 'comments', 'analytics'] as ActiveTab[]).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '10px 20px', border: 'none', cursor: 'pointer',
                background: 'transparent',
                color: activeTab === tab ? 'var(--accent)' : 'var(--text-secondary)',
                fontWeight: activeTab === tab ? 700 : 500,
                fontSize: '0.9rem',
                borderBottom: activeTab === tab ? '2px solid var(--accent)' : '2px solid transparent',
                marginBottom: '-1px', transition: 'all 0.2s',
              }}
            >
              {tab === 'posts' ? 'Yazılar' : tab === 'comments' ? 'Yorumlar' : 'Analizler'}
            </button>
          ))}
        </div>

        {/* ======= POSTS TAB ======= */}
        {activeTab === 'posts' && (
          <div>
            {/* Filters row */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
                <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  className="form-input"
                  placeholder="Yazı ara..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={{ paddingLeft: '38px' }}
                />
              </div>
              <div style={{ position: 'relative' }}>
                <Filter size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                <select
                  className="form-input"
                  value={categoryFilter}
                  onChange={e => setCategoryFilter(e.target.value)}
                  style={{ paddingLeft: '38px', minWidth: '160px' }}
                >
                  <option value="">Tüm Kategoriler</option>
                  {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Sırala:</span>
                {(['date', 'views', 'likes'] as SortKey[]).map(key => (
                  <button
                    key={key}
                    onClick={() => setSortKey(key)}
                    style={{
                      padding: '6px 14px', borderRadius: 'var(--radius-full)',
                      border: '1px solid var(--card-border)',
                      background: sortKey === key ? 'var(--accent)' : 'var(--card-bg)',
                      color: sortKey === key ? '#fff' : 'var(--text-secondary)',
                      cursor: 'pointer', fontSize: '0.82rem', fontWeight: sortKey === key ? 600 : 400,
                      transition: 'all 0.2s',
                    }}
                  >
                    {key === 'date' ? 'Tarih' : key === 'views' ? 'Görüntülenme' : 'Beğeni'}
                  </button>
                ))}
              </div>
            </div>

            {/* Posts list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {filteredPosts.length === 0 ? (
                <div className="glass-card-static" style={{ textAlign: 'center', padding: '48px', color: 'var(--text-secondary)' }}>
                  Yazı bulunamadı.
                </div>
              ) : filteredPosts.map(post => (
                <div
                  key={post.id}
                  className="glass-card-static"
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '72px 1fr auto',
                    gap: '16px',
                    alignItems: 'center',
                    padding: '16px',
                    transition: 'transform 0.15s, box-shadow 0.15s',
                  }}
                >
                  {/* Thumbnail */}
                  <div style={{
                    width: '72px', height: '52px', borderRadius: 'var(--radius-sm)', overflow: 'hidden',
                    background: 'var(--accent-light)', flexShrink: 0,
                  }}>
                    {post.coverImage
                      ? <img src={post.coverImage} alt={post.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <FileText size={22} style={{ color: 'var(--accent)' }} />
                        </div>
                    }
                  </div>

                  {/* Info */}
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.97rem', color: 'var(--text-primary)', marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {post.title}
                    </div>
                    <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                      <span className="badge">{post.category}</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={12} /> {new Date(post.createdAt).toLocaleDateString('tr-TR')}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Eye size={12} /> {post.views}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Heart size={12} /> {post.likes}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <MessageSquare size={12} /> {post.comments.length}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0 }}>
                    {deletingId === post.id ? (
                      <>
                        <span style={{ fontSize: '0.82rem', color: 'var(--danger)', fontWeight: 600 }}>Silmek istiyor musunuz?</span>
                        <button
                          onClick={() => handleDelete(post.id)}
                          style={{
                            padding: '6px 10px', borderRadius: 'var(--radius-sm)',
                            background: 'var(--danger)', border: 'none', color: '#fff',
                            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.82rem',
                          }}
                        >
                          <Check size={14} /> Evet
                        </button>
                        <button
                          onClick={cancelDelete}
                          style={{
                            padding: '6px 10px', borderRadius: 'var(--radius-sm)',
                            background: 'var(--card-bg)', border: '1px solid var(--card-border)', color: 'var(--text-secondary)',
                            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.82rem',
                          }}
                        >
                          <X size={14} /> İptal
                        </button>
                      </>
                    ) : (
                      <>
                        <Link
                          to={`/admin/edit/${post.id}`}
                          className="btn-ghost"
                          style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', padding: '7px 12px' }}
                        >
                          <Edit size={15} /> Düzenle
                        </Link>
                        <button
                          onClick={() => confirmDelete(post.id)}
                          className="btn-danger"
                          style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', padding: '7px 12px' }}
                        >
                          <Trash2 size={15} /> Sil
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ======= COMMENTS TAB ======= */}
        {activeTab === 'comments' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {comments.length === 0 ? (
              <div className="glass-card-static" style={{ textAlign: 'center', padding: '48px', color: 'var(--text-secondary)' }}>
                Henüz yorum bulunmuyor.
              </div>
            ) : comments.map(comment => {
              const parentPost = posts.find(p => p.id === comment.postId);
              return (
                <div key={comment.id} className="glass-card-static" style={{ padding: '18px 20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap' }}>
                        <div style={{
                          width: '32px', height: '32px', borderRadius: '50%',
                          background: 'var(--accent-light)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: 'var(--accent)', fontWeight: 700, fontSize: '0.85rem', flexShrink: 0,
                        }}>
                          {comment.author.charAt(0).toUpperCase()}
                        </div>
                        <span style={{ fontWeight: 600, fontSize: '0.92rem', color: 'var(--text-primary)' }}>{comment.author}</span>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                          <Clock size={11} style={{ display: 'inline', marginRight: '3px' }} />
                          {new Date(comment.createdAt).toLocaleDateString('tr-TR')}
                        </span>
                        {parentPost && (
                          <Link
                            to={`/post/${comment.postId}`}
                            style={{ fontSize: '0.78rem', color: 'var(--accent)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}
                          >
                            <FileText size={11} /> {parentPost.title}
                          </Link>
                        )}
                      </div>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>
                        {comment.content}
                      </p>
                    </div>

                    <div style={{ flexShrink: 0 }}>
                      {deletingCommentId === comment.id ? (
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                          <button
                            onClick={() => handleDeleteComment(comment)}
                            style={{
                              padding: '5px 10px', borderRadius: 'var(--radius-sm)',
                              background: 'var(--danger)', border: 'none', color: '#fff',
                              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem',
                            }}
                          >
                            <Check size={13} /> Evet
                          </button>
                          <button
                            onClick={cancelDeleteComment}
                            style={{
                              padding: '5px 10px', borderRadius: 'var(--radius-sm)',
                              background: 'var(--card-bg)', border: '1px solid var(--card-border)', color: 'var(--text-secondary)',
                              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem',
                            }}
                          >
                            <X size={13} /> İptal
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => confirmDeleteComment(comment.id)}
                          className="btn-danger"
                          style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', padding: '6px 12px' }}
                        >
                          <Trash2 size={14} /> Sil
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ======= ANALYTICS TAB ======= */}
        {activeTab === 'analytics' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

            {/* Top 3 posts */}
            <div className="glass-card-static" style={{ padding: '24px' }}>
              <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1rem', fontWeight: 700 }}>
                <TrendingUp size={18} style={{ color: 'var(--accent)' }} /> En Çok Okunan Yazılar
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {topPosts.map((post, i) => (
                  <div key={post.id}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <span style={{
                          width: '24px', height: '24px', borderRadius: '50%',
                          background: i === 0 ? 'var(--accent)' : i === 1 ? 'var(--info)' : 'var(--text-muted)',
                          color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '0.75rem', fontWeight: 700, flexShrink: 0,
                        }}>{i + 1}</span>
                        <span style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-primary)' }}>{post.title}</span>
                      </div>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Eye size={13} /> {post.views.toLocaleString('tr-TR')}
                      </span>
                    </div>
                    <div style={{ height: '8px', borderRadius: '4px', background: 'var(--accent-light)', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%',
                        width: `${(post.views / maxViews) * 100}%`,
                        background: i === 0 ? 'var(--accent)' : i === 1 ? 'var(--info)' : 'var(--text-muted)',
                        borderRadius: '4px',
                        transition: 'width 0.8s var(--ease-out-expo)',
                      }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Category Distribution */}
            <div className="glass-card-static" style={{ padding: '24px' }}>
              <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1rem', fontWeight: 700 }}>
                <BarChart2 size={18} style={{ color: 'var(--accent)' }} /> Kategori Dağılımı
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {categoryStats.map(cat => (
                  <div key={cat.name}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                      <span style={{ fontSize: '0.88rem', fontWeight: 500, color: 'var(--text-primary)' }}>{cat.name}</span>
                      <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{cat.count} yazı · {cat.likes} beğeni</span>
                    </div>
                    <div style={{ height: '10px', borderRadius: '5px', background: 'var(--accent-light)', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%',
                        width: `${(cat.count / maxCatCount) * 100}%`,
                        background: 'linear-gradient(90deg, var(--accent), var(--accent-hover))',
                        borderRadius: '5px',
                      }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Like ratio */}
            <div className="glass-card-static" style={{ padding: '24px' }}>
              <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1rem', fontWeight: 700 }}>
                <Heart size={18} style={{ color: '#D34545' }} /> Ortalama Beğeni Oranı
              </h3>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '16px' }}>
                <div style={{ fontSize: '3rem', fontWeight: 800, color: 'var(--accent)', lineHeight: 1 }}>
                  %{avgLikeRatio}
                </div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', paddingBottom: '6px' }}>
                  görüntülenme başına ortalama beğeni
                </div>
              </div>
              <div style={{ marginTop: '16px', height: '10px', borderRadius: '5px', background: 'var(--accent-light)', overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${Math.min(Number(avgLikeRatio) * 2, 100)}%`,
                  background: 'linear-gradient(90deg, #D34545, #E07550)',
                  borderRadius: '5px',
                }} />
              </div>
            </div>
          </div>
        )}
      </main>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
