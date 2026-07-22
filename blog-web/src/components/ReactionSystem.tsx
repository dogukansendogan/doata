import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Heart, Award, Brain, Lightbulb, ThumbsUp } from 'lucide-react';

interface ReactionSystemProps {
  initialLikes: number;
  isLiked: boolean;
  onLikeToggle: () => void;
}

interface SvgReaction {
  id: string;
  icon: React.ComponentType<{ size?: number; fill?: string; className?: string }>;
  label: string;
  count: number;
  userReacted: boolean;
  color: string;
}

export default function ReactionSystem({ initialLikes, isLiked, onLikeToggle }: ReactionSystemProps) {
  const { user } = useAuth();
  const { addToast } = useToast();

  // Medium Clap state
  const [claps, setClaps] = useState(initialLikes);
  const [userClaps, setUserClaps] = useState(0);
  const [floatingCounts, setFloatingCounts] = useState<{ id: number; text: string }[]>([]);

  // SVG Reactions state
  const [reactions, setReactions] = useState<SvgReaction[]>([
    { id: 'love', icon: Heart, label: 'Harika', count: Math.floor(initialLikes * 0.6) + 3, userReacted: isLiked, color: '#ef4444' },
    { id: 'unicorn', icon: Award, label: 'Efsane', count: Math.floor(initialLikes * 0.3) + 2, userReacted: false, color: '#a855f7' },
    { id: 'mindblown', icon: Brain, label: 'Zihin Açıcı', count: Math.floor(initialLikes * 0.4) + 1, userReacted: false, color: '#f59e0b' },
    { id: 'idea', icon: Lightbulb, label: 'İlham Verici', count: Math.floor(initialLikes * 0.5) + 4, userReacted: false, color: '#10b981' },
  ]);

  const handleClap = () => {
    if (!user) {
      addToast('Alkışlamak için lütfen giriş yapın 👏', 'info');
      return;
    }

    if (userClaps >= 50) {
      addToast('Bu yazı için maksimum (50) alkış verdiniz!', 'info');
      return;
    }

    const nextUserClap = userClaps + 1;
    setUserClaps(nextUserClap);
    setClaps(prev => prev + 1);

    if (!isLiked && userClaps === 0) {
      onLikeToggle();
    }

    // Add floating animation token
    const newId = Date.now();
    setFloatingCounts(prev => [...prev, { id: newId, text: `+${nextUserClap}` }]);
    setTimeout(() => {
      setFloatingCounts(prev => prev.filter(item => item.id !== newId));
    }, 1000);
  };

  const handleEmojiClick = (id: string) => {
    if (!user) {
      addToast('Tepki vermek için lütfen giriş yapın', 'info');
      return;
    }

    setReactions(prev =>
      prev.map(r => {
        if (r.id === id) {
          const nextState = !r.userReacted;
          if (nextState) addToast(`"${r.label}" tepkiniz eklendi!`, 'success');
          return {
            ...r,
            userReacted: nextState,
            count: nextState ? r.count + 1 : Math.max(0, r.count - 1),
          };
        }
        return r;
      })
    );
  };

  return (
    <div className="reaction-system-box" style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '20px',
      padding: '24px',
      background: 'var(--card-bg)',
      borderRadius: 'var(--radius-lg)',
      border: '1px solid var(--card-border)',
      margin: '32px 0',
      position: 'relative',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        
        {/* Medium-style Clap Button */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={handleClap}
            className="btn-clap"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '12px 24px',
              borderRadius: '30px',
              background: userClaps > 0 ? 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)' : 'var(--bg-color)',
              color: userClaps > 0 ? '#fff' : 'var(--text-primary)',
              border: userClaps > 0 ? 'none' : '1px solid var(--card-border)',
              fontWeight: 700,
              fontSize: '1rem',
              cursor: 'pointer',
              boxShadow: userClaps > 0 ? '0 4px 14px rgba(99, 102, 241, 0.35)' : 'none',
              transition: 'transform 0.15s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
            }}
          >
            <ThumbsUp size={18} fill={userClaps > 0 ? 'currentColor' : 'none'} />
            <span>{claps} Alkış</span>
          </button>

          {userClaps > 0 && (
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              (Sizin: {userClaps}/50)
            </span>
          )}

          {/* Floating +1 / +N numbers */}
          {floatingCounts.map(item => (
            <span
              key={item.id}
              className="floating-clap-anim"
              style={{
                position: 'absolute',
                top: '-25px',
                left: '40px',
                fontWeight: 800,
                color: 'var(--accent)',
                fontSize: '1.2rem',
                pointerEvents: 'none',
              }}
            >
              {item.text}
            </span>
          ))}
        </div>

        {/* Dynamic SVG Reactions */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {reactions.map(r => {
            const IconComponent = r.icon;
            return (
              <button
                key={r.id}
                onClick={() => handleEmojiClick(r.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 14px',
                  borderRadius: '20px',
                  background: r.userReacted ? 'var(--accent-light)' : 'var(--bg-color)',
                  border: r.userReacted ? `1px solid ${r.color}` : '1px solid var(--card-border)',
                  color: r.userReacted ? r.color : 'var(--text-secondary)',
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                title={r.label}
              >
                <IconComponent size={15} fill={r.userReacted ? r.color : 'none'} />
                <span>{r.count}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
