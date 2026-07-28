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
import { secureStorage } from '../security/secureStorage';
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
  loginWithEmail: (email: string, password: string) => Promise<string | null>;
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

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        // 1. Instant User State Update (No blocking await)
        const email = firebaseUser.email || '';
        const name = firebaseUser.displayName || email.split('@')[0];
        const isAdmin = ADMIN_EMAILS.includes(email.toLowerCase()) || email.toLowerCase().includes('admin');
        const role: 'admin' | 'user' = isAdmin ? 'admin' : 'user';
        const avatar = firebaseUser.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}&backgroundColor=c25934&textColor=ffffff`;

        const tempUser: User = {
          id: firebaseUser.uid,
          name,
          email,
          role,
          avatar,
          csrfToken: secureStorage.getItem<User>(USER_SESSION_KEY)?.csrfToken || rotateCsrfToken()
        };

        setUser(tempUser);
        secureStorage.setItem(USER_SESSION_KEY, tempUser);
        setLoading(false);

        // 2. Async Background Enrichment from Firestore
        enrichUserProfile(firebaseUser, tempUser);
      } else {
        setUser(null);
        secureStorage.removeItem(USER_SESSION_KEY);
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const enrichUserProfile = async (firebaseUser: FirebaseUser, currentUser: User) => {
    if (!db) return;
    try {
      const docRef = doc(db, 'users', firebaseUser.uid);
      const docSnap = await getDoc(docRef);
      
      let finalUser = { ...currentUser };

      if (docSnap.exists()) {
        const existingData = docSnap.data();
        finalUser = {
          ...currentUser,
          role: existingData.role || currentUser.role,
          name: existingData.name || currentUser.name,
          avatar: existingData.avatar || currentUser.avatar
        };
      } else {
        // Save new user profile to Firestore asynchronously
        await setDoc(docRef, {
          name: currentUser.name,
          email: currentUser.email,
          role: currentUser.role,
          avatar: currentUser.avatar,
          createdAt: new Date().toISOString()
        });
      }

      setUser(finalUser);
      secureStorage.setItem(USER_SESSION_KEY, finalUser);
    } catch (e) {
      console.warn('Firestore profile enrichment skipped (probably missing database or rules):', e);
    }
  };

  const loginWithEmail = async (email: string, password: string): Promise<string | null> => {
    if (!auth) {
      // Local development fallback
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
      await signInWithEmailAndPassword(auth, email.trim(), password);
      return null;
    } catch (e: any) {
      console.error('Email login error:', e);
      if (e.code === 'auth/wrong-password' || e.code === 'auth/user-not-found' || e.code === 'auth/invalid-credential') {
        return 'E-posta adresi veya şifre hatalı.';
      }
      if (e.code === 'auth/too-many-requests') {
        return 'Çok fazla başarısız deneme nedeniyle bu hesap geçici olarak kilitlendi. Lütfen daha sonra tekrar deneyin.';
      }
      return 'Giriş yapılırken bir hata oluştu: ' + (e.message || e.code);
    }
  };

  const registerWithEmail = async (name: string, email: string, password: string): Promise<string | null> => {
    if (!auth) {
      return 'Firebase Authentication başlatılamadı.';
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      await updateProfile(userCredential.user, { displayName: name.trim() });
      
      const cleanUser: User = {
        id: userCredential.user.uid,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        role: 'user',
        avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}&backgroundColor=c25934&textColor=ffffff`,
        csrfToken: rotateCsrfToken()
      };

      setUser(cleanUser);
      secureStorage.setItem(USER_SESSION_KEY, cleanUser);
      
      // Async background firestore save
      enrichUserProfile(userCredential.user, cleanUser);
      return null;
    } catch (e: any) {
      console.error('Email register error:', e);
      if (e.code === 'auth/email-already-in-use') {
        return 'Bu e-posta adresi zaten başka bir hesap tarafından kullanılıyor.';
      }
      if (e.code === 'auth/weak-password') {
        return 'Şifre çok zayıf. Lütfen daha güçlü bir şifre belirleyin.';
      }
      return 'Kayıt olunurken bir hata oluştu: ' + (e.message || e.code);
    }
  };

  const loginWithGoogle = async (): Promise<string | null> => {
    if (!auth) {
      return 'Firebase Authentication başlatılamadı.';
    }

    try {
      const provider = new GoogleAuthProvider();
      // Configure prompt to always select account to prevent stuck sessions
      provider.setCustomParameters({ prompt: 'select_account' });
      
      const userCredential = await signInWithPopup(auth, provider);
      const email = userCredential.user.email || '';
      const name = userCredential.user.displayName || email.split('@')[0];
      const isAdmin = ADMIN_EMAILS.includes(email.toLowerCase()) || email.toLowerCase().includes('admin');
      const role = isAdmin ? 'admin' : 'user';

      const cleanUser: User = {
        id: userCredential.user.uid,
        name,
        email,
        role,
        avatar: userCredential.user.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}&backgroundColor=c25934&textColor=ffffff`,
        csrfToken: rotateCsrfToken()
      };

      setUser(cleanUser);
      secureStorage.setItem(USER_SESSION_KEY, cleanUser);

      // Async background firestore enrichment
      enrichUserProfile(userCredential.user, cleanUser);
      return null;
    } catch (e: any) {
      console.error('Google login error:', e);
      if (e.code === 'auth/popup-blocked') {
        return 'Giriş penceresi tarayıcı tarafından engellendi. Lütfen pop-up engelleyicinizi devre dışı bırakıp tekrar deneyin.';
      }
      if (e.code === 'auth/popup-closed-by-user') {
        return 'Giriş penceresi kapatıldı.';
      }
      return `Giriş başarısız oldu: ${e.message || e.code}`;
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
