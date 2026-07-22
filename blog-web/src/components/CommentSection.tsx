import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, Send, Lock } from 'lucide-react';
import type { Comment } from '../types';
import { addComment } from '../api/posts';
import { useAuth } from '../context/AuthContext';

import { sanitizeString } from '../security/sanitizer';
import { isRateLimited, getRemainingCooldown } from '../security/rateLimiter';
import { useToast } from '../context/ToastContext';

interface CommentSectionProps {
  comments: Comment[];
  postId: string;
  onCommentAdded: (comment: Comment) => void;
}

function getInitials(name: string) {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

const AVATAR_COLORS = ['#4B6BCC', '#9B59B6', '#2ECC71', '#E8A838', '#E74C3C', '#1ABC9C', '#C25934'];
function avatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export default function CommentSection({ comments, postId, onCommentAdded }: CommentSectionProps) {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !content.trim()) return;

    // Rate limiting: Max 3 comments per 1 minute
    if (isRateLimited(`comment_${user.id}`, 3, 60000)) {
      const cooldown = getRemainingCooldown(`comment_${user.id}`, 60000);
      addToast(`Çok hızlı yorum yazıyorsunuz. Lütfen ${cooldown} saniye bekleyin.`, 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const sanitizedContent = sanitizeString(content);
      const newComment = await addComment(postId, user.name, sanitizedContent);
      if (newComment) {
        onCommentAdded(newComment);
        setContent('');
      }
    } catch (error) {
      console.error('Yorum eklenirken hata oluştu:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="comment-section">
      {/* Section header */}
      <h3 className="comments-title">
        <MessageSquare size={16} style={{ color: 'var(--accent)' }} />
        {comments.length} Yorum
      </h3>

      {/* Comments list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px' }}>
        {comments.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '40px 20px',
            color: 'var(--text-muted)', fontSize: '0.9rem',
            background: 'var(--bg-color)', borderRadius: 'var(--radius-md)',
            border: '1px dashed var(--card-border)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px',
          }}>
            <MessageSquare size={36} style={{ color: 'var(--text-muted)' }} />
            <span>Henüz yorum yapılmamış. İlk yorumu sen yap!</span>
          </div>
        ) : (
          comments.map((comment, i) => (
            <div
              key={comment.id}
              className="comment-item fade-in-up"
              style={{ animationDelay: `${i * 0.05}s`, opacity: 0 }}
            >
              <div className="comment-header">
                <div className="comment-author-info">
                  <div style={{
                    width: 36, height: 36,
                    borderRadius: '50%',
                    background: avatarColor(comment.author),
                    color: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.75rem', fontWeight: 700, flexShrink: 0,
                  }}>
                    {getInitials(comment.author)}
                  </div>
                  <div>
                    <div className="comment-author">{comment.author}</div>
                    <div className="comment-date">
                      {new Date(comment.createdAt).toLocaleDateString('tr-TR', {
                        day: 'numeric', month: 'long', year: 'numeric'
                      })}
                    </div>
                  </div>
                </div>
              </div>
              <p className="comment-content" style={{ marginLeft: '46px' }}>{comment.content}</p>
            </div>
          ))
        )}
      </div>

      {/* Comment form — only for logged-in users */}
      {user ? (
        <div className="glass-card-static">
          <h4 style={{ marginBottom: '16px', fontSize: '1rem', fontWeight: 700, fontFamily: 'var(--font-sans)' }}>
            Yorum Yaz
          </h4>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            marginBottom: '14px', fontSize: '0.85rem', color: 'var(--text-secondary)',
          }}>
            <div style={{
              width: 30, height: 30, borderRadius: '50%',
              background: avatarColor(user.name), color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.72rem', fontWeight: 700,
            }}>
              {getInitials(user.name)}
            </div>
            <span><strong style={{ color: 'var(--text-primary)' }}>{user.name}</strong> olarak yorum yapıyorsunuz</span>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="form-group" style={{ marginBottom: '14px' }}>
              <textarea
                placeholder="Düşüncelerinizi paylaşın..."
                value={content}
                onChange={e => setContent(e.target.value)}
                className="form-input form-textarea"
                rows={4}
                required
              />
            </div>
            <button
              type="submit"
              className="btn-primary"
              disabled={isSubmitting || !content.trim()}
              style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <Send size={16} />
              {isSubmitting ? 'Gönderiliyor...' : 'Yorum Gönder'}
            </button>
          </form>
        </div>
      ) : (
        /* Not logged in: prompt to login */
        <div className="comment-login-prompt" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
          <Lock size={36} style={{ color: 'var(--accent)' }} />
          <p>Yorum yapabilmek için giriş yapmanız gerekmektedir.</p>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/login" className="btn-primary" style={{ padding: '10px 24px' }}>
              Giriş Yap
            </Link>
            <Link to="/register" className="btn-ghost" style={{ padding: '10px 24px' }}>
              Kayıt Ol
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
