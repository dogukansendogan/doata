import { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, Play, Pause, RotateCcw } from 'lucide-react';

interface AudioReaderProps {
  title: string;
  content: string;
}

export default function AudioReader({ title, content }: AudioReaderProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [rate, setRate] = useState(1);
  const [isSupported, setIsSupported] = useState(true);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    if (!('speechSynthesis' in window)) {
      setIsSupported(false);
      return;
    }

    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const cleanContentForSpeech = (rawMarkdown: string) => {
    // Strip markdown formatting symbols for natural reading
    return rawMarkdown
      .replace(/#+/g, '')
      .replace(/(\*\*|__)(.*?)\1/g, '$2')
      .replace(/(\*|_)(.*?)\1/g, '$2')
      .replace(/```[\s\S]*?```/g, 'Kod bloğu Atlandı.')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .trim();
  };

  const startSpeech = () => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();

    const plainText = `${title}. ${cleanContentForSpeech(content)}`;
    const utterance = new SpeechSynthesisUtterance(plainText);
    utterance.lang = 'tr-TR';
    utterance.rate = rate;

    utterance.onend = () => {
      setIsPlaying(false);
      setIsPaused(false);
    };

    utterance.onerror = () => {
      setIsPlaying(false);
      setIsPaused(false);
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
    setIsPlaying(true);
    setIsPaused(false);
  };

  const togglePlayPause = () => {
    if (!isPlaying && !isPaused) {
      startSpeech();
    } else if (isPlaying) {
      window.speechSynthesis.pause();
      setIsPlaying(false);
      setIsPaused(true);
    } else if (isPaused) {
      window.speechSynthesis.resume();
      setIsPlaying(true);
      setIsPaused(false);
    }
  };

  const stopSpeech = () => {
    window.speechSynthesis.cancel();
    setIsPlaying(false);
    setIsPaused(false);
  };

  const handleSpeedChange = (newRate: number) => {
    setRate(newRate);
    if (isPlaying || isPaused) {
      startSpeech();
    }
  };

  if (!isSupported) return null;

  return (
    <div className="audio-reader-box" style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '12px 18px',
      background: 'var(--bg-color)',
      borderRadius: 'var(--radius-md)',
      border: '1px solid var(--card-border)',
      marginBottom: '24px',
      flexWrap: 'wrap',
      gap: '12px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{
          width: 34, height: 34, borderRadius: '50%',
          background: isPlaying ? 'rgba(79, 70, 229, 0.15)' : 'var(--card-border)',
          color: isPlaying ? 'var(--accent)' : 'var(--text-secondary)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {isPlaying ? <Volume2 size={18} className="pulse-icon" /> : <VolumeX size={18} />}
        </div>
        <div>
          <span style={{ fontWeight: 600, fontSize: '0.9rem', display: 'block' }}>
            Sesli Dinle (AI Reader)
          </span>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            {isPlaying ? 'Makale okunuyor...' : isPaused ? 'Duraklatıldı' : 'Makaleyi dinlemek için oynatın'}
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {/* Play/Pause Button */}
        <button
          onClick={togglePlayPause}
          className="btn-primary"
          style={{
            padding: '8px 16px',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            borderRadius: '20px',
          }}
        >
          {isPlaying ? <Pause size={15} /> : <Play size={15} />}
          {isPlaying ? 'Duraklat' : isPaused ? 'Devam Et' : 'Oynat'}
        </button>

        {/* Stop Button */}
        {(isPlaying || isPaused) && (
          <button
            onClick={stopSpeech}
            className="btn-ghost"
            style={{ padding: '8px 12px', fontSize: '0.85rem', borderRadius: '20px' }}
            title="Durdur"
          >
            <RotateCcw size={15} />
          </button>
        )}

        {/* Speed Selector */}
        <div style={{ display: 'flex', gap: '4px', background: 'var(--card-bg)', padding: '3px', borderRadius: '16px', border: '1px solid var(--card-border)' }}>
          {[1, 1.25, 1.5, 2].map((s) => (
            <button
              key={s}
              onClick={() => handleSpeedChange(s)}
              style={{
                background: rate === s ? 'var(--accent)' : 'transparent',
                color: rate === s ? '#fff' : 'var(--text-secondary)',
                border: 'none',
                borderRadius: '12px',
                padding: '4px 8px',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
