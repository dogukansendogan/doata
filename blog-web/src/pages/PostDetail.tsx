import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Clock, Eye, Heart, Bookmark, ArrowLeft, Calendar } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import type { Post, Comment } from '../types';
import { getPostById, toggleLike, toggleBookmark } from '../api/posts';
import CommentSection from '../components/CommentSection';
import ShareButtons from '../components/ShareButtons';
import TagBadge from '../components/TagBadge';
import RelatedPosts from '../components/RelatedPosts';
import ReadingProgressBar from '../components/ReadingProgressBar';
import AudioReader from '../components/AudioReader';
import TableOfContents from '../components/TableOfContents';
import ReactionSystem from '../components/ReactionSystem';
import NewsletterBox from '../components/NewsletterBox';
import TextSelectionToolbar from '../components/TextSelectionToolbar';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';

export default function PostDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    const fetchPost = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const data = await getPostById(id);
        setPost(data);
      } catch (error) {
        console.error("Yazı getirilemedi:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
  }, [id]);

  const handleLike = async () => {
    if (!user) {
      addToast('Beğenmek için giriş yapmalısınız', 'info');
      navigate('/login');
      return;
    }
    if (!post) return;
    const res = await toggleLike(post.id);
    if (res) {
      setPost({ ...post, likes: res.likes, isLiked: res.isLiked });
      if (res.isLiked) addToast('Yazı beğenildi ❤️', 'success');
    }
  };

  const handleBookmark = async () => {
    if (!user) {
      addToast('Kaydetmek için giriş yapmalısınız', 'info');
      navigate('/login');
      return;
    }
    if (!post) return;
    const res = await toggleBookmark(post.id);
    if (res !== null) {
      setPost({ ...post, isBookmarked: res });
      if (res) addToast('Yazı kaydedildi 🔖', 'success');
      else addToast('Yazı kaydedilenlerden çıkarıldı', 'info');
    }
  };

  const handleCommentAdded = (newComment: Comment) => {
    if (post) {
      setPost({ ...post, comments: [...post.comments, newComment] });
      addToast('Yorumunuz eklendi 💬', 'success');
    }
  };

  if (loading) return (
    <div className="loading">
      <div style={{ fontSize: '2rem', marginBottom: '12px' }}>✦</div>
      Yazı yükleniyor...
    </div>
  );

  if (!post) return (
    <div className="glass-card" style={{ textAlign: 'center', padding: '60px' }}>
      <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🔍</div>
      <h2>Yazı Bulunamadı</h2>
      <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>Aradığınız yazı mevcut değil.</p>
    </div>
  );

  return (
    <>
      <ReadingProgressBar />
      <TextSelectionToolbar containerSelector=".markdown-content" />

      <article className="post-detail fade-in-up" style={{ maxWidth: '1140px', margin: '0 auto' }}>
        {/* Back button */}
        <button onClick={() => navigate(-1)} className="btn-ghost" style={{ marginBottom: '24px' }}>
          <ArrowLeft size={17} /> Geri Dön
        </button>

        <div className="post-detail-layout" style={{ display: 'grid', gridTemplateColumns: '1fr minmax(0, 780px) minmax(0, 260px)', gap: '32px', alignItems: 'start' }}>
          
          {/* Main article content column */}
          <div style={{ gridColumn: 'span 2' }}>
            <div className="glass-card" style={{ marginBottom: '32px', padding: '0', overflow: 'hidden' }}>
              {/* Cover image */}
              {post.coverImage && (
                <div style={{ width: '100%', height: '400px', overflow: 'hidden' }}>
                  <img
                    src={post.coverImage}
                    alt={post.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>
              )}

              <div style={{ padding: '36px' }}>
                {/* Category + meta */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                  <Link
                    to={`/kategori/${post.category.toLowerCase().replace(/ /g, '-')}`}
                    className="badge"
                  >
                    {post.category}
                  </Link>
                  <div style={{ display: 'flex', gap: '16px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <Clock size={14} /> {post.readingTime} dk okuma
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <Eye size={14} /> {post.views.toLocaleString('tr-TR')}
                    </span>
                  </div>
                </div>

                {/* Title */}
                <h1 style={{ fontSize: 'clamp(1.85rem, 4vw, 2.6rem)', marginBottom: '16px', lineHeight: 1.25, fontWeight: 800 }}>
                  {post.title}
                </h1>

                {/* Excerpt */}
                <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', marginBottom: '24px', fontStyle: 'italic', lineHeight: 1.7 }}>
                  {post.excerpt}
                </p>

                {/* Author + actions bar */}
                <div style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '18px 0', borderTop: '1px solid var(--card-border)',
                  borderBottom: '1px solid var(--card-border)', marginBottom: '28px', flexWrap: 'wrap', gap: '12px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: '50%',
                      background: 'var(--accent)', color: '#fff',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 700, fontSize: '1rem', flexShrink: 0,
                    }}>
                      {post.author.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <Link
                        to={`/yazar/${post.author}`}
                        style={{ fontWeight: 700, fontSize: '1rem', display: 'block', marginBottom: '2px' }}
                      >
                        {post.author}
                      </Link>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Calendar size={12} />
                        {new Date(post.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      onClick={handleLike}
                      className="btn-ghost"
                      style={{
                        color: post.isLiked ? 'var(--danger)' : 'var(--text-secondary)',
                        borderColor: post.isLiked ? 'rgba(211,69,69,0.3)' : 'var(--card-border)',
                        background: post.isLiked ? 'rgba(211,69,69,0.06)' : 'transparent',
                      }}
                      title={user ? 'Beğen' : 'Beğenmek için giriş yapın'}
                    >
                      <Heart size={18} fill={post.isLiked ? 'currentColor' : 'none'} />
                      <span>{post.likes}</span>
                    </button>
                    <button
                      onClick={handleBookmark}
                      className="btn-ghost"
                      style={{
                        color: post.isBookmarked ? 'var(--accent)' : 'var(--text-secondary)',
                        borderColor: post.isBookmarked ? 'var(--accent-mid)' : 'var(--card-border)',
                        background: post.isBookmarked ? 'var(--accent-light)' : 'transparent',
                      }}
                      title={user ? 'Kaydet' : 'Kaydetmek için giriş yapın'}
                    >
                      <Bookmark size={18} fill={post.isBookmarked ? 'currentColor' : 'none'} />
                    </button>
                  </div>
                </div>

                {/* Audio Reader */}
                <AudioReader title={post.title} content={post.content} />

                {/* Article content */}
                <div className="markdown-content">
                  <ReactMarkdown>{post.content}</ReactMarkdown>
                </div>

                {/* Medium Claps & Dev.to Emoji Reactions */}
                <ReactionSystem
                  postId={post.id}
                  initialLikes={post.likes}
                  isLiked={post.isLiked}
                  onLikeToggle={handleLike}
                  initialReactions={post.reactions}
                />

                {/* Tags */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '28px', marginBottom: '28px' }}>
                  {post.tags.map(tag => (
                    <TagBadge key={tag} tag={tag} />
                  ))}
                </div>

                {/* Share */}
                <div style={{
                  padding: '20px 24px',
                  background: 'var(--bg-color)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--card-border)',
                }}>
                  <ShareButtons title={post.title} url={window.location.href} />
                </div>
              </div>
            </div>

            {/* Substack Newsletter signup box */}
            <NewsletterBox />

            {/* Comments */}
            <CommentSection comments={post.comments} postId={post.id} onCommentAdded={handleCommentAdded} />

            {/* Related Posts */}
            <RelatedPosts currentPostId={post.id} category={post.category} />
          </div>

          {/* Sticky Sidebar: Table of Contents */}
          <div className="post-sidebar" style={{ gridColumn: 'span 1' }}>
            <TableOfContents content={post.content} />
          </div>
        </div>
      </article>
    </>
  );
}
