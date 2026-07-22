import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { auth, db } from '../firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  onAuthStateChanged,
  updateProfile,
  type User as FirebaseUser
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
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
  loading: boolean;
  loginWithEmail: (email: string, password: string) => Promise<string | null>; // Returns error message if any
  registerWithEmail: (name: string, email: string, password: string) => Promise<string | null>;
  loginWithGoogle: () => Promise<string | null>;
  logout: () => Promise<void>;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ADMIN_EMAILS = ['admin@doata.com', 'dogukan@admin.com'];
const USER_SESSION_KEY = 'doata_user_session';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    return secureStorage.getItem<User>(USER_SESSION_KEY);
  });
  const [loading, setLoading] = useState(true);

  // Sync state with Firebase Authentication
  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Fetch or create user record in Firestore
        const userDoc = await getOrCreateUserDoc(firebaseUser);
        setUser(userDoc);
        secureStorage.setItem(USER_SESSION_KEY, userDoc);
      } else {
        setUser(null);
        secureStorage.removeItem(USER_SESSION_KEY);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Session inactivity check
  useEffect(() => {
    if (!user) return;
    const cleanup = initSessionTimeout(() => {
      logout();
      alert('Güvenliğiniz için inaktif oturumunuz sonlandırıldı.');
    }, 15 * 60 * 1000);

    return cleanup;
  }, [user]);

  const getOrCreateUserDoc = async (firebaseUser: FirebaseUser, displayName?: string): Promise<User> => {
    const email = firebaseUser.email || '';
    const name = displayName || firebaseUser.displayName || email.split('@')[0];
    const isAdmin = ADMIN_EMAILS.includes(email.toLowerCase()) || email.toLowerCase().includes('admin');
    const role: 'admin' | 'user' = isAdmin ? 'admin' : 'user';
    const avatar = firebaseUser.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}&backgroundColor=c25934&textColor=ffffff`;
    const csrfToken = rotateCsrfToken();

    const userProfile: User = {
      id: firebaseUser.uid,
      name,
      email,
      role,
      avatar,
      csrfToken
    };

    if (db) {
      try {
        const docRef = doc(db, 'users', firebaseUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const existingData = docSnap.data();
          return {
            ...userProfile,
            role: existingData.role || role,
            name: existingData.name || name,
            avatar: existingData.avatar || avatar
          };
        } else {
          // Store profile in Firestore
          await setDoc(docRef, {
            name,
            email,
            role,
            avatar,
            createdAt: new Date().toISOString()
          });
        }
      } catch (e) {
        console.error('Firestore getOrCreateUserDoc failed:', e);
      }
    }

    return userProfile;
  };

  const loginWithEmail = async (email: string, password: string): Promise<string | null> => {
    if (isRateLimited('login_attempt', 5, 60000)) {
      const cooldown = getRemainingCooldown('login_attempt', 60000);
      return `Çok fazla hatalı giriş denemesi. Lütfen ${cooldown} saniye bekleyin.`;
    }

    if (!isValidEmail(email)) {
      return 'Geçersiz e-posta adresi biçimi.';
    }

    if (!auth) {
      // Local fallback in case Firebase is not initialized
      const cleanEmail = email.trim().toLowerCase();
      const isAdmin = ADMIN_EMAILS.includes(cleanEmail);
      const role = isAdmin ? 'admin' : 'user';
      const name = cleanEmail.split('@')[0];
      const fallbackUser: User = {
        id: 'fallback_uid',
        name,
        email: cleanEmail,
        role,
        avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`,
        csrfToken: rotateCsrfToken()
      };
      setUser(fallbackUser);
      secureStorage.setItem(USER_SESSION_KEY, fallbackUser);
      return null;
    }

    try {
      await signInWithEmailAndPassword(auth, email, password);
      return null;
    } catch (e: any) {
      console.error(e);
      if (e.code === 'auth/wrong-password' || e.code === 'auth/user-not-found' || e.code === 'auth/invalid-credential') {
        return 'E-posta veya şifre hatalı.';
      }
      return 'Giriş yapılırken bir hata oluştu.';
    }
  };

  const registerWithEmail = async (name: string, email: string, password: string): Promise<string | null> => {
    if (!auth) {
      return 'Firebase Authentication başlatılamadı.';
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, { displayName: name });
      const userDoc = await getOrCreateUserDoc(userCredential.user, name);
      setUser(userDoc);
      secureStorage.setItem(USER_SESSION_KEY, userDoc);
      return null;
    } catch (e: any) {
      console.error(e);
      if (e.code === 'auth/email-already-in-use') {
        return 'Bu e-posta adresi zaten kullanımda.';
      }
      return 'Kayıt olunurken bir hata oluştu.';
    }
  };

  const loginWithGoogle = async (): Promise<string | null> => {
    if (!auth) {
      return 'Firebase Authentication başlatılamadı.';
    }

    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      const userDoc = await getOrCreateUserDoc(userCredential.user);
      setUser(userDoc);
      secureStorage.setItem(USER_SESSION_KEY, userDoc);
      return null;
    } catch (e: any) {
      console.error('Google login error detail:', e);
      return `Google ile giriş başarısız oldu: ${e.message || e.code || 'Bilinmeyen hata'}`;
    }
  };

  const logout = async () => {
    if (auth) {
      await signOut(auth);
    }
    setUser(null);
    secureStorage.removeItem(USER_SESSION_KEY);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      loginWithEmail, 
      registerWithEmail, 
      loginWithGoogle, 
      logout, 
      isAdmin: user?.role === 'admin' 
    }}>
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
