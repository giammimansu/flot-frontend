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
  prefixUrl: import.meta.env.VITE_API_BASE_URL,
  timeout: 10_000,
  hooks: {
    beforeRequest: [
      async (request) => {
        const token = await getAccessToken();
        if (token) {
          request.headers.set('Authorization', `Bearer ${token}`);
        }
      },
    ],
  },
});
