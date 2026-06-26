import { create } from 'zustand';

import { auth, type AuthUser } from '@/lib/firebase';

interface AuthState {
  user: AuthUser | null;
  /** True indtil første auth-status er kendt (undgår flimmer ved opstart). */
  initializing: boolean;
}

export const useAuthStore = create<AuthState>(() => ({
  user: auth.getCurrentUser(),
  initializing: true,
}));

// Lytteren startes én gang ved module-init (uden komponent-effect, jf. "You Might
// Not Need an Effect" → app-init hører til på modul-niveau).
auth.onAuthStateChanged((user) => {
  useAuthStore.setState({ user, initializing: false });
});

export const signIn = auth.signInWithEmail;
export const signOut = auth.signOut;
