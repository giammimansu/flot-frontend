/* ============================================================
   FLOT — Amplify Auth Configuration & Service
   ============================================================ */

import { Amplify } from 'aws-amplify';
import {
  signInWithRedirect,
  signOut,
  getCurrentUser,
  fetchAuthSession,
} from 'aws-amplify/auth';

/** Configure Amplify — call once at app boot */
export function configureAuth() {
  Amplify.configure({
    Auth: {
      Cognito: {
        userPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID,
        userPoolClientId: import.meta.env.VITE_COGNITO_CLIENT_ID,
        loginWith: {
          oauth: {
            domain: import.meta.env.VITE_COGNITO_DOMAIN,
            scopes: ['openid', 'email', 'profile'],
            redirectSignIn: [`${window.location.origin}/auth/callback`],
            redirectSignOut: [`${window.location.origin}`],
            responseType: 'code',
            providers: [{ custom: 'Google' }, { custom: 'SignInWithApple' }],
          },
        },
      },
    },
  });
}

export type SocialProvider = 'Google' | 'Apple';

/** Trigger social login redirect */
export async function socialSignIn(provider: SocialProvider) {
  await signInWithRedirect({
    provider: provider === 'Apple' ? 'Apple' : 'Google',
  });
}

/** Get current authenticated user (or null) */
export async function getAuthUser() {
  try {
    const user = await getCurrentUser();
    return user;
  } catch {
    return null;
  }
}

/** Get JWT for API calls */
export async function getAccessToken(): Promise<string | null> {
  try {
    // First attempt — use cached session
    const session = await fetchAuthSession();
    const idToken = session.tokens?.idToken?.toString() ?? null;
    if (idToken) return idToken;

    // Second attempt — force a token refresh
    const refreshed = await fetchAuthSession({ forceRefresh: true });
    return refreshed.tokens?.idToken?.toString() ?? null;
  } catch {
    return null;
  }
}

/** Sign out */
export async function authSignOut() {
  await signOut();
}
