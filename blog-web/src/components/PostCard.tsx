import { Link } from 'react-router-dom';
import { Clock, Eye, Heart } from 'lucide-react';
import type { Post } from '../types';

interface PostCardProps {
  post: Post;
}

function getInitials(name: string) {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

const CATEGORY_COLORS: Record<string, string> = {
  'Teknoloji':    '#4B6BCC',
  'Tasarım':      '#9B59B6',
  'Yazılım':      '#2ECC71',
  'Yaşam':        '#E8A838',
  'Girişimcilik': '#E74C3C',
  'Kariyer':      '#1ABC9C',
};

export default function PostCard({ post }: PostCardProps) {
  const catColor = CATEGORY_COLORS[post.category] ?? 'var(--accent)';

  return (
    <article className="post-card fade-in-up">
      {/* Thumbnail */}
      <div className="post-card-body">
        {/* Meta row */}
        <div className="post-card-meta">
          <Link
            to={`/kategori/${post.category.toLowerCase().replace(/ /g, '-')}`}
            className="badge"
            style={{
              background: `${catColor}18`,
              color: catColor,
              borderColor: `${catColor}35`,
            }}
          >
            {post.category}
          </Link>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>
            {new Date(post.createdAt).toLocaleDateString('tr-TR', {
              day: 'numeric', month: 'short', year: 'numeric'
            })}
          </span>
        </div>

        {/* Title */}
        <Link to={`/post/${post.id}`}>
          <h2 className="post-card-title">{post.title}</h2>
        </Link>

        {/* Excerpt */}
        <p className="post-card-excerpt">{post.excerpt}</p>

        {/* Footer */}
        <div className="post-card-footer">
          <div className="post-card-author">
            <div className="author-avatar-placeholder">
              {getInitials(post.author)}
            </div>
            <div>
              <Link
                to={`/yazar/${post.author}`}
                style={{ fontWeight: 600, fontSize: '0.85rem', display: 'block', lineHeight: 1.2 }}
              >
                {post.author}
              </Link>
            </div>
          </div>

          <div className="post-card-stats">
            <span className="post-card-stat" title="Okuma süresi">
              <Clock size={13} />
              {post.readingTime} dk
            </span>
            <span className="post-card-stat" title="Görüntülenme">
              <Eye size={13} />
              {post.views}
            </span>
            <span
              className="post-card-stat"
              style={{ color: post.isLiked ? 'var(--danger)' : 'inherit' }}
              title="Beğeni"
            >
              <Heart size={13} fill={post.isLiked ? 'currentColor' : 'none'} />
              {post.likes}
            </span>
          </div>
        </div>
      </div>

      {/* Cover image */}
      <div className="post-card-thumb">
        {post.coverImage ? (
          <img src={post.coverImage} alt={post.title} loading="lazy" />
        ) : (
          <div className="post-card-thumb-placeholder">
            {post.category === 'Teknoloji' ? '💻' :
             post.category === 'Tasarım' ? '🎨' :
             post.category === 'Yazılım' ? '⚙️' :
             post.category === 'Yaşam' ? '🌿' :
             post.category === 'Girişimcilik' ? '🚀' : '📝'}
          </div>
        )}
      </div>
    </article>
  );
}
