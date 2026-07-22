import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowRight, Clock } from 'lucide-react';
import type { Post, Category } from '../types';
import { getPosts, getPopularPosts, getCategories, getAllTags } from '../api/posts';
import PostCard from '../components/PostCard';
import Sidebar from '../components/Sidebar';
import SearchBar from '../components/SearchBar';

// Featured grid card component
function FeaturedMain({ post }: { post: Post }) {
  const navigate = useNavigate();
  return (
    <div className="featured-main" onClick={() => navigate(`/post/${post.id}`)}>
      <img
        src={post.coverImage ?? `https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=900&q=80`}
        alt={post.title}
        loading="eager"
      />
      <div className="featured-content">
        <div className="featured-meta">
          <span className="featured-badge">{post.category}</span>
          <span className="featured-read-time">
            <Clock size={12} /> {post.readingTime} dk okuma
          </span>
        </div>
        <h2>{post.title}</h2>
        <p>{post.excerpt}</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: 24, height: 24, borderRadius: '50%',
            background: 'rgba(255,255,255,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.7rem', fontWeight: 700, color: '#fff', flexShrink: 0,
          }}>
            {post.author.charAt(0).toUpperCase()}
          </div>
          <span style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.8)', fontWeight: 500 }}>
            {post.author}
          </span>
          <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.78rem' }}>
            · {new Date(post.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })}
          </span>
        </div>
      </div>
    </div>
  );
}

function FeaturedSecondary({ post }: { post: Post }) {
  const navigate = useNavigate();
  return (
    <div className="featured-secondary" onClick={() => navigate(`/post/${post.id}`)}>
      <img
        src={post.coverImage ?? `https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=600&q=80`}
        alt={post.title}
        loading="lazy"
      />
      <div className="featured-content">
        <div className="featured-meta">
          <span className="featured-badge">{post.category}</span>
        </div>
        <h3>{post.title}</h3>
      </div>
    </div>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>([]);
  const [popularPosts, setPopularPosts] = useState<Post[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [postsData, popularData, categoriesData, tagsData] = await Promise.all([
          getPosts(),
          getPopularPosts(5),
          getCategories(),
          getAllTags()
        ]);
        setPosts(postsData);
        setPopularPosts(popularData);
        setCategories(categoriesData);
        setTags(tagsData);
      } catch (error) {
        console.error("Veriler getirilemedi:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSearch = (query: string) => {
    if (query.trim()) navigate(`/arama?q=${encodeURIComponent(query)}`);
    else navigate('/');
  };

  const featuredPost = posts[0] ?? null;
  const secondaryPosts = posts.slice(1, 3);
  const listPosts = posts.slice(3);

  return (
    <div className="home-page">
      {/* Hero */}
      <div className="home-hero fade-in">
        <span className="home-hero-eyebrow">✦ Teknoloji, Tasarım & Yazılım</span>
        <h1>Merak Ettiğin Her Şey<br />Burada Başlıyor</h1>
        <p>En güncel yazılım, tasarım ve teknoloji yazılarını keşfedin. Öğrenin, ilham alın, büyüyün.</p>
      </div>

      {/* Search */}
      <div style={{ marginBottom: '40px' }}>
        <SearchBar onSearch={handleSearch} />
      </div>

      {loading ? (
        <div className="loading">Yazılar yükleniyor...</div>
      ) : (
        <>
          {/* Featured Magazine Grid */}
          {posts.length >= 1 && (
            <section style={{ marginBottom: '56px' }}>
              <div className="section-header">
                <span className="section-title">Öne Çıkanlar</span>
                <Link to="/arsiv" className="section-link">
                  Tümünü Gör <ArrowRight size={14} />
                </Link>
              </div>

              <div className="featured-grid">
                {featuredPost && <FeaturedMain post={featuredPost} />}
                {secondaryPosts.map(post => (
                  <FeaturedSecondary key={post.id} post={post} />
                ))}
              </div>
            </section>
          )}

          {/* Main content + sidebar */}
          <div className="layout-two-col">
            {/* Left: Article list */}
            <div>
              <div className="section-header">
                <span className="section-title">En Son Yazılar</span>
              </div>

              {listPosts.length === 0 && posts.length < 4 ? (
                <div className="glass-card" style={{ textAlign: 'center', padding: '40px' }}>
                  Henüz hiç yazı bulunmuyor.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {(listPosts.length > 0 ? listPosts : posts).map((post, i) => (
                    <div
                      key={post.id}
                      className="fade-in-up"
                      style={{ animationDelay: `${i * 0.06}s`, opacity: 0 }}
                    >
                      <PostCard post={post} />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right: Sidebar */}
            <div>
              <Sidebar popularPosts={popularPosts} categories={categories} tags={tags} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
