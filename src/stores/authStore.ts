/* ============================================================
   FLOT — Auth Store (Zustand)
   ============================================================ */

import { create } from 'zustand';
import type { AuthStatus } from '../types/domain';
import type { User } from '../types/api';

interface AuthState {
  status: AuthStatus;
  user: User | null;
  token: string | null;

  /** Set authenticated with user data */
  setAuthenticated: (user: User, token: string) => void;
  /** Set unauthenticated */
  setUnauthenticated: () => void;
  /** Set loading state */
  setLoading: () => void;
  /** Update user (after profile fetch) */
  updateUser: (user: User) => void;
  /** Update token (after refresh) */
  updateToken: (token: string) => void;
  /** Reset everything */
  reset: () => void;
}

const initialState = {
  status: 'idle' as AuthStatus,
  user: null as User | null,
  token: null as string | null,
};

export const useAuthStore = create<AuthState>((set) => ({
  ...initialState,

  setAuthenticated: (user, token) =>
    set({ status: 'authenticated', user, token }),

  setUnauthenticated: () =>
    set({ status: 'unauthenticated', user: null, token: null }),

  setLoading: () =>
    set({ status: 'loading' }),

  updateUser: (user) =>
    set({ user }),

  updateToken: (token) =>
    set({ token }),

  reset: () =>
    set(initialState),
}));
