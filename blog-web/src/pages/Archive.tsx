import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Clock, Eye, Heart, Archive as ArchiveIcon, Filter } from 'lucide-react';
import type { Post } from '../types';
import { getPosts } from '../api/posts';

export default function Archive() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState<string>('all');

  useEffect(() => {
    getPosts()
      .then(setPosts)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Get unique years
  const years = ['all', ...Array.from(new Set(posts.map(p => new Date(p.createdAt).getFullYear().toString()))).sort((a, b) => Number(b) - Number(a))];

  const filtered = selectedYear === 'all' ? posts : posts.filter(p => new Date(p.createdAt).getFullYear().toString() === selectedYear);

  // Group by month
  const grouped = filtered.reduce((acc, post) => {
    const date = new Date(post.createdAt);
    const key = date.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });
    if (!acc[key]) acc[key] = [];
    acc[key].push(post);
    return acc;
  }, {} as Record<string, Post[]>);

  return (
    <div className="archive-page fade-in" style={{ maxWidth: '860px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '40px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <ArchiveIcon size={20} style={{ color: 'var(--accent)' }} />
            <h1 style={{ fontSize: '1.75rem', margin: 0 }}>Arşiv</h1>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Toplam <strong style={{ color: 'var(--accent)' }}>{posts.length}</strong> yazı
          </p>
        </div>

        {/* Year filter */}
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
          <Filter size={14} style={{ color: 'var(--text-muted)' }} />
          {years.map(year => (
            <button
              key={year}
              onClick={() => setSelectedYear(year)}
              style={{
                padding: '6px 14px', borderRadius: 'var(--radius-full)',
                border: '1px solid', cursor: 'pointer', fontFamily: 'var(--font-sans)',
                fontSize: '0.82rem', fontWeight: 600, transition: 'all 0.2s',
                borderColor: selectedYear === year ? 'var(--accent)' : 'var(--card-border)',
                background: selectedYear === year ? 'var(--accent)' : 'transparent',
                color: selectedYear === year ? '#fff' : 'var(--text-secondary)',
              }}
            >
              {year === 'all' ? 'Tümü' : year}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="loading">Yükleniyor...</div>
      ) : Object.keys(grouped).length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '60px' }}>
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📂</div>
          <h3>Sonuç bulunamadı</h3>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {Object.entries(grouped).map(([monthYear, monthPosts]) => (
            <div key={monthYear}>
              {/* Month header */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px',
              }}>
                <h2 style={{
                  fontSize: '1rem', fontFamily: 'var(--font-sans)',
                  fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em',
                  color: 'var(--accent)', margin: 0,
                }}>
                  {monthYear}
                </h2>
                <span style={{
                  padding: '2px 10px', borderRadius: 'var(--radius-full)',
                  background: 'var(--accent-light)', color: 'var(--accent)',
                  fontSize: '0.75rem', fontWeight: 700,
                  border: '1px solid var(--accent-mid)',
                }}>
                  {monthPosts.length} yazı
                </span>
                <div style={{ flex: 1, height: '1px', background: 'var(--card-border)' }} />
              </div>

              {/* Post list */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {monthPosts.map((post, i) => (
                  <Link
                    key={post.id}
                    to={`/post/${post.id}`}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '120px 1fr auto',
                      gap: '16px',
                      alignItems: 'center',
                      padding: '14px 18px',
                      background: 'var(--card-bg)',
                      border: '1px solid var(--card-border)',
                      borderRadius: 'var(--radius-md)',
                      color: 'inherit', textDecoration: 'none',
                      transition: 'all 0.2s',
                      animationDelay: `${i * 0.04}s`,
                    }}
                    className="fade-in-up"
                    onMouseOver={e => {
                      (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent-mid)';
                      (e.currentTarget as HTMLElement).style.background = 'var(--accent-light)';
                      (e.currentTarget as HTMLElement).style.transform = 'translateX(4px)';
                    }}
                    onMouseOut={e => {
                      (e.currentTarget as HTMLElement).style.borderColor = 'var(--card-border)';
                      (e.currentTarget as HTMLElement).style.background = 'var(--card-bg)';
                      (e.currentTarget as HTMLElement).style.transform = 'none';
                    }}
                  >
                    {/* Date */}
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{
                        fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent)',
                        fontFamily: 'var(--font-display)', lineHeight: 1,
                      }}>
                        {new Date(post.createdAt).toLocaleDateString('tr-TR', { day: 'numeric' })}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                        {new Date(post.createdAt).toLocaleDateString('tr-TR', { month: 'short' })}
                      </span>
                    </div>

                    {/* Content */}
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span className="badge" style={{ fontSize: '0.66rem' }}>{post.category}</span>
                      </div>
                      <h3 style={{ fontSize: '0.95rem', fontWeight: 600, margin: 0, lineHeight: 1.35 }}>
                        {post.title}
                      </h3>
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                        {post.author}
                      </p>
                    </div>

                    {/* Stats */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-end', flexShrink: 0 }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        <Eye size={12} /> {post.views}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        <Heart size={12} /> {post.likes}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        <Clock size={12} /> {post.readingTime}dk
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
