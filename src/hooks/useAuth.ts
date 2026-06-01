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
import { Hub } from 'aws-amplify/utils';

/** Call this ONCE at app boot (in AuthInit). Runs the Cognito session check. */
export function useAuthInit() {
  const { setAuthenticated, setUnauthenticated, setLoading } = useAuthStore();

  useEffect(() => {
    let cancelled = false;

    async function checkAuth() {
      setLoading();

      const isDevBypass = !import.meta.env.VITE_COGNITO_USER_POOL_ID;
      if (isDevBypass) {
        const devUserStr = localStorage.getItem('dev_user_session');
        if (devUserStr) {
          try {
            const devUser = JSON.parse(devUserStr);
            setAuthenticated(devUser, 'mock-token');
            return;
          } catch {
            // ignore
          }
        }
        setUnauthenticated();
        return;
      }

      const cognitoUser = await getAuthUser();
      if (cancelled) return;

      if (cognitoUser) {
        const token = await getAccessToken();
        if (cancelled) return;

        const session = await import('aws-amplify/auth').then((m) =>
          m.fetchAuthSession()
        );
        const idToken = session.tokens?.idToken;
        const claims = idToken?.payload ?? {};
        const fullName = String(claims['name'] ?? '');
        const nameParts = fullName.trim().split(/\s+/);
        const firstName = nameParts[0] ?? cognitoUser.username ?? '';
        const lastName = nameParts.slice(1).join(' ');
        const photoUrl = String(claims['picture'] ?? '');
        const email = String(claims['email'] ?? '');

        setAuthenticated(
          {
            userId: cognitoUser.userId,
            email,
            name: fullName || firstName,
            firstName,
            lastName,
            photoUrl,
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

    const unsubscribe = Hub.listen('auth', ({ payload }) => {
      switch (payload.event) {
        case 'signedIn':
          checkAuth();
          break;
        case 'signedOut':
          setUnauthenticated();
          break;
      }
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [setAuthenticated, setUnauthenticated, setLoading]);
}

export function useAuth() {
  const { status, user, reset } = useAuthStore();
  const navigate = useNavigate();

  /** Trigger social login */
  const login = useCallback(async (provider: SocialProvider) => {
    const isDevBypass = !import.meta.env.VITE_COGNITO_USER_POOL_ID;
    if (isDevBypass) {
      const devUser = {
        userId: 'dev-user-id',
        email: 'dev@flot.app',
        name: 'Dev User',
        firstName: 'Dev',
        lastName: 'User',
        photoUrl: '',
        blurredPhotoUrl: '',
        isPro: false,
        verified: true,
        lang: 'it',
        createdAt: new Date().toISOString(),
      };
      localStorage.setItem('dev_user_session', JSON.stringify(devUser));
      useAuthStore.getState().setAuthenticated(devUser, 'mock-token');

      const selectedAirport = useAirportStore.getState().selectedAirport;
      navigate(selectedAirport ? '/check-in' : '/airport');
    } else {
      await socialSignIn(provider);
    }
  }, [navigate]);

  /** Sign out and navigate home */
  const logout = useCallback(async () => {
    const isDevBypass = !import.meta.env.VITE_COGNITO_USER_POOL_ID;
    if (isDevBypass) {
      localStorage.removeItem('dev_user_session');
    } else {
      await authSignOut();
    }
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
