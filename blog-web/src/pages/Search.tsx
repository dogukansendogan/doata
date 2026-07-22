import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, X, TrendingUp } from 'lucide-react';
import type { Post } from '../types';
import { searchPosts, getPosts } from '../api/posts';
import PostCard from '../components/PostCard';

const POPULAR_SEARCHES = ['react', 'typescript', 'tasarım', 'startup', 'uzaktan çalışma'];

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [results, setResults] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [inputValue, setInputValue] = useState(query);
  const [trending, setTrending] = useState<Post[]>([]);

  useEffect(() => {
    getPosts().then(p => setTrending(p.slice(0, 3)));
  }, []);

  useEffect(() => {
    setInputValue(query);
    if (!query) { setResults([]); return; }
    setLoading(true);
    searchPosts(query)
      .then(setResults)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [query]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) setSearchParams({ q: inputValue.trim() });
    else setSearchParams({});
  };

  const handleClear = () => {
    setInputValue('');
    setSearchParams({});
  };

  return (
    <div className="search-page fade-in" style={{ maxWidth: '860px', margin: '0 auto' }}>
      {/* Search Header */}
      <div style={{ marginBottom: '40px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          <Search size={20} style={{ color: 'var(--accent)' }} />
          <h1 style={{ fontSize: '1.75rem', margin: 0 }}>Ara</h1>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Tüm yazılar, kategoriler ve etiketlerde arama yapın.
        </p>
      </div>

      {/* Big Search Input */}
      <form onSubmit={handleSubmit} style={{ marginBottom: '40px', position: 'relative' }}>
        <div style={{ position: 'relative' }}>
          <Search size={20} style={{
            position: 'absolute', left: 20, top: '50%', transform: 'translateY(-50%)',
            color: 'var(--text-muted)', pointerEvents: 'none',
          }} />
          <input
            type="text"
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            placeholder="Yazı, kategori veya etiket arayın..."
            style={{
              width: '100%', padding: '18px 56px',
              fontSize: '1.1rem', border: '2px solid var(--card-border)',
              borderRadius: 'var(--radius-lg)', background: 'var(--card-bg)',
              color: 'var(--text-primary)', fontFamily: 'var(--font-sans)',
              transition: 'border-color 0.2s, box-shadow 0.2s', outline: 'none',
            }}
            onFocus={e => {
              e.currentTarget.style.borderColor = 'var(--accent)';
              e.currentTarget.style.boxShadow = '0 0 0 4px var(--accent-light)';
            }}
            onBlur={e => {
              e.currentTarget.style.borderColor = 'var(--card-border)';
              e.currentTarget.style.boxShadow = 'none';
            }}
            autoFocus
          />
          {inputValue && (
            <button
              type="button"
              onClick={handleClear}
              style={{
                position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)',
                background: 'var(--card-border)', border: 'none', borderRadius: '50%',
                width: 24, height: 24, cursor: 'pointer', display: 'flex',
                alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)',
              }}
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Popular searches */}
        {!query && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '14px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>Popüler:</span>
            {POPULAR_SEARCHES.map(term => (
              <button
                key={term}
                type="button"
                onClick={() => { setInputValue(term); setSearchParams({ q: term }); }}
                style={{
                  padding: '4px 12px', borderRadius: 'var(--radius-full)',
                  border: '1px solid var(--card-border)', background: 'transparent',
                  color: 'var(--text-secondary)', fontSize: '0.82rem', cursor: 'pointer',
                  fontFamily: 'var(--font-sans)', transition: 'all 0.2s',
                }}
                onMouseOver={e => {
                  (e.currentTarget as HTMLElement).style.background = 'var(--accent-light)';
                  (e.currentTarget as HTMLElement).style.color = 'var(--accent)';
                  (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent-mid)';
                }}
                onMouseOut={e => {
                  (e.currentTarget as HTMLElement).style.background = 'transparent';
                  (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)';
                  (e.currentTarget as HTMLElement).style.borderColor = 'var(--card-border)';
                }}
              >
                {term}
              </button>
            ))}
          </div>
        )}
      </form>

      {/* Results */}
      {loading ? (
        <div className="loading">Aranıyor...</div>
      ) : query ? (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>
              "{query}" için
            </span>
            <span style={{
              padding: '2px 10px', borderRadius: 'var(--radius-full)',
              background: results.length > 0 ? 'var(--accent-light)' : 'rgba(211,69,69,0.08)',
              color: results.length > 0 ? 'var(--accent)' : 'var(--danger)',
              fontSize: '0.8rem', fontWeight: 700,
            }}>
              {results.length} sonuç
            </span>
          </div>

          {results.length === 0 ? (
            <div className="glass-card" style={{ textAlign: 'center', padding: '60px 40px' }}>
              <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🔍</div>
              <h3 style={{ marginBottom: '8px' }}>Sonuç bulunamadı</h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '20px', fontSize: '0.9rem' }}>
                "<strong>{query}</strong>" ile eşleşen yazı bulunamadı. Farklı kelimeler deneyin.
              </p>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
                {POPULAR_SEARCHES.map(term => (
                  <button
                    key={term}
                    onClick={() => { setInputValue(term); setSearchParams({ q: term }); }}
                    className="btn-ghost"
                    style={{ fontSize: '0.82rem', padding: '6px 14px' }}
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {results.map((post, i) => (
                <div key={post.id} className="fade-in-up" style={{ animationDelay: `${i * 0.05}s`, opacity: 0 }}>
                  <PostCard post={post} />
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* No query — show trending */
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
            <TrendingUp size={16} style={{ color: 'var(--accent)' }} />
            <span style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>
              Öne Çıkan Yazılar
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {trending.map((post, i) => (
              <div key={post.id} className="fade-in-up" style={{ animationDelay: `${i * 0.07}s`, opacity: 0 }}>
                <PostCard post={post} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
