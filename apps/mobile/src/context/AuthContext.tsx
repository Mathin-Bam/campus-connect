import React, { createContext, useContext, useState, ReactNode } from 'react';

type User = {
  id: string;
  email: string;
  displayName: string;
  universityId: string;
  verified: boolean;
};

type AuthContextType = {
  user: User | null;
  token: string | null;
  universityId: string | null;
  universityName: string | null;
  emailDomain: string | null;
  email: string | null;
  setAuth: (user: User, token: string) => void;
  setUniversity: (id: string, name: string, domain: string) => void;
  setEmail: (email: string) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [universityId, setUniversityId] = useState<string | null>(null);
  const [universityName, setUniversityName] = useState<string | null>(null);
  const [emailDomain, setEmailDomain] = useState<string | null>(null);
  const [email, setEmailState] = useState<string | null>(null);

  return (
    <AuthContext.Provider value={{
      user, token, universityId, universityName, emailDomain, email,
      setAuth: (u, t) => { setUser(u); setToken(t); },
      setUniversity: (id, name, domain) => { setUniversityId(id); setUniversityName(name); setEmailDomain(domain); },
      setEmail: (e) => setEmailState(e),
      logout: () => { setUser(null); setToken(null); },
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
