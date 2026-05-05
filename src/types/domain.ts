/* ============================================================
   FLOT — Domain Types (client-side only)
   ============================================================ */

/** A destination option built from airport zones */
export interface Destination {
  name: string;
  sub: string;
  zone: string;
  zoneCode: string;
}

/** A GPS-validated destination from Google Places */
export interface TripDestination {
  label: string;
  lat: number;
  lng: number;
  placeId: string;
}

/** Auth state */
export type AuthStatus = 'idle' | 'loading' | 'authenticated' | 'unauthenticated';

/** Trip search status */
export type TripStatus = 'idle' | 'creating' | 'scheduled' | 'searching' | 'matched' | 'expired' | 'cancelled' | 'error';

/** Dual-mode matching */
export type TripMode = 'live' | 'scheduled';

/** Active trip returned by POST /trips and GET /trips/:tripId */
export interface Trip {
  tripId: string;
  airportCode: string;
  terminal?: string;
  destination?: string;
  direction?: string;
  mode: TripMode;
  status: 'scheduled' | 'searching' | 'matched' | 'unlocked' | 'completed' | 'cancelled' | 'expired';
  matchId?: string;
  flightTime?: string;
  flightNumber?: string;
  flightDate?: string;
  luggage?: number;
  paxCount?: number;
  expiresAt?: string;
  createdAt: string;
}
