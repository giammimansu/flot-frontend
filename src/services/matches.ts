/* ============================================================
   FLOT — Matches Service
   ============================================================ */

import { api } from './api';
import type { MatchResponse, UnlockRequest, UnlockResponse } from '../types/api';

/** GET /matches/:matchId */
export async function fetchMatch(matchId: string): Promise<MatchResponse> {
  return api.get(`matches/${matchId}`).json<MatchResponse>();
}

/** POST /trips/:tripId/unlock */
export async function unlockTrip(
  tripId: string,
  payload: UnlockRequest,
): Promise<UnlockResponse> {
  return api.post(`trips/${tripId}/unlock`, { json: payload }).json<UnlockResponse>();
}
