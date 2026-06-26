import { create } from 'zustand';

import { auth, type AuthUser } from '@/lib/firebase';
import { hotReloadSubscribe } from '@/lib/hot-reload-singleton';

interface AuthState {
  user: AuthUser | null;
  /** True indtil første auth-status er kendt (undgår flimmer ved opstart). */
  initializing: boolean;
}

export const useAuthStore = create<AuthState>(() => ({
  user: auth.getCurrentUser(),
  initializing: true,
}));

// Lytteren startes ved module-init (uden komponent-effect, jf. "You Might Not Need
// an Effect" → app-init hører til på modul-niveau). hotReloadSubscribe forhindrer
// leak ved Fast Refresh.
hotReloadSubscribe('nyvia.auth', () =>
  auth.onAuthStateChanged((user) => {
    useAuthStore.setState({ user, initializing: false });
  })
);

export const signIn = auth.signInWithEmail;
export const signOut = auth.signOut;
