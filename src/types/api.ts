/* ============================================================
   FLOT — API Type Definitions
   Mirrors backend contract exactly.
   ============================================================ */

/** Terminal inside an airport */
export interface Terminal {
  code: string;
  label: string;
}

/** Destination zone */
export interface Zone {
  code: string;
  label: string;
  landmarks: string[];
}

/** Meeting point (per terminal) — from airport config */
export interface MeetingPoint {
  label: string;
  description: string;
  walkMinutes: number;
}

/** Airport configuration returned by GET /airports */
export interface Airport {
  code: string;
  name: string;
  city: string;
  country: string;
  currency: string;
  baseFare: number;       // cents
  unlockFee: number;      // cents
  terminals: Terminal[];
  zones: Zone[];
  meetingPoints: Record<string, MeetingPoint>;  // keyed by terminal code
  directionLabels: string[];
  searchTimeoutSec: number;
  scheduledMatchWindowMin: number;
  scheduledAdvanceDays: number;
  active: boolean;
}

/** POST /trips request */
export interface CreateTripRequest {
  airportCode: string;
  terminal: string;
  direction: string;
  destination: string;
  destLat: number;
  destLng: number;
  destPlaceId: string;
  destZone?: string;
  // MVP TO_AIRPORT: departure address in the city (required for FROM_MILAN direction).
  originLat?: number;
  originLng?: number;
  originPlaceId?: string;
  paxCount: number;
  luggage: number;
  mode: import('./domain').TripMode;
  flightNumber: string;
  flightDate: string;   // YYYY-MM-DD
  flightTime?: string;  // ISO UTC arrival — pre-resolved by UI flight lookup
}

/** POST /trips response */
export interface CreateTripResponse {
  tripId: string;
  airportCode: string;
  mode: import('./domain').TripMode;
  status: 'scheduled' | 'searching' | 'matched' | 'expired' | 'cancelled';
  matchId?: string;
  flightTime?: string;
  expiresAt?: string;
  createdAt: string;
}

/** GET /trips/my response */
export interface MyTripsResponse {
  trips: Array<{
    tripId: string;
    airportCode: string;
    terminal: string;
    destination: string;
    direction: string;
    mode: import('./domain').TripMode;
    status: 'scheduled' | 'searching' | 'matched' | 'unlocked' | 'completed' | 'expired' | 'cancelled';
    flightTime: string;
    flightNumber?: string;
    flightDate?: string;
    luggage: number;
    paxCount: number;
    matchId: string | null;
    createdAt: string;
    expiresAt?: string;
  }>;
}

/** Trip snapshot inside a match */
export interface MatchTrip {
  tripId: string;
  terminal: string;
  direction: string;
  destination: string;
  destLat: number;
  destLng: number;
  destZone: string;
  flightNumber: string;
  flightDate: string;
  flightTime: string;
  luggage: number;
  paxCount: number;
  mode: string;
}

/** Public profile of another user (locked view: GET /users/:id) */
export interface PublicUser {
  userId: string;
  firstName: string;
  lastName?: string;
  photoUrl?: string;
  blurredPhotoUrl?: string;
  verified: boolean;
}

/** Aggregate rating from GET /users/:id/rating (or embedded in unlocked profile) */
export interface Rating {
  average: number | null;  // null when no reviews yet
  count: number;
}

/** Full partner (unlocked view of GET /users/:id — shares an active match) */
export interface UnlockedPartner extends PublicUser {
  age?: number;
  city?: string;
  languages?: string[];
  rating?: Rating;
}

/** All Match lifecycle states (mirrors backend MatchStateMachine) */
export type MatchStatus =
  | 'pending'
  | 'partially_unlocked'
  | 'unlocked'
  | 'unlock_expired'
  | 'dissolved'
  | 'expired'
  | 'completed';

/**
 * GET /matches/:matchId — single shape for every status (backend get_match.py).
 * The backend does NOT send partner/meetingPoint/savings: those are composed
 * client-side from GET /users/:id + the airport config (see services/matches.ts).
 */
export interface Match {
  matchId: string;
  status: MatchStatus;
  airportCode: string;
  score: string | number;
  userId1: string;
  userId2: string;
  trip1: MatchTrip;
  trip2: MatchTrip;
  unlockedBy: string[];
  unlockDeadline: string | null;
  createdAt: string;
  completedAt?: string;
  savings?: number;  // optional convenience; not guaranteed by backend
}

/** @deprecated use `Match`. Kept as alias for existing call-sites. */
export type LockedMatch = Match;
export type MatchResponse = Match;

/**
 * Client-composed view for the unlocked connection screen. NOT a backend shape —
 * assembled from a Match + the partner's profile + the airport config.
 */
export interface ConnectionView {
  matchId: string;
  status: MatchStatus;
  partner: UnlockedPartner;
  meetingPoint: MeetingPoint | null;
  savings: number;    // cents
  yourShare: number;  // cents
  fullFare: number;   // cents
}

/** A persisted chat message from GET /matches/:matchId/chat */
export interface ChatHistoryMessage {
  matchId: string;
  messageId: string;
  type: 'user' | 'system';
  text: string;
  createdAt: string;
  senderId?: string;  // absent for system messages
}

/** GET /matches/:matchId/chat response */
export interface ChatHistoryResponse {
  messages: ChatHistoryMessage[];
  nextToken?: string;
}

/** POST /matches/:matchId/review request (P2 #11) */
export interface CreateReviewRequest {
  rating: number;        // 1-5
  comment?: string;      // max 500
}

/** POST /matches/:matchId/review response */
export interface CreateReviewResponse {
  matchId: string;
  reviewedUserId: string;
  rating: number;
}

/** GET /users/:userId/rating response */
export interface UserRating {
  userId: string;
  average: number | null;
  count: number;
}

/** POST /trips/:tripId/unlock */
export interface UnlockRequest {
  matchId: string;
}

export interface UnlockResponse {
  success?: boolean;
  matchStatus?: 'partially_unlocked' | 'unlocked';
  paymentIntentClientSecret?: string;  // present when Stripe is configured (F4)
  amount?: number;                      // cents
  currency?: string;
}

/** GET /users/me */
export interface User {
  userId: string;
  email: string;
  name: string;
  firstName?: string;
  lastName?: string;
  photoUrl: string;
  blurredPhotoUrl: string;
  isPro: boolean;
  verified: boolean;
  lang: string;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  ageGroup?: '18-25' | '26-35' | '36-45' | '46-55' | '56+';
  onboarding: boolean;
  createdAt: string;
}

export type UserProfile = User;

/** POST /users/me/verify */
export interface VerifyResponse {
  verificationSessionId: string;
  clientSecret: string;
}

/** A single in-app notification (GET /notifications) */
export interface NotificationItem {
  sk: string;             // NOTIF#<ts>#<uuid> — stable id
  type?: string;
  title: string;
  body: string;
  payload?: Record<string, unknown>;
  read?: boolean;
  createdAt: string;
}

/** GET /notifications response */
export interface NotificationsResponse {
  notifications: NotificationItem[];
}

/** GET /airports/:code/stats */
export interface AirportStats {
  totalSavingsMonth: number; // cents
  weeklyMatches: number;
}
