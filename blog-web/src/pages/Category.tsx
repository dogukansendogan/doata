import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Tag, ArrowRight, FolderOpen } from 'lucide-react';
import type { Post } from '../types';
import { getPostsByCategory, getCategories } from '../api/posts';
import type { Category as CategoryType } from '../types';
import PostCard from '../components/PostCard';
import CategoryIcon from '../components/CategoryIcon';

const CATEGORY_META: Record<string, { desc: string; color: string }> = {
  'Teknoloji':    { desc: 'Web, mobil, donanım ve geleceğin teknolojileri', color: '#4B6BCC' },
  'Tasarım':      { desc: 'UI/UX, grafik tasarım ve yaratıcı süreçler', color: '#9B59B6' },
  'Yazılım':      { desc: 'Programlama dilleri, algoritmalar ve mimari', color: '#2ECC71' },
  'Yaşam':        { desc: 'Verimlilik, sağlık ve iş-yaşam dengesi', color: '#E8A838' },
  'Girişimcilik': { desc: 'Startup kurmak, büyütmek ve ölçeklendirmek', color: '#E74C3C' },
  'Kariyer':      { desc: 'İş hayatı, networking ve kariyer tavsiyeleri', color: '#1ABC9C' },
};

export default function Category() {
  const { slug } = useParams<{ slug: string }>();
  const [posts, setPosts] = useState<Post[]>([]);
  const [categories, setCategories] = useState<CategoryType[]>([]);
  const [loading, setLoading] = useState(true);

  const catName = slug
    ? slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
    : '';

  const meta = CATEGORY_META[catName] ?? { desc: 'Bu kategorideki tüm yazılar', color: 'var(--accent)' };

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    Promise.all([getPostsByCategory(catName), getCategories()])
      .then(([postsData, catsData]) => { setPosts(postsData); setCategories(catsData); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [slug, catName]);

  return (
    <div className="category-page fade-in" style={{ maxWidth: '1000px', margin: '0 auto' }}>
      {/* Category Hero */}
      <div style={{
        background: `linear-gradient(135deg, ${meta.color}15 0%, ${meta.color}08 100%)`,
        border: `1px solid ${meta.color}30`,
        borderRadius: 'var(--radius-lg)', padding: '40px 36px', marginBottom: '40px',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', right: 32, top: '50%', transform: 'translateY(-50%)', opacity: 0.12, color: meta.color }}>
          <CategoryIcon name={catName} size={96} />
        </div>
        <div style={{ position: 'relative' }}>
          <div style={{ marginBottom: '16px', color: meta.color }}>
            <CategoryIcon name={catName} size={36} />
          </div>
          <h1 style={{ fontSize: '2rem', marginBottom: '8px' }}>{catName}</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '16px' }}>{meta.desc}</p>
          <span style={{
            display: 'inline-block', padding: '3px 12px', borderRadius: 'var(--radius-full)',
            background: `${meta.color}20`, color: meta.color, border: `1px solid ${meta.color}40`,
            fontSize: '0.8rem', fontWeight: 700,
          }}>
            {loading ? '...' : posts.length} yazı
          </span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 240px', gap: '40px', alignItems: 'start' }}>
        {/* Posts */}
        <div>
          {loading ? (
            <div className="loading">Yükleniyor...</div>
          ) : posts.length === 0 ? (
            <div className="glass-card" style={{ textAlign: 'center', padding: '60px' }}>
              <div style={{ color: 'var(--text-muted)', marginBottom: '16px', display: 'flex', justifyContent: 'center' }}>
                <FolderOpen size={48} />
              </div>
              <h3 style={{ marginBottom: '8px' }}>Henüz yazı yok</h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '20px', fontSize: '0.9rem' }}>
                Bu kategori yakında içeriklerle dolacak.
              </p>
              <Link to="/" className="btn-primary">Tüm Yazılara Dön</Link>
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

        {/* Other Categories Sidebar */}
        <div style={{ position: 'sticky', top: 100 }}>
          <div className="sidebar-widget">
            <h3 className="sidebar-widget-title">
              <Tag size={14} /> Diğer Kategoriler
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {categories
                .filter(c => c.name !== catName)
                .map(cat => {
                  return (
                    <Link
                      key={cat.id}
                      to={`/kategori/${cat.slug}`}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '9px 12px', borderRadius: 'var(--radius-sm)',
                        transition: 'all 0.2s', color: 'var(--text-secondary)',
                        fontSize: '0.88rem', fontWeight: 500,
                      }}
                      onMouseOver={e => {
                        (e.currentTarget as HTMLElement).style.background = 'var(--accent-light)';
                        (e.currentTarget as HTMLElement).style.color = 'var(--accent)';
                      }}
                      onMouseOut={e => {
                        (e.currentTarget as HTMLElement).style.background = 'transparent';
                        (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)';
                      }}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <CategoryIcon name={cat.name} size={16} />
                        {cat.name}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem' }}>
                        {cat.postCount} <ArrowRight size={12} />
                      </span>
                    </Link>
                  );
                })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
