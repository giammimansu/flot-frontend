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
import { getMe } from '../services/users';
import { syncLanguageFromUser } from '../i18n/config';
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
            if (devUser.onboarding === undefined) {
              devUser.onboarding = false;
            }
            setAuthenticated(devUser, 'mock-token');
            syncLanguageFromUser(devUser.lang);
            return;
          } catch {
            // ignore
          }
        }
        setUnauthenticated();
        return;
      }

      // On OAuth callback, fetchAuthSession() is what actually triggers the
      // PKCE code exchange in Amplify v6. getCurrentUser() alone does not.
      // Call it first so tokens are stored before we check the user.
      const searchParams = new URLSearchParams(window.location.search);
      const isOAuthCallback = searchParams.has('code') && searchParams.has('state');
      if (isOAuthCallback) {
        try {
          const { fetchAuthSession } = await import('aws-amplify/auth');
          await fetchAuthSession();
        } catch (err) {
          console.error('[useAuthInit] OAuth code exchange failed:', err);
          // Exchange failed — don't set unauthenticated, wait for Hub signedIn
          return;
        }
        if (cancelled) return;
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

        // Set authenticated with fallback claims first, defaulting onboarding to true
        // to prevent page flashes for onboarded users while the profile is fetching.
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
            lang: 'it',
            onboarding: true,
            createdAt: '',
          },
          token ?? '',
        );

        try {
          const profile = await getMe();
          if (!cancelled) {
            setAuthenticated(profile, token ?? '');
            // Backend is the source of truth for a logged-in user's language.
            syncLanguageFromUser(profile.lang);
          }
        } catch (error) {
          console.error('[useAuthInit] Failed to fetch profile from backend:', error);
        }
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
        onboarding: false,
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
