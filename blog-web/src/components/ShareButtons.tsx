import { useState } from 'react';
import { Copy, Check, Link as LinkIcon, Share2 } from 'lucide-react';

interface ShareButtonsProps {
  title: string;
  url: string;
}

const XIcon = ({ size = 16 }: { size?: number }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
  >
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const LinkedinIcon = ({ size = 16 }: { size?: number }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
  >
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
  </svg>
);

export default function ShareButtons({ title, url }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const el = document.createElement('textarea');
      el.value = url;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const shareLinks = [
    {
      label: 'X (Twitter)',
      icon: <XIcon size={14} />,
      href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`,
      color: '#000000',
    },
    {
      label: 'LinkedIn',
      icon: <LinkedinIcon size={14} />,
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
      color: '#0a66c2',
    },
    {
      label: 'WhatsApp',
      icon: <Share2 size={14} />,
      href: `https://api.whatsapp.com/send?text=${encodeURIComponent(title + ' ' + url)}`,
      color: '#25d366',
    },
  ];

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <LinkIcon size={14} style={{ color: 'var(--text-muted)' }} />
        <span style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>
          Paylaş
        </span>
      </div>

      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {shareLinks.map(link => (
          <a
            key={link.label}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            title={link.label + "'de Paylaş"}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              padding: '7px 14px', borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--card-border)', background: 'transparent',
              color: 'var(--text-secondary)', fontSize: '0.82rem', fontWeight: 500,
              transition: 'all 0.2s', textDecoration: 'none',
            }}
            onMouseOver={e => {
              (e.currentTarget as HTMLElement).style.background = link.color + '12';
              (e.currentTarget as HTMLElement).style.color = link.color;
              (e.currentTarget as HTMLElement).style.borderColor = link.color + '40';
            }}
            onMouseOut={e => {
              (e.currentTarget as HTMLElement).style.background = 'transparent';
              (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)';
              (e.currentTarget as HTMLElement).style.borderColor = 'var(--card-border)';
            }}
          >
            {link.icon}
            <span className="hide-on-mobile">{link.label}</span>
          </a>
        ))}

        <button
          onClick={handleCopy}
          title="Bağlantıyı kopyala"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            padding: '7px 14px', borderRadius: 'var(--radius-sm)',
            border: `1px solid ${copied ? 'var(--success)' : 'var(--card-border)'}`,
            background: copied ? 'rgba(62, 136, 91, 0.08)' : 'transparent',
            color: copied ? 'var(--success)' : 'var(--text-secondary)',
            fontSize: '0.82rem', fontWeight: 500, cursor: 'pointer',
            fontFamily: 'var(--font-sans)', transition: 'all 0.2s',
          }}
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
          <span className="hide-on-mobile">{copied ? 'Kopyalandı!' : 'Kopyala'}</span>
        </button>
      </div>

      <style>{`@media (max-width: 640px) { .hide-on-mobile { display: none !important; } }`}</style>
    </div>
  );
}
