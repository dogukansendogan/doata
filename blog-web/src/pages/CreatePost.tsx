import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPost } from '../api/posts';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { PenSquare, Image, Tag, FolderOpen, FileText, Lock } from 'lucide-react';

import { sanitizeString } from '../security/sanitizer';
import { validateCsrfToken } from '../security/csrfGuard';

const CATEGORIES = ['Teknoloji', 'Tasarım', 'Yazılım', 'Kariyer', 'Yaşam', 'Girişimcilik'];

export default function CreatePost() {
  const { user, isAdmin } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [category, setCategory] = useState('Teknoloji');
  const [tags, setTags] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  // Not logged in
  if (!user) {
    return (
      <div className="fade-in-up" style={{ maxWidth: '480px', margin: '80px auto' }}>
        <div className="glass-card" style={{ textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', padding: '20px', borderRadius: '50%', background: 'var(--accent-light)', color: 'var(--accent)', marginBottom: '16px' }}>
            <Lock size={36} />
          </div>
          <h2 style={{ marginBottom: '12px' }}>Giriş Gerekli</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
            Bu sayfaya erişmek için giriş yapmalısınız.
          </p>
          <button onClick={() => navigate('/login')} className="btn-primary">
            Giriş Yap
          </button>
        </div>
      </div>
    );
  }

  // Logged in but not admin
  if (!isAdmin) {
    return (
      <div className="fade-in-up" style={{ maxWidth: '520px', margin: '80px auto' }}>
        <div className="glass-card" style={{ textAlign: 'center' }}>
          <div style={{
            display: 'inline-flex', padding: '20px', borderRadius: '50%',
            background: 'rgba(211, 69, 69, 0.08)', marginBottom: '20px',
          }}>
            <Lock size={36} style={{ color: 'var(--danger)' }} />
          </div>
          <h2 style={{ marginBottom: '12px' }}>Yetkiniz Yok</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '8px' }}>
            Yazı oluşturma yetkisi yalnızca <strong>yöneticilere</strong> aittir.
          </p>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '28px' }}>
            Mevcut yazıları okuyabilir, beğenebilir ve yorum yapabilirsiniz.
          </p>
          <button onClick={() => navigate('/')} className="btn-primary">
            Ana Sayfaya Dön
          </button>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // CSRF Protection Check
    if (!user.csrfToken || !validateCsrfToken(user.csrfToken)) {
      addToast('CSRF doğrulaması başarısız. Oturum güvenliğiniz tehlikede.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const tagList = tags.split(',').map(t => t.trim()).filter(Boolean);
      
      // XSS Input Sanitization
      const cleanTitle = sanitizeString(title);
      const cleanExcerpt = sanitizeString(excerpt);
      const cleanContent = sanitizeString(content);

      const newPost = await createPost({
        title: cleanTitle,
        content: cleanContent,
        excerpt: cleanExcerpt,
        category,
        tags: tagList,
        author: user.name,
        coverImage: coverImage || undefined,
      });
      addToast('Yazı başarıyla yayınlandı! 🎉', 'success');
      navigate(`/post/${newPost.id}`);
    } catch (error) {
      console.error("Yazı eklenirken hata oluştu:", error);
      addToast('Yazı eklenirken bir hata oluştu', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="create-post fade-in-up" style={{ maxWidth: '860px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            padding: '10px', borderRadius: 'var(--radius-md)',
            background: 'var(--accent-light)', color: 'var(--accent)',
          }}>
            <PenSquare size={22} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.75rem', margin: 0 }}>Yeni Yazı</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '2px' }}>
              Admin paneli · {user.name}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setPreviewMode(!previewMode)}
          className="btn-ghost"
          style={{ padding: '8px 16px', fontSize: '0.85rem' }}
        >
          {previewMode ? 'Düzenle' : 'Önizle'}
        </button>
      </div>

      <div className="glass-card-static">
        <form onSubmit={handleSubmit}>
          {/* Title */}
          <div className="form-group">
            <label className="form-label" htmlFor="title">
              <FileText size={14} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} />
              Başlık
            </label>
            <input
              id="title"
              type="text"
              className="form-input"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Etkileyici bir başlık yazın..."
              required
              style={{ fontSize: '1.1rem', fontWeight: 600 }}
            />
          </div>

          {/* Excerpt */}
          <div className="form-group">
            <label className="form-label" htmlFor="excerpt">Özet</label>
            <textarea
              id="excerpt"
              className="form-input form-textarea"
              value={excerpt}
              onChange={e => setExcerpt(e.target.value)}
              placeholder="Okuyucuyu çekecek kısa bir özet (1-2 cümle)..."
              rows={2}
              required
            />
          </div>

          {/* Category + Tags */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="category">
                <FolderOpen size={14} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} />
                Kategori
              </label>
              <select
                id="category"
                className="form-input"
                value={category}
                onChange={e => setCategory(e.target.value)}
              >
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="tags">
                <Tag size={14} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} />
                Etiketler
              </label>
              <input
                id="tags"
                type="text"
                className="form-input"
                value={tags}
                onChange={e => setTags(e.target.value)}
                placeholder="react, typescript, webdev"
              />
            </div>
          </div>

          {/* Cover image URL */}
          <div className="form-group">
            <label className="form-label" htmlFor="coverImage">
              <Image size={14} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} />
              Kapak Görseli URL (opsiyonel)
            </label>
            <input
              id="coverImage"
              type="url"
              className="form-input"
              value={coverImage}
              onChange={e => setCoverImage(e.target.value)}
              placeholder="https://images.unsplash.com/..."
            />
            {coverImage && (
              <img
                src={coverImage}
                alt="Preview"
                style={{
                  marginTop: '10px', width: '100%', maxHeight: '200px',
                  objectFit: 'cover', borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--card-border)',
                }}
                onError={e => (e.currentTarget.style.display = 'none')}
              />
            )}
          </div>

          {/* Content */}
          <div className="form-group">
            <label className="form-label" htmlFor="content" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>İçerik</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--accent)', fontWeight: 500 }}>
                ✦ Markdown desteklenir
              </span>
            </label>
            <textarea
              id="content"
              className="form-input form-textarea"
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="# Başlık&#10;&#10;İçeriğinizi buraya yazın. **Kalın**, *italik*, `kod` ve daha fazlası...&#10;&#10;## Alt Başlık&#10;&#10;Paragraf içeriği..."
              rows={18}
              required
              style={{ fontFamily: "'Fira Code', 'Cascadia Code', monospace", fontSize: '0.9rem', lineHeight: 1.7 }}
            />
          </div>

          {/* Submit */}
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <button
              type="submit"
              className="btn-primary"
              disabled={isSubmitting}
              style={{ padding: '13px 32px', fontSize: '1rem' }}
            >
              {isSubmitting ? 'Yayınlanıyor...' : '🚀 Yazıyı Yayınla'}
            </button>
            <button
              type="button"
              className="btn-ghost"
              onClick={() => navigate(-1)}
              style={{ padding: '13px 20px' }}
            >
              İptal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
