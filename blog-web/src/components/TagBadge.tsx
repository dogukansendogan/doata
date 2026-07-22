import { Link } from 'react-router-dom';
import './TagBadge.css';

interface TagBadgeProps {
  tag: string;
}

export default function TagBadge({ tag }: TagBadgeProps) {
  return (
    <Link to={`/etiket/${tag}`} className="tag-badge glass">
      #{tag}
    </Link>
  );
}
