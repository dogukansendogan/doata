import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Edit, Trash2, LayoutDashboard, MessageSquare, BarChart2,
  Plus, Eye, Heart, Search, ArrowLeft, Check, X,
  TrendingUp, FileText, UserCheck, Mail
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
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
        <span className="text-slate-500 font-medium">Admin paneli yükleniyor...</span>
      </div>
    );
  }

  const statCards = [
    { label: 'Toplam Yazı', value: stats?.totalPosts ?? 0, icon: <FileText size={22} />, color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400' },
    { label: 'Görüntülenme', value: stats?.totalViews ?? 0, icon: <Eye size={22} />, color: 'bg-orange-500/10 text-orange-600 dark:text-orange-400' },
    { label: 'Beğeni', value: stats?.totalLikes ?? 0, icon: <Heart size={22} />, color: 'bg-rose-500/10 text-rose-600 dark:text-rose-400' },
    { label: 'Yorum', value: stats?.totalComments ?? 0, icon: <MessageSquare size={22} />, color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' },
  ];

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-zinc-950 font-sans">
      
      {/* ====== SIDEBAR ====== */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col h-screen sticky top-0 border-r border-slate-800 shrink-0">
        
        {/* Logo */}
        <div className="p-6 border-b border-slate-800 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center shadow-md">
            <span className="text-white font-extrabold text-lg">D</span>
          </div>
          <div>
            <div className="font-bold text-sm leading-tight">Doata Admin</div>
            <div className="text-xs text-slate-400">Yönetim Paneli</div>
          </div>
        </div>

        {/* Nav */}
        <nav className="p-4 flex-1 flex flex-col gap-1">
          {([
            { tab: 'posts', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
            { tab: 'comments', label: 'Yorumlar', icon: <MessageSquare size={18} /> },
            { tab: 'requests', label: 'Yetki Talepleri', icon: <UserCheck size={18} />, badge: requests.length },
            { tab: 'subscribers', label: 'Bülten Aboneleri', icon: <Mail size={18} />, badge: subscribers.length },
            { tab: 'analytics', label: 'Analizler', icon: <BarChart2 size={18} /> },
          ] as { tab: ActiveTab; label: string; icon: React.ReactNode; badge?: number }[]).map((item, idx) => {
            const isActive = activeTab === item.tab;
            return (
              <button
                key={idx}
                onClick={() => setActiveTab(item.tab)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-left text-sm font-semibold transition-all ${
                  isActive 
                    ? 'bg-indigo-600 text-white shadow-md' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                {item.icon}
                <span className="flex-1">{item.label}</span>
                {item.badge && item.badge > 0 ? (
                  <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                    isActive ? 'bg-white text-indigo-600' : 'bg-indigo-600 text-white'
                  }`}>
                    {item.badge}
                  </span>
                ) : null}
              </button>
            );
          })}
        </nav>

        {/* Go back */}
        <div className="p-4 border-t border-slate-800">
          <Link
            to="/"
            className="flex items-center gap-2 px-4 py-3 text-slate-400 hover:text-white rounded-lg text-sm font-semibold transition"
          >
            <ArrowLeft size={16} />
            <span>Siteye Dön</span>
          </Link>
        </div>
      </aside>

      {/* ====== MAIN CONTENT ====== */}
      <main className="flex-1 p-8 overflow-y-auto">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-800 dark:text-zinc-100">
            {activeTab === 'posts' ? 'Yazı Yönetimi' : activeTab === 'comments' ? 'Yorum Yönetimi' : activeTab === 'requests' ? 'Yetki Talepleri' : activeTab === 'subscribers' ? 'Bülten Aboneleri' : 'Analizler'}
          </h1>
          <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1">
            {activeTab === 'posts' ? 'Tüm blog yazılarınızı buradan yönetin' : activeTab === 'comments' ? 'Okuyucu yorumlarını inceleyin ve yönetin' : activeTab === 'requests' ? 'Yazar yetkisi isteyen kullanıcıların taleplerini onaylayın veya reddedin' : activeTab === 'subscribers' ? 'Bültene abone olmuş kullanıcıların e-posta listesi' : 'Sitenizin performans analizleri'}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((card, i) => (
            <div key={i} className="p-6 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/80 rounded-2xl shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{card.label}</span>
                <h3 className="text-2xl font-bold text-slate-800 dark:text-zinc-100 mt-1">{card.value.toLocaleString('tr-TR')}</h3>
              </div>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${card.color}`}>
                {card.icon}
              </div>
            </div>
          ))}
        </div>

        {/* ======= POSTS TAB ======= */}
        {activeTab === 'posts' && (
          <div className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/80 rounded-2xl shadow-sm overflow-hidden">
            
            {/* Table actions bar */}
            <div className="p-5 border-b border-slate-100 dark:border-zinc-800 flex flex-wrap gap-4 items-center justify-between bg-slate-50/50 dark:bg-zinc-900/50">
              <div className="flex gap-3 flex-wrap">
                <select
                  value={categoryFilter}
                  onChange={e => setCategoryFilter(e.target.value)}
                  className="px-3 py-2 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg text-sm text-slate-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Tüm Kategoriler</option>
                  {categories.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>

                <select
                  value={sortKey}
                  onChange={e => setSortKey(e.target.value as SortKey)}
                  className="px-3 py-2 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg text-sm text-slate-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="date">En Yeni</option>
                  <option value="views">Okunma</option>
                  <option value="likes">Beğeni</option>
                </select>
              </div>

              <div className="flex items-center gap-4">
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Yazı veya yazar ara..."
                    className="pl-9 pr-4 py-2 border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 rounded-lg text-sm text-slate-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-64"
                  />
                </div>
                <Link to="/create" className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition shadow-md">
                  <Plus size={16} />
                  <span>Yeni Yazı</span>
                </Link>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100 dark:divide-zinc-800">
                <thead className="bg-slate-50/50 dark:bg-zinc-900/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Başlık</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Kategori</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Yazar</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">İstatistikler</th>
                    <th className="px-6 py-3 text-right text-xs font-bold text-slate-400 uppercase tracking-wider">İşlemler</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-zinc-800 bg-white dark:bg-zinc-900">
                  {filteredPosts.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-10 text-center text-slate-400">Yazı bulunamadı.</td>
                    </tr>
                  ) : (
                    filteredPosts.map(post => (
                      <tr key={post.id} className="hover:bg-slate-50/30 dark:hover:bg-zinc-800/10 transition">
                        <td className="px-6 py-4">
                          <div className="font-semibold text-slate-800 dark:text-zinc-200 text-sm line-clamp-1">{post.title}</div>
                          <div className="text-xs text-slate-400 mt-0.5">{new Date(post.createdAt).toLocaleDateString('tr-TR')}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300">
                            {post.category}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600 dark:text-zinc-300">{post.author}</td>
                        <td className="px-6 py-4">
                          <div className="flex gap-4 text-xs text-slate-500 dark:text-zinc-400">
                            <span className="flex items-center gap-1"><Eye size={14} /> {post.views}</span>
                            <span className="flex items-center gap-1"><Heart size={14} /> {post.likes}</span>
                            <span className="flex items-center gap-1"><MessageSquare size={14} /> {post.comments?.length || 0}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right text-sm font-medium">
                          {deletingId === post.id ? (
                            <div className="flex gap-2 justify-end">
                              <button onClick={() => handleDelete(post.id)} className="px-3 py-1 rounded bg-rose-600 text-white text-xs hover:bg-rose-700">Sil</button>
                              <button onClick={cancelDelete} className="px-3 py-1 rounded bg-slate-200 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 text-xs hover:bg-slate-300">İptal</button>
                            </div>
                          ) : (
                            <div className="flex gap-2 justify-end">
                              <Link to={`/admin/edit/${post.id}`} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg transition" title="Düzenle">
                                <Edit size={16} />
                              </Link>
                              <button onClick={() => confirmDelete(post.id)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg transition" title="Sil">
                                <Trash2 size={16} />
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
          <div className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/80 rounded-2xl shadow-sm overflow-hidden p-6">
            <h3 className="text-lg font-bold text-slate-800 dark:text-zinc-200 mb-5">Kullanıcı Yorumları</h3>
            {comments.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-slate-200 dark:border-zinc-800 rounded-xl text-slate-400 flex flex-col items-center gap-3">
                <MessageSquare size={36} />
                <span>Kayıtlı yorum bulunmamaktadır.</span>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-zinc-800">
                {comments.map(comment => (
                  <div key={comment.id} className="py-4 flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-800 dark:text-zinc-200 text-sm">{comment.author}</span>
                        <span className="text-xs text-slate-400">{new Date(comment.createdAt).toLocaleDateString('tr-TR')}</span>
                      </div>
                      <p className="text-slate-600 dark:text-zinc-300 text-sm mt-1.5">{comment.content}</p>
                    </div>
                    {deletingCommentId === comment.id ? (
                      <div className="flex gap-2">
                        <button onClick={() => handleDeleteComment(comment)} className="px-3 py-1 rounded bg-rose-600 text-white text-xs hover:bg-rose-700">Sil</button>
                        <button onClick={cancelDeleteComment} className="px-3 py-1 rounded bg-slate-200 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 text-xs hover:bg-slate-300">İptal</button>
                      </div>
                    ) : (
                      <button onClick={() => confirmDeleteComment(comment.id)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg transition" title="Yorumu Sil">
                        <Trash2 size={16} />
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
          <div className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/80 rounded-2xl shadow-sm p-6">
            <h3 className="text-lg font-bold text-slate-800 dark:text-zinc-200 mb-5">Bekleyen Yetki Talepleri</h3>
            {requests.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-slate-200 dark:border-zinc-800 rounded-xl text-slate-400 flex flex-col items-center gap-3">
                <UserCheck size={36} />
                <span>Bekleyen yazar/yönetici yetki talebi bulunmamaktadır.</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {requests.map(req => (
                  <div key={req.id} className="p-5 border border-slate-100 dark:border-zinc-850 rounded-xl bg-slate-50/50 dark:bg-zinc-900/50 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold overflow-hidden shadow-inner">
                        {req.avatar ? (
                          <img src={req.avatar} alt={req.name} className="w-full h-full object-cover" />
                        ) : (
                          req.name.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-800 dark:text-zinc-200 text-sm">{req.name}</div>
                        <div className="text-xs text-slate-400 mt-0.5">{req.email}</div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApprove(req.id)}
                        disabled={actionLoadingId === req.id}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow transition-all"
                      >
                        <Check size={14} />
                        {actionLoadingId === req.id ? 'Onaylanıyor...' : 'Onayla'}
                      </button>
                      <button
                        onClick={() => handleReject(req.id)}
                        disabled={actionLoadingId === req.id}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-slate-200 dark:border-zinc-800 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-100 dark:hover:bg-rose-950/20 text-slate-600 dark:text-zinc-300 text-xs font-semibold transition-all"
                      >
                        <X size={14} />
                        {actionLoadingId === req.id ? 'Reddediliyor...' : 'Reddet'}
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
          <div className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/80 rounded-2xl shadow-sm p-6">
            <h3 className="text-lg font-bold text-slate-800 dark:text-zinc-200 mb-5">E-Bülten Abone Listesi</h3>
            {subscribers.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-slate-200 dark:border-zinc-800 rounded-xl text-slate-400 flex flex-col items-center gap-3">
                <Mail size={36} />
                <span>Kayıtlı e-bülten abonesi bulunmamaktadır.</span>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-100 dark:divide-zinc-800">
                  <thead className="bg-slate-50/50 dark:bg-zinc-900/50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">E-posta Adresi</th>
                      <th className="px-6 py-3 text-right text-xs font-bold text-slate-400 uppercase tracking-wider">Kayıt Tarihi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-zinc-800 bg-white dark:bg-zinc-900">
                    {subscribers.map(sub => (
                      <tr key={sub.id} className="hover:bg-slate-50/30 dark:hover:bg-zinc-800/10 transition">
                        <td className="px-6 py-4 text-sm font-medium text-slate-800 dark:text-zinc-200">{sub.email}</td>
                        <td className="px-6 py-4 text-right text-xs text-slate-500 dark:text-zinc-400">
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
          <div className="flex flex-col gap-6">
            
            {/* Top 3 posts */}
            <div className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/80 rounded-2xl shadow-sm p-6">
              <h3 className="text-base font-bold text-slate-800 dark:text-zinc-200 mb-5 flex items-center gap-2">
                <TrendingUp size={18} className="text-indigo-500" /> En Çok Okunan Yazılar
              </h3>
              <div className="flex flex-col gap-4">
                {topPosts.map((post, i) => (
                  <div key={post.id}>
                    <div className="flex justify-between items-center mb-1">
                      <div className="flex gap-3 items-center">
                        <span className={`w-6 h-6 rounded-full text-white flex items-center justify-center text-xs font-bold ${
                          i === 0 ? 'bg-indigo-600' : i === 1 ? 'bg-indigo-500' : 'bg-slate-400'
                        }`}>{i + 1}</span>
                        <span className="text-sm font-semibold text-slate-700 dark:text-zinc-300">{post.title}</span>
                      </div>
                      <span className="text-xs text-slate-500 flex items-center gap-1"><Eye size={13} /> {post.views.toLocaleString('tr-TR')}</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100 dark:bg-zinc-800 overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${
                          i === 0 ? 'bg-indigo-600' : i === 1 ? 'bg-indigo-500' : 'bg-slate-400'
                        }`}
                        style={{ width: `${(post.views / maxViews) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Category Distribution */}
            <div className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/80 rounded-2xl shadow-sm p-6">
              <h3 className="text-base font-bold text-slate-800 dark:text-zinc-200 mb-5 flex items-center gap-2">
                <BarChart2 size={18} className="text-indigo-500" /> Kategori Dağılımı
              </h3>
              <div className="flex flex-col gap-4">
                {categoryStats.map(cat => (
                  <div key={cat.name}>
                    <div className="flex justify-between mb-1.5">
                      <span className="text-sm font-semibold text-slate-700 dark:text-zinc-300">{cat.name}</span>
                      <span className="text-xs text-slate-500">{cat.count} yazı · {cat.likes} beğeni</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100 dark:bg-zinc-800 overflow-hidden">
                      <div 
                        className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500"
                        style={{ width: `${(cat.count / maxCatCount) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Like ratio */}
            <div className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/80 rounded-2xl shadow-sm p-6">
              <h3 className="text-base font-bold text-slate-850 dark:text-zinc-200 mb-4 flex items-center gap-2">
                <Heart size={18} className="text-rose-500" /> Ortalama Beğeni Oranı
              </h3>
              <div className="flex items-end gap-3">
                <div className="text-4xl font-extrabold text-indigo-600 dark:text-indigo-400">%{avgLikeRatio}</div>
                <div className="text-xs text-slate-500 pb-1">görüntülenme başına ortalama beğeni</div>
              </div>
              <div className="mt-4 h-2 rounded-full bg-slate-100 dark:bg-zinc-800 overflow-hidden">
                <div 
                  className="h-full rounded-full bg-gradient-to-r from-rose-500 to-indigo-500"
                  style={{ width: `${Math.min(Number(avgLikeRatio) * 2, 100)}%` }}
                />
              </div>
            </div>

          </div>
        )}

      </main>
    </div>
  );
}
