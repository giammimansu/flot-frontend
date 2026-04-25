/* ============================================================
   FLOT — useAuth Hook
   Handles auth initialization, status checking, and actions.
   ============================================================ */

import { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useAirportStore } from '../stores/airportStore';
import {
  getAuthUser,
  getAccessToken,
  socialSignIn,
  authSignOut,
} from '../services/auth';
import type { SocialProvider } from '../services/auth';

export function useAuth() {
  const { status, user, setAuthenticated, setUnauthenticated, setLoading, reset } =
    useAuthStore();
  const navigate = useNavigate();

  /** Check auth status on mount */
  useEffect(() => {
    let cancelled = false;

    async function checkAuth() {
      setLoading();
      const cognitoUser = await getAuthUser();

      if (cancelled) return;

      if (cognitoUser) {
        const token = await getAccessToken();
        if (cancelled) return;

        setAuthenticated(
          {
            userId: cognitoUser.userId,
            email: '',
            firstName: cognitoUser.username ?? '',
            lastName: '',
            photoUrl: '',
            blurredPhotoUrl: '',
            isPro: false,
            verified: false,
            lang: 'en',
            createdAt: '',
          },
          token ?? '',
        );
      } else {
        setUnauthenticated();
      }
    }

    checkAuth();
    return () => {
      cancelled = true;
    };
  }, [setAuthenticated, setUnauthenticated, setLoading]);

  /** Trigger social login */
  const login = useCallback(async (provider: SocialProvider) => {
    await socialSignIn(provider);
  }, []);

  /** Sign out and navigate home */
  const logout = useCallback(async () => {
    await authSignOut();
    reset();
    navigate('/');
  }, [reset, navigate]);

  /** Navigate to the right screen after auth */
  const redirectAfterAuth = useCallback(() => {
    const selectedAirport = useAirportStore.getState().selectedAirport;
    if (selectedAirport) {
      navigate('/check-in');
    } else {
      navigate('/airport');
    }
  }, [navigate]);

  return {
    status,
    user,
    isAuthenticated: status === 'authenticated',
    isLoading: status === 'loading' || status === 'idle',
    login,
    logout,
    redirectAfterAuth,
  };
}
