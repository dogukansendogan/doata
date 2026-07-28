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
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 gap-6 text-white">
        <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
        <span className="text-slate-400 font-medium tracking-wide text-sm">Doata Dashboard Yükleniyor...</span>
      </div>
    );
  }

  const statCards = [
    { label: 'Toplam Yazı', value: stats?.totalPosts ?? 0, icon: <BookOpen size={20} />, gradient: 'from-blue-500/10 to-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-100 dark:border-indigo-950/40' },
    { label: 'Görüntülenme', value: stats?.totalViews ?? 0, icon: <Eye size={20} />, gradient: 'from-amber-500/10 to-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-100 dark:border-orange-950/40' },
    { label: 'Beğeni', value: stats?.totalLikes ?? 0, icon: <Heart size={20} />, gradient: 'from-rose-500/10 to-pink-500/10 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-950/40' },
    { label: 'Yorum', value: stats?.totalComments ?? 0, icon: <MessageSquare size={20} />, gradient: 'from-emerald-500/10 to-teal-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-950/40' },
  ];

  return (
    <div className="flex min-h-screen bg-[#fafbfc] dark:bg-zinc-950 text-slate-800 dark:text-zinc-100 font-sans antialiased">
      
      {/* ====== SIDEBAR (Glassmorphic Dark Navy) ====== */}
      <aside className="w-68 bg-slate-950 text-white flex flex-col h-screen sticky top-0 border-r border-slate-800/60 shrink-0">
        
        {/* Profile/Brand */}
        <div className="p-6 border-b border-slate-800/60 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Sparkles size={18} className="text-white animate-pulse" />
          </div>
          <div>
            <div className="font-bold text-sm tracking-tight text-white">Doata Control</div>
            <div className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider mt-0.5">Yazar & Yönetim</div>
          </div>
        </div>

        {/* Navigation Section */}
        <div className="px-3 py-4 flex-1 flex flex-col gap-1.5 overflow-y-auto">
          <span className="px-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">Menü</span>
          {([
            { tab: 'posts', label: 'Yazı Yönetimi', icon: <FileText size={18} /> },
            { tab: 'comments', label: 'Yorumlar', icon: <MessageSquare size={18} /> },
            { tab: 'requests', label: 'Yetki Talepleri', icon: <UserCheck size={18} />, badge: requests.length, badgeColor: 'bg-amber-500 text-white' },
            { tab: 'subscribers', label: 'Bülten Aboneleri', icon: <Mail size={18} />, badge: subscribers.length, badgeColor: 'bg-indigo-600 text-white' },
            { tab: 'analytics', label: 'Performans Analizleri', icon: <BarChart2 size={18} /> },
          ] as { tab: ActiveTab; label: string; icon: React.ReactNode; badge?: number; badgeColor?: string }[]).map((item, idx) => {
            const isActive = activeTab === item.tab;
            return (
              <button
                key={idx}
                onClick={() => setActiveTab(item.tab)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-left text-[13px] font-semibold transition-all duration-200 ${
                  isActive 
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10 scale-[1.02]' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                }`}
              >
                {item.icon}
                <span className="flex-1">{item.label}</span>
                {item.badge && item.badge > 0 ? (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold shadow-sm ${
                    isActive ? 'bg-white text-indigo-600' : item.badgeColor || 'bg-indigo-600 text-white'
                  }`}>
                    {item.badge}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>

        {/* Return to website */}
        <div className="p-4 border-t border-slate-800/60">
          <Link
            to="/"
            className="flex items-center justify-center gap-2 w-full py-2.5 bg-slate-800/50 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-bold border border-slate-700/40 transition duration-150"
          >
            <ArrowLeft size={14} />
            <span>Ana Siteye Dön</span>
          </Link>
        </div>
      </aside>

      {/* ====== MAIN CONTENT SECTION ====== */}
      <main className="flex-1 flex flex-col min-w-0">
        
        {/* Top Header Bar */}
        <header className="h-16 border-b border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 backdrop-blur-md flex items-center justify-between px-8 z-10 sticky top-0">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-widest">
            <LayoutDashboard size={14} />
            <span>Yönetim Paneli</span>
            <span className="text-slate-300 dark:text-zinc-700">/</span>
            <span className="text-indigo-500 dark:text-indigo-400">
              {activeTab === 'posts' ? 'Yazılar' : activeTab === 'comments' ? 'Yorumlar' : activeTab === 'requests' ? 'Yetkiler' : activeTab === 'subscribers' ? 'Bülten' : 'Analizler'}
            </span>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 rounded-full text-[10px] font-bold uppercase tracking-wider">
              <ShieldAlert size={12} />
              <span>Güvenli Oturum</span>
            </div>
          </div>
        </header>

        {/* Content Container */}
        <div className="p-8 max-w-7xl w-full mx-auto flex-1 flex flex-col">
          
          {/* Dashboard Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
            {statCards.map((card, i) => (
              <div key={i} className="p-5 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/80 rounded-2xl shadow-sm flex items-center justify-between hover:shadow-md hover:border-slate-200 dark:hover:border-zinc-700 transition-all duration-200">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block">{card.label}</span>
                  <h3 className="text-2xl font-extrabold text-slate-800 dark:text-zinc-100 mt-1">{card.value.toLocaleString('tr-TR')}</h3>
                </div>
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center bg-gradient-to-br ${card.gradient} border`}>
                  {card.icon}
                </div>
              </div>
            ))}
          </div>

          {/* ======= WRAPPERS & VIEWS ======= */}

          {/* ======= POSTS TAB ======= */}
          {activeTab === 'posts' && (
            <div className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/80 rounded-2xl shadow-sm overflow-hidden flex-1 flex flex-col">
              
              {/* Filter bar */}
              <div className="p-5 border-b border-slate-100 dark:border-zinc-850 flex flex-wrap gap-4 items-center justify-between bg-slate-50/40 dark:bg-zinc-900/30">
                <div className="flex gap-2 flex-wrap">
                  <select
                    value={categoryFilter}
                    onChange={e => setCategoryFilter(e.target.value)}
                    className="px-3 py-2 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Tüm Kategoriler</option>
                    {categories.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>

                  <select
                    value={sortKey}
                    onChange={e => setSortKey(e.target.value as SortKey)}
                    className="px-3 py-2 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="date">En Yeni</option>
                    <option value="views">Okunma</option>
                    <option value="likes">Beğeni</option>
                  </select>
                </div>

                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      placeholder="Yazı veya yazar ara..."
                      className="pl-9 pr-4 py-2 border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 rounded-xl text-xs text-slate-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-56"
                    />
                  </div>
                  <Link to="/create" className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-md shadow-indigo-600/10">
                    <Plus size={15} />
                    <span>Yeni Yazı</span>
                  </Link>
                </div>
              </div>

              {/* Table list */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-100 dark:divide-zinc-800">
                  <thead className="bg-slate-50/20 dark:bg-zinc-900/10">
                    <tr>
                      <th className="px-6 py-4 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">Yazı Başlığı</th>
                      <th className="px-6 py-4 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">Kategori</th>
                      <th className="px-6 py-4 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">Yazar</th>
                      <th className="px-6 py-4 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">Etkileşim</th>
                      <th className="px-6 py-4 text-right text-[11px] font-bold text-slate-400 uppercase tracking-wider">Yönet</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-zinc-800 bg-white dark:bg-zinc-900">
                    {filteredPosts.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-slate-400 text-sm">Yazı bulunamadı.</td>
                      </tr>
                    ) : (
                      filteredPosts.map(post => (
                        <tr key={post.id} className="hover:bg-slate-50/40 dark:hover:bg-zinc-800/20 transition">
                          <td className="px-6 py-4">
                            <div className="font-semibold text-slate-800 dark:text-zinc-200 text-sm line-clamp-1">{post.title}</div>
                            <div className="text-[10px] text-slate-400 mt-1">{new Date(post.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="px-2.5 py-1 text-[10px] font-bold rounded-full bg-slate-100 dark:bg-zinc-800/80 text-slate-600 dark:text-zinc-300 border border-slate-200/20">
                              {post.category}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-xs font-medium text-slate-600 dark:text-zinc-300">{post.author}</td>
                          <td className="px-6 py-4">
                            <div className="flex gap-4 text-xs text-slate-500 dark:text-zinc-400">
                              <span className="flex items-center gap-1.5"><Eye size={13} /> {post.views}</span>
                              <span className="flex items-center gap-1.5"><Heart size={13} className="text-rose-500/80" /> {post.likes}</span>
                              <span className="flex items-center gap-1.5"><MessageSquare size={13} /> {post.comments?.length || 0}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right text-sm font-medium">
                            {deletingId === post.id ? (
                              <div className="flex gap-1.5 justify-end">
                                <button onClick={() => handleDelete(post.id)} className="px-2.5 py-1 rounded-lg bg-rose-600 text-white text-xs hover:bg-rose-700">Sil</button>
                                <button onClick={cancelDelete} className="px-2.5 py-1 rounded-lg bg-slate-200 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 text-xs hover:bg-slate-300">İptal</button>
                              </div>
                            ) : (
                              <div className="flex gap-1 justify-end">
                                <Link to={`/admin/edit/${post.id}`} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg transition" title="Düzenle">
                                  <Edit size={15} />
                                </Link>
                                <button onClick={() => confirmDelete(post.id)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg transition" title="Sil">
                                  <Trash2 size={15} />
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
            <div className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/80 rounded-2xl shadow-sm p-6 flex-1 flex flex-col">
              <h3 className="text-base font-bold text-slate-800 dark:text-zinc-200 mb-5">Yorum Listesi</h3>
              {comments.length === 0 ? (
                <div className="text-center py-16 border border-dashed border-slate-200 dark:border-zinc-800 rounded-xl text-slate-400 flex flex-col items-center gap-3 flex-1 justify-center">
                  <MessageSquare size={36} className="text-slate-300" />
                  <span className="text-sm">Henüz yazılmış bir yorum bulunmuyor.</span>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-zinc-800">
                  {comments.map(comment => (
                    <div key={comment.id} className="py-4 flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-850 dark:text-zinc-200 text-sm">{comment.author}</span>
                          <span className="text-[10px] text-slate-400">{new Date(comment.createdAt).toLocaleDateString('tr-TR')}</span>
                        </div>
                        <p className="text-slate-600 dark:text-zinc-300 text-sm mt-1.5">{comment.content}</p>
                      </div>
                      {deletingCommentId === comment.id ? (
                        <div className="flex gap-1.5 shrink-0">
                          <button onClick={() => handleDeleteComment(comment)} className="px-2.5 py-1 rounded bg-rose-600 text-white text-xs hover:bg-rose-700">Sil</button>
                          <button onClick={cancelDeleteComment} className="px-2.5 py-1 rounded bg-slate-200 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 text-xs hover:bg-slate-300">İptal</button>
                        </div>
                      ) : (
                        <button onClick={() => confirmDeleteComment(comment.id)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg transition" title="Yorumu Sil">
                          <Trash2 size={15} />
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
            <div className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/80 rounded-2xl shadow-sm p-6 flex-1 flex flex-col">
              <h3 className="text-base font-bold text-slate-800 dark:text-zinc-200 mb-5">Yetki Talepleri</h3>
              {requests.length === 0 ? (
                <div className="text-center py-16 border border-dashed border-slate-200 dark:border-zinc-800 rounded-xl text-slate-400 flex flex-col items-center gap-3 flex-1 justify-center">
                  <UserCheck size={36} className="text-slate-300" />
                  <span className="text-sm">Bekleyen yazar/yönetici yetki talebi bulunmamaktadır.</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3.5">
                  {requests.map(req => (
                    <div key={req.id} className="p-4 border border-slate-100 dark:border-zinc-800/60 rounded-xl bg-slate-50/50 dark:bg-zinc-900/30 flex flex-wrap items-center justify-between gap-4 hover:border-indigo-500/20 transition-all duration-200">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold overflow-hidden shadow-inner shrink-0">
                          {req.avatar ? (
                            <img src={req.avatar} alt={req.name} className="w-full h-full object-cover" />
                          ) : (
                            req.name.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-800 dark:text-zinc-200 text-sm leading-tight">{req.name}</div>
                          <div className="text-xs text-slate-400 mt-1">{req.email}</div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApprove(req.id)}
                          disabled={actionLoadingId === req.id}
                          className="flex items-center gap-1 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow shadow-emerald-600/10 transition-all"
                        >
                          <Check size={13} />
                          {actionLoadingId === req.id ? 'Onaylanıyor...' : 'Onayla'}
                        </button>
                        <button
                          onClick={() => handleReject(req.id)}
                          disabled={actionLoadingId === req.id}
                          className="flex items-center gap-1 px-4 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/10 text-slate-600 dark:text-zinc-300 text-xs font-semibold transition-all"
                        >
                          <X size={13} />
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
            <div className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/80 rounded-2xl shadow-sm p-6 flex-1 flex flex-col">
              <h3 className="text-base font-bold text-slate-800 dark:text-zinc-200 mb-5">Bülten Abone Listesi</h3>
              {subscribers.length === 0 ? (
                <div className="text-center py-16 border border-dashed border-slate-200 dark:border-zinc-800 rounded-xl text-slate-400 flex flex-col items-center gap-3 flex-1 justify-center">
                  <Mail size={36} className="text-slate-300" />
                  <span className="text-sm">Kayıtlı e-bülten abonesi bulunmamaktadır.</span>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-100 dark:divide-zinc-800">
                    <thead className="bg-slate-50/20 dark:bg-zinc-900/10">
                      <tr>
                        <th className="px-6 py-3.5 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">E-posta Adresi</th>
                        <th className="px-6 py-3.5 text-right text-[11px] font-bold text-slate-400 uppercase tracking-wider">Kayıt Tarihi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-zinc-800 bg-white dark:bg-zinc-900">
                      {subscribers.map(sub => (
                        <tr key={sub.id} className="hover:bg-slate-50/40 dark:hover:bg-zinc-800/20 transition">
                          <td className="px-6 py-4 text-sm font-semibold text-slate-700 dark:text-zinc-200">{sub.email}</td>
                          <td className="px-6 py-4 text-right text-xs text-slate-400">
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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 items-start">
              
              {/* Top 3 posts */}
              <div className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/80 rounded-2xl shadow-sm p-6">
                <h3 className="text-sm font-bold text-slate-800 dark:text-zinc-200 mb-5 flex items-center gap-2">
                  <TrendingUp size={16} className="text-indigo-500" /> En Çok Okunan Yazılar
                </h3>
                <div className="flex flex-col gap-4">
                  {topPosts.map((post, i) => (
                    <div key={post.id}>
                      <div className="flex justify-between items-center mb-1">
                        <div className="flex gap-2.5 items-center">
                          <span className={`w-5 h-5 rounded-full text-white flex items-center justify-center text-[10px] font-bold ${
                            i === 0 ? 'bg-indigo-600' : i === 1 ? 'bg-indigo-500' : 'bg-slate-400'
                          }`}>{i + 1}</span>
                          <span className="text-xs font-semibold text-slate-700 dark:text-zinc-300 truncate max-w-xs">{post.title}</span>
                        </div>
                        <span className="text-[10px] text-slate-500 flex items-center gap-1"><Eye size={12} /> {post.views.toLocaleString('tr-TR')}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-slate-100 dark:bg-zinc-800/60 overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${
                            i === 0 ? 'bg-gradient-to-r from-indigo-500 to-indigo-600' : i === 1 ? 'bg-gradient-to-r from-indigo-400 to-indigo-500' : 'bg-slate-400'
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
                <h3 className="text-sm font-bold text-slate-800 dark:text-zinc-200 mb-5 flex items-center gap-2">
                  <BarChart2 size={16} className="text-indigo-500" /> Kategori Dağılımı
                </h3>
                <div className="flex flex-col gap-4">
                  {categoryStats.map(cat => (
                    <div key={cat.name}>
                      <div className="flex justify-between mb-1">
                        <span className="text-xs font-semibold text-slate-700 dark:text-zinc-300">{cat.name}</span>
                        <span className="text-[10px] text-slate-500">{cat.count} yazı · {cat.likes} beğeni</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-slate-100 dark:bg-zinc-800/60 overflow-hidden">
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
              <div className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/80 rounded-2xl shadow-sm p-6 lg:col-span-2">
                <h3 className="text-sm font-bold text-slate-800 dark:text-zinc-200 mb-4 flex items-center gap-2">
                  <Heart size={16} className="text-rose-500" /> Ortalama Beğeni Oranı
                </h3>
                <div className="flex items-end gap-3 mb-3">
                  <div className="text-3xl font-extrabold text-indigo-600 dark:text-indigo-400">%{avgLikeRatio}</div>
                  <div className="text-[10px] text-slate-400 font-medium pb-0.5">görüntülenme başına düşen ortalama beğeni oranı</div>
                </div>
                <div className="h-1.5 rounded-full bg-slate-100 dark:bg-zinc-800/60 overflow-hidden">
                  <div 
                    className="h-full rounded-full bg-gradient-to-r from-rose-500 to-indigo-500"
                    style={{ width: `${Math.min(Number(avgLikeRatio) * 2, 100)}%` }}
                  />
                </div>
              </div>

            </div>
          )}

        </div>
      </main>
    </div>
  );
}
