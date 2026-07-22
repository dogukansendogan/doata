import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="site-footer glass">
      <div className="container footer-content">
        <div className="footer-left">
          <Link to="/" className="footer-logo">Doata</Link>
          <p>© 2026 Doata. Tüm hakları saklıdır.</p>
        </div>
        <div className="footer-right">
          <Link to="/">Anasayfa</Link>
          <Link to="/arsiv">Arşiv</Link>
          <Link to="/kategori/teknoloji">Teknoloji</Link>
          <Link to="/kategori/tasarim">Tasarım</Link>
        </div>
      </div>
    </footer>
  );
}
