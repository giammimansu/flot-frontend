/* ============================================================
   FLOT — Flight lookup (via backend proxy)
   The AeroDataBox key stays server-side; the client never holds it.
     GET /flights/lookup?number=&date=
     GET /flights/slot?direction=&slot=&date=&airport=
   ============================================================ */

import { publicApi } from './api';
import type { ResolvedFlight, FlightRow } from '../types/flights';

interface LookupResponse {
  flightNumber: string;
  arrivalTimeLocal: string | null;
  arrivalTimeUtc: string | null;
  departureTimeLocal?: string | null;
  departureTimeUtc?: string | null;
  status?: string;
  delayMinutes?: number | null;
  origin?: string | null;
  destination?: string | null;
  airline?: { iata: string; name: string; nameIT: string };
}

function toIso(raw: string): string {
  // AeroDataBox local/utc times may be "YYYY-MM-DD HH:MMZ"; normalize to ISO.
  const d = new Date(raw.replace(' ', 'T'));
  return isNaN(d.getTime()) ? '' : d.toISOString();
}

/** GET /flights/lookup — resolve a single flight by number + date. */
export async function fetchFlightByNumber(
  flightNumber: string,
  date: string,
  signal?: AbortSignal,
): Promise<ResolvedFlight | null> {
  try {
    const data = await publicApi
      .get('flights/lookup', { searchParams: { number: flightNumber, date }, signal })
      .json<LookupResponse>();

    if (!data?.arrivalTimeUtc) return null;
    const flightTime = toIso(data.arrivalTimeUtc);
    if (!flightTime) return null;

    const departureTime = data.departureTimeUtc ? toIso(data.departureTimeUtc) : undefined;

    return {
      flightNumber: data.flightNumber ?? flightNumber.toUpperCase(),
      origin: data.origin ?? '',
      originName: data.origin ?? '',
      destination: data.destination ?? '',
      flightTime,
      displayTime: (data.arrivalTimeLocal ?? '').substring(11, 16),
      departureTime: departureTime || undefined,
      departureDisplayTime: data.departureTimeLocal ? (data.departureTimeLocal).substring(11, 16) : undefined,
      date: flightTime.substring(0, 10),
      status: data.status,
    };
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') throw err;
    // 404 (not found) / 5xx / network → treat as "not resolved".
    return null;
  }
}

/** GET /flights/slot — list arrivals/departures at the hub around a time slot. */
export async function fetchFlightsBySlot(
  direction: 'arrivals' | 'departures',
  slotTime: string,
  date: string,
  airportCode = 'MXP',
  signal?: AbortSignal,
): Promise<FlightRow[]> {
  try {
    return await publicApi
      .get('flights/slot', {
        searchParams: { direction, slot: slotTime, date, airport: airportCode },
        signal,
      })
      .json<FlightRow[]>();
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') throw err;
    return [];
  }
}
