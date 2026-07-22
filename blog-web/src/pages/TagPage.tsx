import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import type { Post } from '../types';
import { getPostsByTag } from '../api/posts';
import PostCard from '../components/PostCard';

export default function TagPage() {
  const { tag } = useParams<{ tag: string }>();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTagPosts = async () => {
      if (!tag) return;
      setLoading(true);
      try {
        const data = await getPostsByTag(tag);
        setPosts(data);
      } catch (error) {
        console.error('Etiket yazıları getirilemedi:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTagPosts();
  }, [tag]);

  return (
    <div className="tag-page fade-in">
      <div className="page-hero">
        <h1>Etiket: #{tag}</h1>
        <p>Bu etiketle işaretlenmiş tüm yazılar.</p>
      </div>

      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        {loading ? (
          <div className="loading">Yükleniyor...</div>
        ) : posts.length === 0 ? (
          <div className="glass-card" style={{ textAlign: 'center', padding: '40px' }}>
            Bu etikette henüz yazı bulunmuyor.
          </div>
        ) : (
          posts.map(post => <PostCard key={post.id} post={post} />)
        )}
      </div>
    </div>
  );
}
