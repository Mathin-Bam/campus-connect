import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { auth } from '../config/firebase';
import { signInWithCustomToken, signOut, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import storage from '../utils/storage';

type AppUser = {
  id: string;
  email: string;
  displayName: string;
  universityId: string;
  verified: boolean;
  firebaseUid: string;
};

type AuthContextType = {
  user: AppUser | null;
  firebaseUser: FirebaseUser | null;
  idToken: string | null;
  loading: boolean;
  signInWithToken: (customToken: string, userId: string, email: string, universityId: string) => Promise<void>;
  updateUser: (updates: Partial<AppUser>) => void;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [idToken, setIdToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Restore cached user session on app start
  useEffect(() => {
    const restore = async () => {
      try {
        const cached = await storage.getItem('cc_user');
        if (cached) {
          const parsed = JSON.parse(cached);
          setUser(parsed); // show app immediately, Firebase will confirm
        }
      } catch {}
    };
    restore();
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        setFirebaseUser(fbUser);
        const token = await fbUser.getIdToken();
        setIdToken(token);
      } else {
        setFirebaseUser(null);
        setIdToken(null);
        setUser(null);
        await storage.removeItem('cc_user'); // Clear cache on logout
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const signInWithToken = async (customToken: string, userId: string, email: string, universityId: string) => {
    const credential = await signInWithCustomToken(auth, customToken);
    const token = await credential.user.getIdToken();
    setIdToken(token);
    setFirebaseUser(credential.user);
    
    const userData = {
      id: userId,
      email,
      displayName: '',
      universityId,
      verified: true,
      firebaseUid: credential.user.uid,
    };
    
    setUser(userData);
    // Save user data to storage for instant app loads
    await storage.setItem('cc_user', JSON.stringify(userData));
  };

  const updateUser = (updates: Partial<AppUser>) => {
    setUser(prev => prev ? { ...prev, ...updates } : null);
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setIdToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, firebaseUser, idToken, loading, signInWithToken, updateUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
