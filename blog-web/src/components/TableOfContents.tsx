import { useEffect, useState } from 'react';
import { List } from 'lucide-react';

interface TocItem {
  id: string;
  text: string;
  level: number;
}

interface TableOfContentsProps {
  content: string;
}

export default function TableOfContents({ content }: TableOfContentsProps) {
  const [toc, setToc] = useState<TocItem[]>([]);
  const [activeId, setActiveId] = useState<string>('');

  useEffect(() => {
    // Extract markdown headers (#, ##, ###)
    const lines = content.split('\n');
    const items: TocItem[] = [];

    lines.forEach((line) => {
      const match = line.match(/^(#{1,3})\s+(.+)$/);
      if (match) {
        const level = match[1].length;
        const text = match[2].trim().replace(/[*_~`]/g, '');
        const id = text
          .toLowerCase()
          .replace(/[^\w\s-]/g, '')
          .replace(/\s+/g, '-');
        items.push({ id, text, level });
      }
    });

    setToc(items);
  }, [content]);

  useEffect(() => {
    if (toc.length === 0) return;

    const handleScroll = () => {
      const headingElements = toc
        .map((item) => document.getElementById(item.id))
        .filter(Boolean) as HTMLElement[];

      const scrollPosition = window.scrollY + 120;

      for (let i = headingElements.length - 1; i >= 0; i--) {
        const elem = headingElements[i];
        if (elem.offsetTop <= scrollPosition) {
          setActiveId(elem.id);
          break;
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [toc]);

  if (toc.length === 0) return null;

  const scrollToHeading = (id: string) => {
    const elem = document.getElementById(id);
    if (elem) {
      const offsetTop = elem.getBoundingClientRect().top + window.pageYOffset - 90;
      window.scrollTo({ top: offsetTop, behavior: 'smooth' });
      setActiveId(id);
    }
  };

  return (
    <aside className="toc-container glass-card" style={{
      padding: '20px',
      marginBottom: '24px',
      position: 'sticky',
      top: '90px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', fontWeight: 700, fontSize: '0.95rem' }}>
        <List size={16} style={{ color: 'var(--accent)' }} />
        <span>İçindekiler</span>
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {toc.map((item) => {
          const isActive = activeId === item.id;
          return (
            <button
              key={item.id}
              onClick={() => scrollToHeading(item.id)}
              style={{
                textAlign: 'left',
                background: 'none',
                border: 'none',
                paddingLeft: `${(item.level - 1) * 12 + 8}px`,
                fontSize: item.level === 1 ? '0.88rem' : '0.82rem',
                fontWeight: isActive ? 600 : 400,
                color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
                borderLeft: isActive ? '2px solid var(--accent)' : '2px solid transparent',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {item.text}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
