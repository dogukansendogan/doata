import { useEffect, useState } from 'react';
import { Share2, Copy } from 'lucide-react';
import { useToast } from '../context/ToastContext';

interface TextSelectionToolbarProps {
  containerSelector: string;
}

export default function TextSelectionToolbar({ containerSelector }: TextSelectionToolbarProps) {
  const [selectedText, setSelectedText] = useState('');
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const { addToast } = useToast();

  useEffect(() => {
    const handleSelectionChange = () => {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed || !selection.toString().trim()) {
        setPosition(null);
        setSelectedText('');
        return;
      }

      const text = selection.toString().trim();
      if (text.length < 5) {
        setPosition(null);
        return;
      }

      // Ensure selection is inside article content container
      const range = selection.getRangeAt(0);
      const container = document.querySelector(containerSelector);
      if (!container || !container.contains(range.commonAncestorContainer)) {
        setPosition(null);
        return;
      }

      const rect = range.getBoundingClientRect();
      setPosition({
        top: rect.top + window.scrollY - 48,
        left: rect.left + rect.width / 2,
      });
      setSelectedText(text);
    };

    document.addEventListener('selectionchange', handleSelectionChange);
    return () => document.removeEventListener('selectionchange', handleSelectionChange);
  }, [containerSelector]);

  if (!position || !selectedText) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(`"${selectedText}"`);
    addToast('Alıntı panoya kopyalandı! 📋', 'success');
    setPosition(null);
  };

  const handleShareTwitter = () => {
    const tweetText = encodeURIComponent(`"${selectedText.slice(0, 200)}..."`);
    const shareUrl = `https://twitter.com/intent/tweet?text=${tweetText}&url=${encodeURIComponent(window.location.href)}`;
    window.open(shareUrl, '_blank');
    setPosition(null);
  };

  return (
    <div
      style={{
        position: 'absolute',
        top: `${position.top}px`,
        left: `${position.left}px`,
        transform: 'translateX(-50%)',
        zIndex: 999,
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        padding: '6px 10px',
        background: '#1e293b',
        color: '#fff',
        borderRadius: '8px',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)',
        animation: 'fadeInUp 0.15s ease-out',
      }}
    >
      <button
        onClick={handleCopy}
        style={{
          background: 'transparent',
          border: 'none',
          color: '#fff',
          padding: '4px 8px',
          fontSize: '0.78rem',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          cursor: 'pointer',
          borderRadius: '4px',
        }}
        title="Alıntıyı Kopyala"
      >
        <Copy size={14} /> Kopyala
      </button>

      <div style={{ width: 1, height: 14, background: 'rgba(255,255,255,0.2)' }} />

      <button
        onClick={handleShareTwitter}
        style={{
          background: 'transparent',
          border: 'none',
          color: '#38bdf8',
          padding: '4px 8px',
          fontSize: '0.78rem',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          cursor: 'pointer',
          borderRadius: '4px',
        }}
        title="X/Twitter'da Paylaş"
      >
        <Share2 size={14} /> Paylaş
      </button>
    </div>
  );
}
