import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { ReactNode } from 'react';

interface ProtectedRouteProps {
  children: ReactNode;
  requireAdmin?: boolean;
}

/**
 * ProtectedRoute: Belirli sayfalara erişimi kısıtlar.
 * requireAdmin=true ise sadece admin rolündeki kullanıcılar erişebilir.
 * Giriş yapılmamışsa /login'e, admin değilse ana sayfaya yönlendirir.
 */
export default function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
  const { user, isAdmin } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && !isAdmin) {
    return (
      <div className="access-denied-page fade-in-up">
        <div className="access-denied-card glass-card">
          <div className="access-denied-icon">🔒</div>
          <h1>Erişim Reddedildi</h1>
          <p>Bu sayfaya erişim yetkiniz bulunmuyor.</p>
          <p className="access-denied-sub">Sadece yöneticiler bu sayfaya erişebilir.</p>
          <Navigate to="/" replace />
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
