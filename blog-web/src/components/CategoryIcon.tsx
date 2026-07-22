import { Laptop, Palette, Cpu, Leaf, Rocket, Briefcase, Folder } from 'lucide-react';

interface CategoryIconProps {
  name: string;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

export default function CategoryIcon({ name, size = 16, className, style }: CategoryIconProps) {
  const normName = name.trim().toLowerCase();

  switch (normName) {
    case 'teknoloji':
      return <Laptop size={size} className={className} style={style} />;
    case 'tasarım':
    case 'tasarim':
      return <Palette size={size} className={className} style={style} />;
    case 'yazılım':
    case 'yazilim':
      return <Cpu size={size} className={className} style={style} />;
    case 'yaşam':
    case 'yasam':
      return <Leaf size={size} className={className} style={style} />;
    case 'girişimcilik':
    case 'girisimcilik':
      return <Rocket size={size} className={className} style={style} />;
    case 'kariyer':
      return <Briefcase size={size} className={className} style={style} />;
    default:
      return <Folder size={size} className={className} style={style} />;
  }
}
