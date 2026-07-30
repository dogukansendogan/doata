import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Save, Eye, Image, Upload } from 'lucide-react';
import { getPostById, updatePost, getCategories } from '../../api/posts';
import { useToast } from '../../context/ToastContext';

export default function EditPost() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [title, setTitle] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('Teknoloji');
  const [tags, setTags] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [dbCategories, setDbCategories] = useState<string[]>([]);

  useEffect(() => {
    const fetchCats = async () => {
      try {
        const list = await getCategories();
        setDbCategories(list.map(c => c.name));
      } catch (err) {
        console.error('Error fetching categories:', err);
      }
    };
    fetchCats();
  }, []);

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
        setImageError(false);
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    const fetchPost = async () => {
      if (!id) return;
      try {
        const data = await getPostById(id);
        if (data) {
          setTitle(data.title);
          setExcerpt(data.excerpt);
          setContent(data.content);
          setCategory(data.category);
          setTags(data.tags.join(', '));
          setCoverImage(data.coverImage ?? '');
        } else {
          addToast('Yazı bulunamadı.', 'error');
          navigate('/admin');
        }
      } catch (error) {
        console.error('Yazı getirilemedi', error);
        addToast('Yazı yüklenirken hata oluştu.', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
  }, [id, navigate, addToast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !title || !content || !excerpt) return;

    setSaving(true);
    try {
      const tagsArray = tags.split(',').map(t => t.trim()).filter(Boolean);
      await updatePost(id, { title, excerpt, content, category, tags: tagsArray, coverImage });
      addToast('Yazı başarıyla güncellendi! ✓', 'success');
      navigate('/admin');
    } catch (error) {
      console.error('Yazı güncellenemedi', error);
      addToast('Kaydedilirken bir hata oluştu.', 'error');
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', flexDirection: 'column', gap: '16px' }}>
        <div style={{ width: '36px', height: '36px', border: '3px solid var(--accent-mid)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <span style={{ color: 'var(--text-secondary)' }}>Yazı yükleniyor...</span>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div className="fade-in" style={{ maxWidth: '820px', margin: '0 auto', padding: '32px 20px' }}>

      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <button
            onClick={() => navigate('/admin')}
            className="btn-ghost"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', fontSize: '0.88rem' }}
          >
            <ArrowLeft size={16} /> Geri
          </button>
          <div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>
              Yazıyı Düzenle
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginTop: '3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '320px' }}>
              {title || 'Yükleniyor...'}
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          {id && (
            <Link
              to={`/post/${id}`}
              className="btn-ghost"
              target="_blank"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.88rem', padding: '8px 14px' }}
            >
              <Eye size={15} /> Yazıyı Gör
            </Link>
          )}
          <button
            type="submit"
            form="edit-post-form"
            className="btn-primary"
            disabled={saving}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.88rem', padding: '8px 18px' }}
          >
            <Save size={15} /> {saving ? 'Kaydediliyor...' : 'Kaydet'}
          </button>
        </div>
      </div>

      <form id="edit-post-form" onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '24px', alignItems: 'start' }}>

          {/* LEFT: Main fields */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {/* Title */}
            <div className="glass-card-static" style={{ padding: '22px 24px' }}>
              <h2 style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '14px' }}>
                Temel Bilgiler
              </h2>
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="form-label" htmlFor="title">Başlık</label>
                <input
                  id="title"
                  className="form-input"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Yazı başlığını girin..."
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="excerpt">
                  Kısa Özet <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>({excerpt.length}/150)</span>
                </label>
                <input
                  id="excerpt"
                  className="form-input"
                  value={excerpt}
                  onChange={e => setExcerpt(e.target.value)}
                  maxLength={150}
                  placeholder="Okuyucuyu çekecek kısa bir özet..."
                  required
                />
              </div>
            </div>

            {/* Content */}
            <div className="glass-card-static" style={{ padding: '22px 24px' }}>
              <h2 style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '14px' }}>
                İçerik
              </h2>
              <div className="form-group">
                <label className="form-label" htmlFor="content">Markdown / Düz Metin</label>
                <textarea
                  id="content"
                  className="form-input"
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  rows={20}
                  placeholder="Yazınızın içeriğini buraya yazın..."
                  required
                  style={{ fontFamily: 'monospace', fontSize: '0.88rem', lineHeight: 1.7, resize: 'vertical' }}
                />
              </div>
            </div>
          </div>

          {/* RIGHT: Sidebar settings */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {/* Cover image */}
            <div className="glass-card-static" style={{ padding: '20px' }}>
              <h2 style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Image size={13} /> Kapak Görseli
              </h2>

              {/* Preview */}
              <div style={{
                width: '100%', aspectRatio: '16/9', borderRadius: 'var(--radius-sm)',
                overflow: 'hidden', marginBottom: '12px',
                background: 'var(--accent-light)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '1px solid var(--card-border)',
              }}>
                {coverImage && !imageError ? (
                  <img
                    src={coverImage}
                    alt="Kapak görseli önizlemesi"
                    onError={() => setImageError(true)}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                    <Image size={28} style={{ marginBottom: '6px' }} />
                    <div style={{ fontSize: '0.78rem' }}>Görsel önizlemesi</div>
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="coverImage">Görsel URL veya Yerel Dosya</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    id="coverImage"
                    className="form-input"
                    type="text"
                    value={coverImage}
                    onChange={e => { setCoverImage(e.target.value); setImageError(false); }}
                    placeholder="Görsel URL'si veya yerel dosya seçin..."
                    style={{ fontSize: '0.82rem', flex: 1 }}
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
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap', padding: '8px 12px', fontSize: '0.8rem' }}
                  >
                    <Upload size={13} /> Seç
                  </button>
                </div>
              </div>
            </div>

            {/* Category & Tags */}
            <div className="glass-card-static" style={{ padding: '20px' }}>
              <h2 style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '14px' }}>
                Sınıflandırma
              </h2>

              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="form-label" htmlFor="category">Kategori</label>
                <input
                  id="category"
                  type="text"
                  className="form-input"
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  placeholder="Kategori yazın veya seçin..."
                  list="category-options"
                  required
                />
                <datalist id="category-options">
                  {dbCategories.map(cat => (
                    <option key={cat} value={cat} />
                  ))}
                </datalist>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="tags">
                  Etiketler <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(virgülle ayırın)</span>
                </label>
                <input
                  id="tags"
                  className="form-input"
                  value={tags}
                  onChange={e => setTags(e.target.value)}
                  placeholder="react, typescript, webdev"
                  style={{ fontSize: '0.88rem' }}
                />
                {/* Tag preview */}
                {tags && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
                    {tags.split(',').map(t => t.trim()).filter(Boolean).map(tag => (
                      <span key={tag} className="badge" style={{ fontSize: '0.75rem' }}>#{tag}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Action buttons (mobile / sticky) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                type="submit"
                form="edit-post-form"
                className="btn-primary"
                disabled={saving}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%', padding: '12px' }}
              >
                <Save size={16} /> {saving ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
              </button>
              <button
                type="button"
                onClick={() => navigate('/admin')}
                className="btn-ghost"
                style={{ width: '100%', padding: '11px', fontSize: '0.9rem' }}
              >
                İptal
              </button>
            </div>
          </div>
        </div>
      </form>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
