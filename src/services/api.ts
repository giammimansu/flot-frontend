/* ============================================================
   FLOT — API Client (ky instance with auth interceptor)
   ============================================================ */

import ky from 'ky';
import { getAccessToken } from './auth';

/**
 * Pre-configured ky instance.
 * - Adds Cognito JWT on every request
 * - Points to the REST API base URL
 * - 10s timeout
 */
export const api = ky.create({
  prefixUrl: import.meta.env.VITE_API_BASE_URL.replace(/\/?$/, '/'),
  timeout: 10_000,
  hooks: {
    beforeRequest: [
      async (request) => {
        const token = await getAccessToken();
        console.debug('[api] token:', token ? `${token.slice(0, 20)}…` : 'NULL');
        console.debug('[api] Authorization header:', request.headers.get('Authorization'));
        if (!token) {
          throw new Error('AUTH_REQUIRED');
        }
        request.headers.set('Authorization', `Bearer ${token}`);
        console.debug('[api] header set, first 20 chars:', token.slice(0, 20));
      },
    ],
  },
});
