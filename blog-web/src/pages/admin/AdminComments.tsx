import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Trash2 } from 'lucide-react';
import type { Comment } from '../../types';
import { getAllComments, deleteComment } from '../../api/posts';

export default function AdminComments() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchComments();
  }, []);

  const fetchComments = async () => {
    setLoading(true);
    try {
      const data = await getAllComments();
      setComments(data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } catch (error) {
      console.error('Yorumlar getirilemedi:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (postId: string, commentId: string) => {
    if (window.confirm('Bu yorumu silmek istediğinize emin misiniz?')) {
      const success = await deleteComment(postId, commentId);
      if (success) {
        setComments(comments.filter(c => c.id !== commentId));
      }
    }
  };

  if (loading) return <div className="loading">Yorumlar yükleniyor...</div>;

  return (
    <div className="admin-comments fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1 style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>Yorum Yönetimi</h1>
        <Link to="/admin" className="btn-ghost"><ArrowLeft size={18} /> Geri Dön</Link>
      </div>

      <div className="glass-card-static">
        {comments.length === 0 ? (
          <p>Sistemde henüz hiç yorum bulunmuyor.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {comments.map(comment => (
              <div key={comment.id} className="admin-row" style={{ alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <strong style={{ fontSize: '1.1rem' }}>{comment.author}</strong>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      {new Date(comment.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p style={{ color: 'var(--text-primary)', marginBottom: '8px', lineHeight: 1.5 }}>
                    {comment.content}
                  </p>
                  <p style={{ fontSize: '0.85rem', color: 'var(--accent)' }}>
                    Yazı ID: {comment.postId}
                  </p>
                </div>
                <div style={{ marginLeft: '20px' }}>
                  <button onClick={() => handleDelete(comment.postId, comment.id)} className="btn-danger" title="Sil">
                    <Trash2 size={16} /> Sil
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
