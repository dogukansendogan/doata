import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bookmark, ArrowRight } from 'lucide-react';
import type { Post } from '../types';
import { getBookmarkedPosts } from '../api/posts';
import PostCard from '../components/PostCard';
import { useAuth } from '../context/AuthContext';

export default function Bookmarks() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getBookmarkedPosts()
      .then(setPosts)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="bookmarks-page fade-in" style={{ maxWidth: '860px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: '36px', flexWrap: 'wrap', gap: '16px',
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <div style={{
              width: 40, height: 40, borderRadius: 'var(--radius-md)',
              background: 'var(--accent-light)', color: 'var(--accent)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Bookmark size={18} />
            </div>
            <h1 style={{ fontSize: '1.75rem', margin: 0 }}>Kaydedilenler</h1>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>
            Daha sonra okumak için kaydettiğiniz yazılar
          </p>
        </div>
        {posts.length > 0 && (
          <span style={{
            padding: '4px 14px', borderRadius: 'var(--radius-full)',
            background: 'var(--accent-light)', color: 'var(--accent)',
            border: '1px solid var(--accent-mid)', fontSize: '0.82rem', fontWeight: 700,
          }}>
            {posts.length} yazı
          </span>
        )}
      </div>

      {loading ? (
        <div className="loading">Yükleniyor...</div>
      ) : !user ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '60px 40px' }}>
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🔐</div>
          <h3 style={{ marginBottom: '8px' }}>Giriş Yapmanız Gerekiyor</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '0.9rem' }}>
            Kaydedilen yazıları görmek için hesabınıza giriş yapın.
          </p>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
            <Link to="/login" className="btn-primary">Giriş Yap</Link>
            <Link to="/register" className="btn-ghost">Kayıt Ol</Link>
          </div>
        </div>
      ) : posts.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '60px 40px' }}>
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📚</div>
          <h3 style={{ marginBottom: '8px' }}>Henüz kayıt yok</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '0.9rem', maxWidth: '360px', margin: '0 auto 24px' }}>
            Bir yazıyı okurken <strong>🔖 kaydet</strong> butonuna tıklayarak buraya ekleyebilirsiniz.
          </p>
          <Link to="/" className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            Yazılara Göz At <ArrowRight size={16} />
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {posts.map((post, i) => (
            <div key={post.id} className="fade-in-up" style={{ animationDelay: `${i * 0.06}s`, opacity: 0 }}>
              <PostCard post={post} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
