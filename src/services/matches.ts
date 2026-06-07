/* ============================================================
   FLOT — Matches Service
   ============================================================ */

import { api } from './api';
import type {
  Airport,
  ChatHistoryMessage,
  ChatHistoryResponse,
  ConnectionView,
  Match,
  MatchResponse,
  UnlockedPartner,
  UnlockRequest,
  UnlockResponse,
} from '../types/api';

/** GET /matches/:matchId */
export async function fetchMatch(matchId: string): Promise<MatchResponse> {
  return api.get(`matches/${matchId}`).json<MatchResponse>();
}

/** GET /users/:userId — unlocked profile (caller shares an active match). */
export async function fetchPartnerProfile(userId: string): Promise<UnlockedPartner> {
  return api.get(`users/${userId}`).json<UnlockedPartner>();
}

/** The partner's userId for the current user within a match. */
export function partnerIdOf(match: Match, currentUserId: string): string {
  return match.userId1 === currentUserId ? match.userId2 : match.userId1;
}

/**
 * Compose the unlocked connection view from data the backend actually returns.
 * `get_match.py` sends no partner/meetingPoint/savings — we assemble them from
 * the partner profile and the airport config (Rule: no hardcoded airport data).
 */
export function composeConnectionView(
  match: Match,
  currentUserId: string,
  partner: UnlockedPartner,
  airport: Airport | null,
): ConnectionView {
  // trip1 belongs to userId1, trip2 to userId2 (backend convention).
  const myTrip = match.userId1 === currentUserId ? match.trip1 : match.trip2;
  const terminal = myTrip?.terminal;

  const meetingPoints = airport?.meetingPoints ?? {};
  const meetingPoint =
    (terminal && meetingPoints[terminal]) ||
    Object.values(meetingPoints)[0] ||
    null;

  const fullFare = airport?.baseFare ?? 0;        // cents
  const yourShare = Math.round(fullFare / 2);     // split in two
  const savings = fullFare - yourShare;           // ≈ half the fixed fare

  return {
    matchId: match.matchId,
    status: match.status,
    partner,
    meetingPoint,
    savings,
    yourShare,
    fullFare,
  };
}

/** GET /matches/:matchId/chat — one page of history (oldest-first). */
export async function getChatHistory(
  matchId: string,
  opts: { limit?: number; nextToken?: string } = {},
): Promise<ChatHistoryResponse> {
  const searchParams: Record<string, string> = {};
  if (opts.limit) searchParams.limit = String(opts.limit);
  if (opts.nextToken) searchParams.nextToken = opts.nextToken;
  return api.get(`matches/${matchId}/chat`, { searchParams }).json<ChatHistoryResponse>();
}

/** Full chat history, following pagination (capped). Oldest-first. */
export async function getFullChatHistory(
  matchId: string,
  maxPages = 10,
): Promise<ChatHistoryMessage[]> {
  const all: ChatHistoryMessage[] = [];
  let nextToken: string | undefined;
  for (let page = 0; page < maxPages; page++) {
    const res = await getChatHistory(matchId, { limit: 100, nextToken });
    all.push(...res.messages);
    nextToken = res.nextToken;
    if (!nextToken) break;
  }
  return all;
}

/** POST /matches/:matchId/decline */
export async function declineMatch(matchId: string): Promise<void> {
  await api.post(`matches/${matchId}/decline`);
}

/** POST /trips/:tripId/unlock */
export async function unlockTrip(
  tripId: string,
  payload: UnlockRequest,
): Promise<UnlockResponse> {
  return api.post(`trips/${tripId}/unlock`, { json: payload }).json<UnlockResponse>();
}
