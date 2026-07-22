import { useEffect, useState } from 'react';
import { getPostsByCategory } from '../api/posts';
import type { Post } from '../types';
import PostCard from './PostCard';

interface RelatedPostsProps {
  currentPostId: string;
  category: string;
}

export default function RelatedPosts({ currentPostId, category }: RelatedPostsProps) {
  const [related, setRelated] = useState<Post[]>([]);

  useEffect(() => {
    const fetchRelated = async () => {
      try {
        const data = await getPostsByCategory(category);
        // Filtrele: O anki yazıyı çıkar ve max 2 tane göster
        const filtered = data.filter(p => p.id !== currentPostId).slice(0, 2);
        setRelated(filtered);
      } catch (error) {
        console.error('İlgili yazılar getirilemedi:', error);
      }
    };
    fetchRelated();
  }, [category, currentPostId]);

  if (related.length === 0) return null;

  return (
    <div style={{ marginTop: '60px', paddingTop: '40px', borderTop: '1px solid var(--card-border)' }}>
      <h3 style={{ marginBottom: '24px', fontSize: '1.5rem' }}>İlginizi Çekebilecek Diğer Yazılar</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
        {related.map(post => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
    </div>
  );
}
