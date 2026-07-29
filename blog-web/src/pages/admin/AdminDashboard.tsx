import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Edit, Trash2, LayoutDashboard, MessageSquare, BarChart2,
  Plus, Eye, Heart, Search, ArrowLeft, Check, X,
  TrendingUp, FileText, UserCheck, Mail, ShieldAlert, Sparkles, BookOpen
} from 'lucide-react';
import type { Post, Comment, DashboardStats } from '../../types';
import { 
  getPosts, 
  deletePost, 
  getDashboardStats, 
  getAllComments, 
  deleteComment,
  getPendingAdminRequests,
  approveAdminRequest,
  rejectAdminRequest,
  getNewsletterSubscribers,
  type AdminRequest,
  type Subscriber
} from '../../api/posts';

type ActiveTab = 'posts' | 'comments' | 'requests' | 'subscribers' | 'analytics';
type SortKey = 'views' | 'likes' | 'date';

export default function AdminDashboard() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [requests, setRequests] = useState<AdminRequest[]>([]);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<ActiveTab>('posts');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('date');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [postsData, statsData, commentsData, requestsData, subscribersData] = await Promise.all([
        getPosts(),
        getDashboardStats(),
        getAllComments(),
        getPendingAdminRequests(),
        getNewsletterSubscribers(),
      ]);
      setPosts(postsData);
      setStats(statsData);
      setComments(commentsData);
      setRequests(requestsData);
      setSubscribers(subscribersData);
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

  // --- Admin requests ---
  const handleApprove = async (userId: string) => {
    setActionLoadingId(userId);
    const success = await approveAdminRequest(userId);
    if (success) {
      setRequests(prev => prev.filter(r => r.id !== userId));
      const newStats = await getDashboardStats();
      setStats(newStats);
    }
    setActionLoadingId(null);
  };

  const handleReject = async (userId: string) => {
    setActionLoadingId(userId);
    const success = await rejectAdminRequest(userId);
    if (success) {
      setRequests(prev => prev.filter(r => r.id !== userId));
    }
    setActionLoadingId(null);
  };

  // --- Analytics ---
  const topPosts = useMemo(() => [...posts].sort((a, b) => b.views - a.views).slice(0, 3), [posts]);
  const maxViews = topPosts[0]?.views || 1;

  const categoryStats = useMemo(() => {
    const map: Record<string, { count: number; likes: number }> = {};
    posts.forEach(p => {
      if (!map[p.category]) map[p.category] = { count: 0, likes: 0 };
      map[p.category].count += 1;
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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: '#0b0f19', flexDirection: 'column', gap: '16px', color: '#ffffff' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <span style={{ fontSize: '0.9rem', color: '#94a3b8' }}>Admin paneli yükleniyor...</span>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const statCards = [
    { label: 'Toplam Yazı', value: stats?.totalPosts ?? 0, icon: <BookOpen size={20} />, color: 'var(--accent)' },
    { label: 'Görüntülenme', value: stats?.totalViews ?? 0, icon: <Eye size={20} />, color: '#E28743' },
    { label: 'Beğeni', value: stats?.totalLikes ?? 0, icon: <Heart size={20} />, color: '#E05353' },
    { label: 'Yorum', value: stats?.totalComments ?? 0, icon: <MessageSquare size={20} />, color: '#3E885B' },
  ];

  return (
    <div className="admin-layout-wrapper">
      
      {/* ====== SIDEBAR ====== */}
      <aside className="admin-sidebar">
        
        {/* Logo */}
        <div className="admin-sidebar-header">
          <div style={{
            width: '36px', height: '36px', borderRadius: '10px',
            background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Sparkles size={18} style={{ color: '#fff' }} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#ffffff' }}>Doata Admin</div>
            <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600 }}>Yönetici Paneli</div>
          </div>
        </div>

        {/* Nav */}
        <nav className="admin-nav">
          {([
            { tab: 'posts', label: 'Yazı Yönetimi', icon: <FileText size={18} /> },
            { tab: 'comments', label: 'Yorumlar', icon: <MessageSquare size={18} /> },
            { tab: 'requests', label: 'Yazar Onayları', icon: <UserCheck size={18} />, badge: requests.length },
            { tab: 'subscribers', label: 'Bülten Aboneleri', icon: <Mail size={18} />, badge: subscribers.length },
            { tab: 'analytics', label: 'Analizler', icon: <BarChart2 size={18} /> },
          ] as { tab: ActiveTab; label: string; icon: React.ReactNode; badge?: number }[]).map((item, idx) => {
            const isActive = activeTab === item.tab;
            return (
              <button
                key={idx}
                onClick={() => setActiveTab(item.tab)}
                className={`admin-nav-item ${isActive ? 'active' : ''}`}
              >
                {item.icon}
                <span style={{ flex: 1 }}>{item.label}</span>
                {item.badge && item.badge > 0 ? (
                  <span style={{ 
                    background: isActive ? '#ffffff' : 'var(--accent)', 
                    color: isActive ? 'var(--accent)' : '#ffffff', 
                    fontSize: '0.7rem', padding: '2px 8px', borderRadius: '12px', fontWeight: 700 
                  }}>
                    {item.badge}
                  </span>
                ) : null}
              </button>
            );
          })}
        </nav>

        {/* Go back */}
        <div style={{ padding: '20px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <Link to="/" className="admin-btn admin-btn-ghost" style={{ width: '100%', justifyContent: 'center' }}>
            <ArrowLeft size={14} /> Siteye Dön
          </Link>
        </div>
      </aside>

      {/* ====== MAIN CONTENT ====== */}
      <main className="admin-main">
        
        {/* Header */}
        <header className="admin-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: '0.05em' }}>
            <LayoutDashboard size={14} />
            <span>YÖNETİM</span>
            <span style={{ color: 'var(--card-border)' }}>/</span>
            <span style={{ color: 'var(--accent)' }}>
              {activeTab === 'posts' ? 'YAZILAR' : activeTab === 'comments' ? 'YORUMLAR' : activeTab === 'requests' ? 'YAZAR ONAYLARI' : activeTab === 'subscribers' ? 'BÜLTEN' : 'ANALİZLER'}
            </span>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 12px', background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.2)', color: '#d97706', borderRadius: '20px', fontSize: '0.68rem', fontWeight: 700 }}>
            <ShieldAlert size={12} /> GÜVENLİ OTURUM
          </div>
        </header>

        {/* Content */}
        <div className="admin-content">
          
          {/* Stats Grid */}
          <div className="admin-stats-grid">
            {statCards.map((card, i) => (
              <div key={i} className="admin-stat-card">
                <div>
                  <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{card.label}</div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 800, marginTop: '4px', color: 'var(--text-primary)' }}>{card.value.toLocaleString('tr-TR')}</div>
                </div>
                <div style={{
                  width: '42px', height: '42px', borderRadius: '12px',
                  background: `${card.color}12`, border: `1px solid ${card.color}25`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: card.color
                }}>
                  {card.icon}
                </div>
              </div>
            ))}
          </div>

          {/* ======= POSTS TAB ======= */}
          {activeTab === 'posts' && (
            <div className="admin-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* Filter bar */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <select
                    value={categoryFilter}
                    onChange={e => setCategoryFilter(e.target.value)}
                    className="admin-select"
                  >
                    <option value="">Tüm Kategoriler</option>
                    {categories.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>

                  <select
                    value={sortKey}
                    onChange={e => setSortKey(e.target.value as SortKey)}
                    className="admin-select"
                  >
                    <option value="date">En Yeni</option>
                    <option value="views">Okunma</option>
                    <option value="likes">Beğeni</option>
                  </select>
                </div>

                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <div style={{ position: 'relative' }}>
                    <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      placeholder="Yazı veya yazar ara..."
                      className="admin-input"
                      style={{ paddingLeft: '36px', width: '220px' }}
                    />
                  </div>
                  <Link to="/create" className="admin-btn admin-btn-primary">
                    <Plus size={15} /> Yeni Yazı
                  </Link>
                </div>
              </div>

              {/* Table */}
              <div className="admin-table-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Yazı Başlığı</th>
                      <th>Kategori</th>
                      <th>Yazar</th>
                      <th>İstatistikler</th>
                      <th style={{ textAlign: 'right' }}>Yönet</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPosts.length === 0 ? (
                      <tr>
                        <td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '32px' }}>Yazı bulunamadı.</td>
                      </tr>
                    ) : (
                      filteredPosts.map(post => (
                        <tr key={post.id}>
                          <td>
                            <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{post.title}</div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                              {new Date(post.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </div>
                          </td>
                          <td>
                            <span style={{
                              padding: '4px 10px', borderRadius: '20px', fontSize: '0.68rem', fontWeight: 700,
                              background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--card-border)'
                            }}>
                              {post.category}
                            </span>
                          </td>
                          <td style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>{post.author}</td>
                          <td>
                            <div style={{ display: 'flex', gap: '16px', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Eye size={12} /> {post.views}</span>
                              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Heart size={12} style={{ color: '#E05353' }} /> {post.likes}</span>
                              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><MessageSquare size={12} /> {post.comments?.length || 0}</span>
                            </div>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            {deletingId === post.id ? (
                              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                <button onClick={() => handleDelete(post.id)} className="admin-btn admin-btn-primary" style={{ padding: '6px 12px', background: 'var(--danger)', fontSize: '0.75rem' }}>Sil</button>
                                <button onClick={cancelDelete} className="admin-btn admin-btn-ghost" style={{ padding: '6px 12px', fontSize: '0.75rem' }}>İptal</button>
                              </div>
                            ) : (
                              <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                                <Link to={`/admin/edit/${post.id}`} className="admin-btn admin-btn-ghost" style={{ padding: '6px', borderRadius: '8px' }} title="Düzenle">
                                  <Edit size={14} />
                                </Link>
                                <button onClick={() => confirmDelete(post.id)} className="admin-btn admin-btn-ghost" style={{ padding: '6px', borderRadius: '8px', color: 'var(--danger)' }} title="Sil">
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ======= COMMENTS TAB ======= */}
          {activeTab === 'comments' && (
            <div className="admin-card">
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, marginBottom: '20px', color: 'var(--text-primary)' }}>Kullanıcı Yorumları</h3>
              {comments.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '48px', border: '1px dashed var(--card-border)', borderRadius: '12px', color: 'var(--text-muted)' }}>
                  <MessageSquare size={32} style={{ marginBottom: '8px' }} />
                  <div>Henüz yorum yazılmamış.</div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {comments.map(comment => (
                    <div key={comment.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '16px', border: '1px solid var(--card-border)', borderRadius: '12px', background: 'rgba(0,0,0,0.005)' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>{comment.author}</span>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{new Date(comment.createdAt).toLocaleDateString('tr-TR')}</span>
                        </div>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '6px', lineHeight: '1.5' }}>{comment.content}</p>
                      </div>
                      {deletingCommentId === comment.id ? (
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button onClick={() => handleDeleteComment(comment)} className="admin-btn admin-btn-primary" style={{ padding: '6px 12px', background: 'var(--danger)', fontSize: '0.75rem' }}>Sil</button>
                          <button onClick={cancelDeleteComment} className="admin-btn admin-btn-ghost" style={{ padding: '6px 12px', fontSize: '0.75rem' }}>İptal</button>
                        </div>
                      ) : (
                        <button onClick={() => confirmDeleteComment(comment.id)} className="admin-btn admin-btn-ghost" style={{ padding: '6px', borderRadius: '8px', color: 'var(--danger)' }}>
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ======= REQUESTS TAB ======= */}
          {activeTab === 'requests' && (
            <div className="admin-card">
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, marginBottom: '20px', color: 'var(--text-primary)' }}>Bekleyen Yazar Yetki Talepleri</h3>
              {requests.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '48px', border: '1px dashed var(--card-border)', borderRadius: '12px', color: 'var(--text-muted)' }}>
                  <UserCheck size={32} style={{ marginBottom: '8px' }} />
                  <div>Bekleyen yazar yetki talebi bulunmuyor.</div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {requests.map(req => (
                    <div key={req.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', border: '1px solid var(--card-border)', borderRadius: '12px', background: 'rgba(0,0,0,0.005)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                          width: '40px', height: '40px', borderRadius: '50%',
                          background: 'var(--accent-light)', color: 'var(--accent)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '0.9rem', fontWeight: 700, overflow: 'hidden'
                        }}>
                          {req.avatar ? (
                            <img src={req.avatar} alt={req.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            req.name.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>{req.name}</div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '2px' }}>{req.email}</div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => handleApprove(req.id)}
                          disabled={actionLoadingId === req.id}
                          className="admin-btn admin-btn-primary"
                          style={{ padding: '8px 16px', fontSize: '0.75rem', background: '#10b981' }}
                        >
                          <Check size={14} /> {actionLoadingId === req.id ? 'Onaylanıyor...' : 'Onayla'}
                        </button>
                        <button
                          onClick={() => handleReject(req.id)}
                          disabled={actionLoadingId === req.id}
                          className="admin-btn admin-btn-ghost"
                          style={{ padding: '8px 16px', fontSize: '0.75rem', color: 'var(--danger)' }}
                        >
                          <X size={14} /> {actionLoadingId === req.id ? 'Reddediliyor...' : 'Reddet'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ======= SUBSCRIBERS TAB ======= */}
          {activeTab === 'subscribers' && (
            <div className="admin-card">
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, marginBottom: '20px', color: 'var(--text-primary)' }}>Bülten Aboneleri</h3>
              {subscribers.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '48px', border: '1px dashed var(--card-border)', borderRadius: '12px', color: 'var(--text-muted)' }}>
                  <Mail size={32} style={{ marginBottom: '8px' }} />
                  <div>Bülten abonesi bulunmuyor.</div>
                </div>
              ) : (
                <div className="admin-table-wrapper">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>E-posta Adresi</th>
                        <th style={{ textAlign: 'right' }}>Kayıt Tarihi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {subscribers.map(sub => (
                        <tr key={sub.id}>
                          <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{sub.email}</td>
                          <td style={{ textAlign: 'right', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                            {new Date(sub.createdAt).toLocaleDateString('tr-TR', {
                              day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
                            })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ======= ANALYTICS TAB ======= */}
          {activeTab === 'analytics' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
              
              {/* Top posts */}
              <div className="admin-card">
                <h3 style={{ fontSize: '0.92rem', fontWeight: 800, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-secondary)' }}>
                  <TrendingUp size={16} style={{ color: 'var(--accent)' }} /> En Çok Okunan Yazılar
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {topPosts.map((post, i) => (
                    <div key={post.id}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', fontSize: '0.82rem' }}>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', fontWeight: 700 }}>
                          <span style={{
                            width: '20px', height: '20px', borderRadius: '50%', color: '#fff', fontSize: '0.68rem',
                            background: i === 0 ? 'var(--accent)' : i === 1 ? 'var(--accent-mid)' : '#94a3b8',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                          }}>{i + 1}</span>
                          <span style={{ color: 'var(--text-primary)' }}>{post.title}</span>
                        </div>
                        <span style={{ color: 'var(--text-secondary)' }}>{post.views} okuma</span>
                      </div>
                      <div style={{ height: '6px', borderRadius: '10px', background: 'var(--bg-secondary)', overflow: 'hidden' }}>
                        <div style={{
                          height: '100%', borderRadius: '10px',
                          background: i === 0 ? 'var(--accent)' : i === 1 ? 'var(--accent-mid)' : '#94a3b8',
                          width: `${(post.views / maxViews) * 100}%`
                        }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Category list */}
              <div className="admin-card">
                <h3 style={{ fontSize: '0.92rem', fontWeight: 800, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-secondary)' }}>
                  <BarChart2 size={16} style={{ color: 'var(--accent)' }} /> Kategori Dağılımı
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {categoryStats.map(cat => (
                    <div key={cat.name}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.82rem', fontWeight: 700 }}>
                        <span style={{ color: 'var(--text-primary)' }}>{cat.name}</span>
                        <span style={{ color: 'var(--text-secondary)' }}>{cat.count} yazı · {cat.likes} beğeni</span>
                      </div>
                      <div style={{ height: '6px', borderRadius: '10px', background: 'var(--bg-secondary)', overflow: 'hidden' }}>
                        <div style={{
                          height: '100%', borderRadius: '10px',
                          background: 'linear-gradient(90deg, var(--accent) 0%, var(--accent-mid) 100%)',
                          width: `${(cat.count / maxCatCount) * 100}%`
                        }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Like ratio */}
              <div className="admin-card" style={{ gridColumn: '1 / -1' }}>
                <h3 style={{ fontSize: '0.92rem', fontWeight: 800, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-secondary)' }}>
                  <Heart size={16} style={{ color: '#E05353' }} /> Ortalama Beğeni Oranı
                </h3>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '12px' }}>
                  <div style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--accent)' }}>%{avgLikeRatio}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600 }}>görüntülenme başına ortalama beğeni</div>
                </div>
                <div style={{ height: '6px', borderRadius: '10px', background: 'var(--bg-secondary)', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', borderRadius: '10px',
                    background: 'linear-gradient(90deg, #E05353 0%, var(--accent) 100%)',
                    width: `${Math.min(Number(avgLikeRatio) * 2.5, 100)}%`
                  }} />
                </div>
              </div>

            </div>
          )}

        </div>
      </main>
    </div>
  );
}
