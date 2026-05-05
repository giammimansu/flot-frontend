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
  paxCount: number;
  luggage: number;
  mode: import('./domain').TripMode;
  flightNumber: string;
  flightDate: string;   // YYYY-MM-DD
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

/** Blurred partner (locked state) */
export interface LockedPartner {
  firstName: string;
  blurredPhotoUrl: string;
  destination: string;
  verified: boolean;
}

/** Full partner (unlocked state) */
export interface UnlockedPartner {
  userId: string;
  firstName: string;
  lastName: string;
  photoUrl: string;
  age: number;
  city: string;
  languages: string[];
  verified: boolean;
  rating: number;
  totalTrips: number;
  onTimeRate: number;
}

/** Meeting point */
export interface MeetingPoint {
  label: string;
  description: string;
  walkMinutes: number;
}

/** GET /matches/:matchId — locked */
export interface LockedMatch {
  matchId: string;
  status: 'pending';
  score: number;
  savings: number;
  partner: LockedPartner;
  unlockedBy: string[];
}

/** GET /matches/:matchId — unlocked */
export interface UnlockedMatch {
  matchId: string;
  status: 'unlocked';
  partner: UnlockedPartner;
  meetingPoint: MeetingPoint;
  savings: number;
  yourShare: number;
  fullFare: number;
}

export type MatchResponse = LockedMatch | UnlockedMatch;

/** POST /trips/:tripId/unlock */
export interface UnlockRequest {
  matchId: string;
  fakeDoor: boolean;
}

export interface UnlockResponse {
  paymentIntentClientSecret: string;
  amount: number;
  currency: string;
}

/** GET /users/me */
export interface User {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  photoUrl: string;
  blurredPhotoUrl: string;
  isPro: boolean;
  verified: boolean;
  lang: string;
  createdAt: string;
}

/** POST /users/me/verify */
export interface VerifyResponse {
  verificationSessionId: string;
  clientSecret: string;
}

/** GET /airports/:code/stats */
export interface AirportStats {
  totalSavingsMonth: number; // cents
  weeklyMatches: number;
}
