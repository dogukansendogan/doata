import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import { createPost } from '../api/posts';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { PenSquare, Image, Tag, FolderOpen, FileText, Lock, Upload } from 'lucide-react';

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
  const [extraImages, setExtraImages] = useState<string[]>([]);
  const [imgSizes, setImgSizes] = useState<Record<number, string>>({});
  const [imgAligns, setImgAligns] = useState<Record<number, string>>({});

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        addToast('Dosya boyutu 2MB\'dan büyük olamaz.', 'error');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleExtraImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (extraImages.length >= 4) {
        addToast('En fazla 4 adet ekstra görsel ekleyebilirsiniz.', 'error');
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        addToast('Dosya boyutu 2MB\'dan büyük olamaz.', 'error');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setExtraImages(prev => [...prev, reader.result as string]);
        addToast('Ekstra görsel başarıyla yüklendi! Yazı içine yerleştirebilirsiniz.', 'success');
      };
      reader.readAsDataURL(file);
    }
  };

  const insertAtCursor = (markdownText: string) => {
    const textarea = document.getElementById('content') as HTMLTextAreaElement;
    if (!textarea) return;

    const startPos = textarea.selectionStart;
    const endPos = textarea.selectionEnd;
    const beforeText = content.substring(0, startPos);
    const afterText = content.substring(endPos, content.length);

    setContent(beforeText + markdownText + afterText);
    
    // Auto-focus and place cursor after inserted content
    setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = textarea.selectionEnd = startPos + markdownText.length;
    }, 50);
  };

  const getImageHtml = (img: string, idx: number) => {
    const size = imgSizes[idx] || 'medium';
    const align = imgAligns[idx] || 'center';

    let width = '450';
    if (size === 'small') width = '200';
    if (size === 'large') width = '100%';

    let style = 'border-radius: 8px; display: block; margin: 20px auto; max-width: 100%;';
    if (align === 'left') {
      style = 'border-radius: 8px; float: left; margin: 0 20px 20px 0; max-width: 100%;';
    } else if (align === 'right') {
      style = 'border-radius: 8px; float: right; margin: 0 0 20px 20px; max-width: 100%;';
    }

    return `\n\n<img src="${img}" width="${width}" style="${style}" alt="Görsel" />\n\n`;
  };

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
    <div className="create-post fade-in-up" style={{ maxWidth: previewMode ? '1400px' : '860px', margin: '0 auto', transition: 'max-width 0.3s ease' }}>
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
          style={{ padding: '8px 20px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px', background: previewMode ? 'var(--accent-light)' : 'transparent', borderColor: previewMode ? 'var(--accent)' : 'var(--card-border)' }}
        >
          <Upload size={14} />
          {previewMode ? 'Canlı Önizleme Açık' : 'Yan Panel Önizleme Aç'}
        </button>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: previewMode ? '1fr 1fr' : '1fr',
        gap: '30px',
        alignItems: 'start'
      }}>
        {/* LEFT COLUMN: EDITOR FORM */}
        <div className="glass-card-static" style={{ padding: '28px' }}>
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

            {/* Cover image */}
            <div className="form-group">
              <label className="form-label" htmlFor="coverImage">
                <Image size={14} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} />
                Kapak Görseli
              </label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input
                  id="coverImage"
                  type="text"
                  className="form-input"
                  value={coverImage}
                  onChange={e => setCoverImage(e.target.value)}
                  placeholder="Görsel URL'si yapıştırın veya yerel dosya seçin..."
                  style={{ flex: 1 }}
                />
                <input
                  id="coverImageFile"
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handleFileChange}
                />
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={() => document.getElementById('coverImageFile')?.click()}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap', padding: '10px 16px' }}
                >
                  <Upload size={14} /> Dosya Seç
                </button>
              </div>
              {coverImage && (
                <div style={{ position: 'relative', marginTop: '10px' }}>
                  <img
                    src={coverImage}
                    alt="Preview"
                    style={{
                      width: '100%', maxHeight: '200px',
                      objectFit: 'cover', borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--card-border)',
                    }}
                    onError={e => (e.currentTarget.style.display = 'none')}
                  />
                  <button
                    type="button"
                    className="btn-ghost"
                    onClick={() => setCoverImage('')}
                    style={{
                      position: 'absolute', top: '10px', right: '10px',
                      padding: '4px 10px', fontSize: '0.75rem', background: 'rgba(0,0,0,0.6)',
                      color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)'
                    }}
                  >
                    Kaldır
                  </button>
                </div>
              )}
            </div>

            {/* Extra Image Placer (Up to 4 images) */}
            <div className="form-group" style={{ border: '1px dashed var(--card-border)', padding: '16px', borderRadius: 'var(--radius-md)', background: 'rgba(255,255,255,0.02)', marginTop: '20px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Image size={14} /> Ekstra Görseller ({extraImages.length}/4)
                </span>
                <input
                  id="extraImageFile"
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handleExtraImageUpload}
                  disabled={extraImages.length >= 4}
                />
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={() => document.getElementById('extraImageFile')?.click()}
                  disabled={extraImages.length >= 4}
                  style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                >
                  + Görsel Ekle
                </button>
              </div>

              {extraImages.length === 0 ? (
                <div style={{ textTransform: 'none', fontSize: '0.78rem', color: 'var(--text-muted)', textAlign: 'center', padding: '10px' }}>
                  Henüz ekstra görsel yüklenmedi. Metin içinde kullanmak için resim yükleyebilirsiniz.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {extraImages.map((img, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: '14px', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--card-border)' }}>
                      {/* Image Thumbnail */}
                      <img src={img} alt={`Extra ${idx}`} style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: 'var(--radius-sm)', border: '1px solid var(--card-border)' }} />
                      
                      {/* Settings */}
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {/* Size */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem' }}>
                          <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Boyut:</span>
                          {['small', 'medium', 'large'].map(sz => (
                            <button
                              key={sz}
                              type="button"
                              onClick={() => setImgSizes(prev => ({ ...prev, [idx]: sz }))}
                              style={{
                                padding: '4px 8px',
                                fontSize: '0.7rem',
                                borderRadius: 'var(--radius-sm)',
                                border: '1px solid var(--card-border)',
                                background: (imgSizes[idx] || 'medium') === sz ? 'var(--accent)' : 'transparent',
                                color: (imgSizes[idx] || 'medium') === sz ? '#fff' : 'var(--text-secondary)',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease'
                              }}
                            >
                              {sz === 'small' ? 'Küçük (200px)' : sz === 'medium' ? 'Orta (450px)' : 'Tam Genişlik'}
                            </button>
                          ))}
                        </div>

                        {/* Alignment */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem' }}>
                          <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Hizalama:</span>
                          {['left', 'center', 'right'].map(al => (
                            <button
                              key={al}
                              type="button"
                              onClick={() => setImgAligns(prev => ({ ...prev, [idx]: al }))}
                              style={{
                                padding: '4px 8px',
                                fontSize: '0.7rem',
                                borderRadius: 'var(--radius-sm)',
                                border: '1px solid var(--card-border)',
                                background: (imgAligns[idx] || 'center') === al ? 'var(--accent)' : 'transparent',
                                color: (imgAligns[idx] || 'center') === al ? '#fff' : 'var(--text-secondary)',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease'
                              }}
                            >
                              {al === 'left' ? '⬅ Sol' : al === 'center' ? '⚏ Orta' : '➡ Sağ'}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Actions */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-end' }}>
                        <button
                          type="button"
                          onClick={() => insertAtCursor(getImageHtml(img, idx))}
                          className="btn-primary"
                          style={{ padding: '6px 12px', fontSize: '0.75rem', whiteSpace: 'nowrap' }}
                        >
                          Yazıya Ekle
                        </button>
                        <button
                          type="button"
                          onClick={() => setExtraImages(prev => prev.filter((_, i) => i !== idx))}
                          style={{ background: 'transparent', border: 'none', color: 'var(--danger)', fontSize: '0.75rem', cursor: 'pointer' }}
                        >
                          Sil
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
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
                rows={16}
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

        {/* RIGHT COLUMN: LIVE RENDERED PREVIEW */}
        {previewMode && (
          <div className="glass-card-static fade-in" style={{ padding: '28px', height: 'calc(100vh - 180px)', overflowY: 'auto', position: 'sticky', top: '100px' }}>
            <div style={{ borderBottom: '1px solid var(--card-border)', paddingBottom: '16px', marginBottom: '20px' }}>
              <span className="badge" style={{ background: 'var(--accent-light)', color: 'var(--accent)', marginBottom: '8px' }}>
                {category}
              </span>
              <h1 style={{ fontSize: '1.8rem', fontWeight: 800, margin: '8px 0', lineHeight: 1.25, color: 'var(--text-primary)' }}>
                {title || 'Yazı Başlığı...'}
              </h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontStyle: 'italic', marginTop: '6px' }}>
                {excerpt || 'Kısa özet buraya gelecek...'}
              </p>
            </div>

            {coverImage && (
              <img
                src={coverImage}
                alt="Kapak Görseli"
                style={{
                  width: '100%',
                  maxHeight: '260px',
                  objectFit: 'cover',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: '24px',
                  border: '1px solid var(--card-border)'
                }}
              />
            )}

            <div className="markdown-content">
              <ReactMarkdown rehypePlugins={[rehypeRaw]}>{content || '*Yazı içeriği henüz girilmedi...*'}</ReactMarkdown>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
