/* ============================================================
   FLOT — Reviews & Rating Service (P2 #11)
   ============================================================ */

import { api } from './api';
import type {
  CreateReviewRequest,
  CreateReviewResponse,
  UserRating,
} from '../types/api';

/** POST /matches/:matchId/review — rate the partner after a completed trip. */
export async function createReview(
  matchId: string,
  payload: CreateReviewRequest,
): Promise<CreateReviewResponse> {
  return api
    .post(`matches/${matchId}/review`, { json: payload })
    .json<CreateReviewResponse>();
}

/** GET /users/:userId/rating — public average rating. */
export async function getUserRating(userId: string): Promise<UserRating> {
  return api.get(`users/${userId}/rating`).json<UserRating>();
}
