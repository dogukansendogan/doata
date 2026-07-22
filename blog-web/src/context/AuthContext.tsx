import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { secureStorage, initSessionTimeout } from '../security/secureStorage';
import { isRateLimited, getRemainingCooldown } from '../security/rateLimiter';
import { isValidEmail } from '../security/sanitizer';
import { rotateCsrfToken } from '../security/csrfGuard';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  avatar?: string;
  csrfToken?: string;
}

interface AuthContextType {
  user: User | null;
  login: (name: string, email: string) => string | null; // Returns error message if any
  logout: () => void;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Admin emails - gerçek uygulamada backend'den gelir
const ADMIN_EMAILS = ['admin@doata.com', 'dogukan@admin.com'];
const USER_SESSION_KEY = 'doata_user_session';

export function AuthProvider({ children }: { children: ReactNode }) {
  // Load initially from secure storage
  const [user, setUser] = useState<User | null>(() => {
    return secureStorage.getItem<User>(USER_SESSION_KEY);
  });

  // Dynamic session inactivity logout
  useEffect(() => {
    if (!user) return;
    const cleanup = initSessionTimeout(() => {
      logout();
      alert('Güvenliğiniz için inaktif oturumunuz sonlandırıldı.');
    }, 15 * 60 * 1000); // 15 mins

    return cleanup;
  }, [user]);

  const login = (name: string, email: string): string | null => {
    // 1. Rate Limiting Check (Max 5 login attempts per 1 minute)
    if (isRateLimited('login_attempt', 5, 60000)) {
      const cooldown = getRemainingCooldown('login_attempt', 60000);
      return `Çok fazla hatalı giriş denemesi. Lütfen ${cooldown} saniye bekleyin.`;
    }

    // 2. Email Verification Check
    if (!isValidEmail(email)) {
      return 'Geçersiz e-posta adresi biçimi.';
    }

    const cleanEmail = email.trim().toLowerCase();
    const isAdmin = ADMIN_EMAILS.includes(cleanEmail) || cleanEmail.includes('admin');
    const role: 'admin' | 'user' = isAdmin ? 'admin' : 'user';
    
    // Generate new CSRF token on login
    const token = rotateCsrfToken();

    const loggedInUser: User = {
      id: Math.random().toString(36).substring(2, 9),
      name: name.trim(),
      email: cleanEmail,
      role,
      avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}&backgroundColor=c25934&textColor=ffffff`,
      csrfToken: token
    };

    setUser(loggedInUser);
    secureStorage.setItem(USER_SESSION_KEY, loggedInUser);
    return null;
  };

  const logout = () => {
    setUser(null);
    secureStorage.removeItem(USER_SESSION_KEY);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAdmin: user?.role === 'admin' }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
