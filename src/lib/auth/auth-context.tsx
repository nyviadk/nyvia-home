import { createContext, type ReactNode, useContext, useEffect, useMemo, useState } from 'react';

import { auth, type AuthUser } from '@/lib/firebase';

interface AuthContextValue {
  user: AuthUser | null;
  /** True indtil første auth-status er kendt (undgår flimmer ved opstart). */
  initializing: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => auth.getCurrentUser());
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((nextUser) => {
      setUser(nextUser);
      setInitializing(false);
    });
    return unsubscribe;
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      initializing,
      signIn: auth.signInWithEmail,
      signOut: auth.signOut,
    }),
    [user, initializing]
  );

  return <AuthContext value={value}>{children}</AuthContext>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth skal bruges inden i en AuthProvider');
  return ctx;
}
