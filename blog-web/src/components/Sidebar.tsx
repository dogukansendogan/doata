import { Link } from 'react-router-dom';
import { Eye, TrendingUp, Folder, Hash, Mail, Bell } from 'lucide-react';
import type { Post, Category } from '../types';
import TagBadge from './TagBadge';

interface SidebarProps {
  popularPosts: Post[];
  categories: Category[];
  tags: string[];
}

import CategoryIcon from './CategoryIcon';

export default function Sidebar({ popularPosts, categories, tags }: SidebarProps) {
  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Bültene başarıyla abone oldunuz!');
  };

  return (
    <aside className="sidebar fade-in-up" style={{ animationDelay: '0.1s', opacity: 0 }}>
      {/* Popüler Yazılar */}
      <div className="sidebar-widget">
        <h3 className="sidebar-widget-title">
          <TrendingUp size={14} /> Popüler Yazılar
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
          {popularPosts.map((post, i) => (
            <Link
              key={post.id}
              to={`/post/${post.id}`}
              style={{
                display: 'flex', alignItems: 'flex-start', gap: '12px',
                padding: '12px 0',
                borderBottom: i < popularPosts.length - 1 ? '1px solid var(--card-border)' : 'none',
                color: 'inherit', textDecoration: 'none',
                transition: 'color 0.2s',
              }}
              onMouseOver={e => (e.currentTarget as HTMLElement).style.color = 'var(--accent)'}
              onMouseOut={e => (e.currentTarget as HTMLElement).style.color = 'inherit'}
            >
              <span style={{
                fontSize: '1rem', fontWeight: 800, color: 'var(--accent)',
                fontFamily: 'var(--font-display)', minWidth: '20px', lineHeight: 1.4,
              }}>
                {String(i + 1).padStart(2, '0')}
              </span>
              <div style={{ flex: 1 }}>
                <p style={{
                  fontSize: '0.85rem', fontWeight: 600, lineHeight: 1.4,
                  marginBottom: '4px', color: 'inherit',
                }}>
                  {post.title}
                </p>
                <span style={{
                  fontSize: '0.75rem', color: 'var(--text-muted)',
                  display: 'flex', alignItems: 'center', gap: '4px',
                }}>
                  <Eye size={11} /> {post.views.toLocaleString('tr-TR')}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Kategoriler */}
      <div className="sidebar-widget">
        <h3 className="sidebar-widget-title">
          <Folder size={14} /> Kategoriler
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {categories.map(category => (
            <Link
              key={category.id}
              to={`/kategori/${category.slug}`}
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
                <CategoryIcon name={category.name} size={16} />
                {category.name}
              </span>
              <span style={{
                fontSize: '0.75rem', fontWeight: 700,
                background: 'var(--bg-color)', color: 'var(--text-muted)',
                padding: '2px 8px', borderRadius: 'var(--radius-full)',
                border: '1px solid var(--card-border)',
              }}>
                {category.postCount}
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* Etiketler */}
      <div className="sidebar-widget">
        <h3 className="sidebar-widget-title">
          <Hash size={14} /> Etiketler
        </h3>
        <div className="tag-cloud">
          {tags.map(tag => (
            <TagBadge key={tag} tag={tag} />
          ))}
        </div>
      </div>

      {/* Bülten */}
      <div className="sidebar-widget" style={{
        background: 'linear-gradient(135deg, var(--accent-light) 0%, transparent 100%)',
        borderColor: 'var(--accent-mid)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <Bell size={16} style={{ color: 'var(--accent)' }} />
          <h3 style={{
            fontFamily: 'var(--font-sans)', fontSize: '0.72rem', fontWeight: 800,
            textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-secondary)',
            margin: 0,
          }}>
            Bülten
          </h3>
        </div>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: 1.6 }}>
          En yeni yazılardan haberdar olmak için bültenimize abone ol.
        </p>
        <form onSubmit={handleSubscribe} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ position: 'relative' }}>
            <Mail size={14} style={{
              position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
              color: 'var(--text-muted)',
            }} />
            <input
              type="email"
              placeholder="E-posta adresiniz"
              className="form-input"
              required
              style={{ paddingLeft: '34px', fontSize: '0.88rem' }}
            />
          </div>
          <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
            Abone Ol
          </button>
        </form>
      </div>
    </aside>
  );
}
