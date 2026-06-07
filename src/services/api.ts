/* ============================================================
   FLOT — API Client (ky instance with auth interceptor)
   ============================================================ */

import ky, { HTTPError } from 'ky';
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

export interface ApiError {
  status: number;       // HTTP status, 0 if not an HTTP error
  message: string;      // backend `error` field when present
}

/** Normalize a thrown error into { status, message }, reading the backend `{error}` body. */
export async function parseApiError(err: unknown): Promise<ApiError> {
  if (err instanceof HTTPError) {
    let message = err.message;
    try {
      const body = (await err.response.clone().json()) as { error?: string } | null;
      if (body?.error) message = body.error;
    } catch {
      /* non-JSON body — keep default message */
    }
    return { status: err.response.status, message };
  }
  return { status: 0, message: err instanceof Error ? err.message : 'Errore di rete' };
}
