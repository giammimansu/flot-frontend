import { api } from './api';
import type { User, PublicUser, VerifyResponse } from '../types/api';

/** GET /users/me */
export async function getMe(): Promise<User> {
  return api.get('users/me').json<User>();
}

/** POST /users/me/verify */
export async function verifyIdentity(): Promise<VerifyResponse> {
  return api.post('users/me/verify').json<VerifyResponse>();
}

/** GET /users/:userId — public profile */
export async function fetchUser(userId: string): Promise<PublicUser> {
  return api.get(`users/${userId}`).json<PublicUser>();
}

/** PUT /users/me/push-token */
export async function registerPushToken(token: string, platform: 'fcm'): Promise<{ registered: boolean }> {
  return api.put('users/me/push-token', { json: { token, platform } }).json<{ registered: boolean }>();
}
