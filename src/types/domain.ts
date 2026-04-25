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

/** Auth state */
export type AuthStatus = 'idle' | 'loading' | 'authenticated' | 'unauthenticated';

/** Trip search status */
export type TripStatus = 'idle' | 'creating' | 'searching' | 'matched' | 'expired' | 'cancelled' | 'error';
