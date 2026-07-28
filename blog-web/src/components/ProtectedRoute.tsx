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
  const { user, loading, isAdmin } = useAuth();

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: '60vh', 
        flexDirection: 'column', 
        gap: '16px' 
      }}>
        <div style={{ 
          width: '40px', 
          height: '40px', 
          border: '3px solid var(--accent-mid)', 
          borderTopColor: 'var(--accent)', 
          borderRadius: '50%', 
          animation: 'spin 0.8s linear infinite' 
        }} />
        <span style={{ color: 'var(--text-secondary)' }}>Yükleniyor...</span>
        <style>{`
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
