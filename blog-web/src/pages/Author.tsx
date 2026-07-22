import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { User } from 'lucide-react';
import type { Post } from '../types';
import { getPostsByAuthor } from '../api/posts';
import PostCard from '../components/PostCard';

export default function Author() {
  const { name } = useParams<{ name: string }>();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAuthorPosts = async () => {
      if (!name) return;
      setLoading(true);
      try {
        const data = await getPostsByAuthor(name);
        setPosts(data);
      } catch (error) {
        console.error('Yazar yazıları getirilemedi:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAuthorPosts();
  }, [name]);

  return (
    <div className="author-page fade-in">
      <div className="page-hero">
        <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '80px', height: '80px', borderRadius: '50%', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', marginBottom: '16px' }}>
          <User size={40} color="var(--accent)" />
        </div>
        <h1>{name}</h1>
        <p>Toplam {posts.length} yazı</p>
      </div>

      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        {loading ? (
          <div className="loading">Yükleniyor...</div>
        ) : posts.length === 0 ? (
          <div className="glass-card" style={{ textAlign: 'center', padding: '40px' }}>
            Bu yazara ait henüz yazı bulunmuyor.
          </div>
        ) : (
          posts.map(post => <PostCard key={post.id} post={post} />)
        )}
      </div>
    </div>
  );
}
