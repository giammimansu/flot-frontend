import { api } from './api';
import type { User, PublicUser, VerifyResponse, PartnerReviewsResponse } from '../types/api';

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

/** GET /users/:userId/reviews — reviews received (match partners only) */
export async function fetchUserReviews(userId: string): Promise<PartnerReviewsResponse> {
  return api.get(`users/${userId}/reviews`).json<PartnerReviewsResponse>();
}

/** PUT /users/me/push-token */
export async function registerPushToken(token: string, platform: 'fcm'): Promise<{ registered: boolean }> {
  return api.put('users/me/push-token', { json: { token, platform } }).json<{ registered: boolean }>();
}

interface PhotoUploadResponse {
  uploadUrl: string;
  uploadFields: Record<string, string>;
  photoKey: string;
}

/** PUT /users/me/photo → presigned S3 POST fields */
export async function requestPhotoUploadUrl(contentType: string): Promise<PhotoUploadResponse> {
  return api.put('users/me/photo', { json: { contentType } }).json<PhotoUploadResponse>();
}

/** Upload image to S3 via presigned POST (multipart/form-data) */
export async function uploadPhotoToS3(
  uploadUrl: string,
  uploadFields: Record<string, string>,
  file: File,
): Promise<void> {
  const formData = new FormData();
  // S3 requires `key` to be the first field
  if (uploadFields.key) formData.append('key', uploadFields.key);
  Object.entries(uploadFields).forEach(([k, v]) => {
    if (k === 'key' || k === 'Content-Type') return;
    formData.append(k, v);
  });
  formData.append('Content-Type', file.type || 'image/jpeg');
  formData.append('file', file, 'original.webp');

  try {
    const res = await fetch(uploadUrl, { method: 'POST', body: formData });
    // S3 presigned POST returns 204 — non-2xx here is a real error
    if (!res.ok && res.status !== 204) throw new Error(`S3 upload failed: ${res.status}`);
  } catch (err) {
    // S3 204 has no CORS headers → browser throws TypeError even on success.
    // Only re-throw if it's not a network/CORS TypeError.
    if (!(err instanceof TypeError)) throw err;
  }
}

/**
 * Poll GET /users/me until photoUrl differs from previousPhotoUrl or timeout.
 * Used after S3 upload to wait for ProcessPhoto Lambda to finish.
 */
export async function waitForPhotoUpdate(
  previousPhotoUrl: string | undefined,
  { intervalMs = 2000, maxAttempts = 10 }: { intervalMs?: number; maxAttempts?: number } = {},
): Promise<User> {
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise((r) => setTimeout(r, intervalMs));
    const user = await getMe();
    if (user.photoUrl && user.photoUrl !== previousPhotoUrl) return user;
  }
  throw new Error('PHOTO_UPDATE_TIMEOUT');
}

export interface UpdateProfilePayload {
  gender?: string;
  ageGroup?: string;
  lang?: string;
  onboarding?: boolean;
  name?: string;
}

/** PUT /users/me */
export async function updateProfile(payload: UpdateProfilePayload): Promise<User> {
  return api.put('users/me', { json: payload }).json<User>();
}
