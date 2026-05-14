import type { ResolvedFlight, FlightRow } from '../types/flights';

const RAPIDAPI_KEY = import.meta.env.VITE_AERODATABOX_API_KEY as string | undefined;
const BASE_URL = 'https://aerodatabox.p.rapidapi.com';

const apiHeaders: Record<string, string> = {
  'X-RapidAPI-Key': RAPIDAPI_KEY ?? '',
  'X-RapidAPI-Host': 'aerodatabox.p.rapidapi.com',
};

function pickLocalTime(block: Record<string, unknown>): string | undefined {
  // Prefer revised/runway (actual) over scheduled. AeroDataBox uses "YYYY-MM-DD HH:MMZ" (space, not T).
  const raw = (block.runwayTime as Record<string, string> | undefined)?.local
    ?? (block.revisedTime as Record<string, string> | undefined)?.local
    ?? (block.scheduledTime as Record<string, string> | undefined)?.local
    ?? (block.scheduledTimeLocal as string | undefined);
  // Normalise space-separated format to ISO8601 so Date.parse works everywhere
  return raw?.replace(' ', 'T');
}

export async function fetchFlightByNumber(
  flightNumber: string,
  date: string,
  signal?: AbortSignal,
): Promise<ResolvedFlight | null> {
  if (!RAPIDAPI_KEY) {
    console.warn('[FlightService] VITE_AERODATABOX_API_KEY not set');
    return null;
  }

  try {
    const res = await fetch(
      `${BASE_URL}/flights/number/${encodeURIComponent(flightNumber)}/${date}`,
      { headers: apiHeaders, signal },
    );

    if (res.status === 404) return null;
    if (!res.ok) {
      console.warn(`[FlightService] fetchFlightByNumber ${res.status}`);
      return null;
    }

    const raw: unknown = await res.json();
    if (!Array.isArray(raw) || raw.length === 0) return null;

    const flight = raw[0] as Record<string, unknown>;
    const arrival = (flight.arrival ?? {}) as Record<string, unknown>;
    const departure = (flight.departure ?? {}) as Record<string, unknown>;

    const depAirport = (departure.airport ?? {}) as Record<string, string>;

    const scheduledTimeLocal = pickLocalTime(arrival);
    if (!scheduledTimeLocal) return null;

    const flightTime = new Date(scheduledTimeLocal).toISOString();
    const displayTime = scheduledTimeLocal.substring(11, 16);

    return {
      flightNumber: flightNumber.toUpperCase(),
      origin: depAirport.iata ?? '',
      originName: depAirport.name ?? '',
      flightTime,
      displayTime,
      date: scheduledTimeLocal.substring(0, 10),
      status: flight.status as string | undefined,
    };
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') throw err;
    console.warn('[FlightService] fetchFlightByNumber error', err);
    return null;
  }
}

export async function fetchFlightsBySlot(
  direction: 'arrivals' | 'departures',
  slotTime: string,
  date: string,
  signal?: AbortSignal,
): Promise<FlightRow[]> {
  if (!RAPIDAPI_KEY) {
    console.warn('[FlightService] VITE_AERODATABOX_API_KEY not set');
    return [];
  }

  const slotDate = new Date(`${date}T${slotTime}:00`);
  const offsetMinutes = Math.round((slotDate.getTime() - Date.now()) / 60000) - 60;
  const dirParam = direction === 'arrivals' ? 'Arrival' : 'Departure';

  const url = new URL(`${BASE_URL}/flights/airports/iata/MXP`);
  url.searchParams.set('offsetMinutes', String(offsetMinutes));
  url.searchParams.set('durationMinutes', '120');
  url.searchParams.set('withLeg', 'true');
  url.searchParams.set('direction', dirParam);
  url.searchParams.set('withCancelled', 'true');
  url.searchParams.set('withCodeshared', 'true');
  url.searchParams.set('withCargo', 'false');
  url.searchParams.set('withPrivate', 'false');
  url.searchParams.set('withLocation', 'false');

  try {
    const res = await fetch(url.toString(), { headers: apiHeaders, signal });

    if (!res.ok) {
      console.warn(`[FlightService] fetchFlightsBySlot ${res.status}`);
      return [];
    }

    const raw = (await res.json()) as Record<string, unknown>;
    const list = (raw[direction] ?? []) as Record<string, unknown>[];

    return list.map((f) => {
      const arr = (f.arrival ?? {}) as Record<string, unknown>;
      const dep = (f.departure ?? {}) as Record<string, unknown>;
      const arrAp = (arr.airport ?? {}) as Record<string, string>;
      const depAp = (dep.airport ?? {}) as Record<string, string>;
      const timeBlock = direction === 'arrivals' ? arr : dep;
      const timeLocal = pickLocalTime(timeBlock) ?? '';

      const originIata = direction === 'arrivals' ? (depAp.iata ?? '') : 'MXP';
      const originName = direction === 'arrivals' ? (depAp.name ?? '') : 'Milan Malpensa';
      const destIata   = direction === 'arrivals' ? 'MXP' : (arrAp.iata ?? depAp.iata ?? '');
      const destName   = direction === 'arrivals' ? 'Milan Malpensa' : (arrAp.name ?? '');

      return {
        number: (f.number as string) ?? '',
        originIata,
        originName,
        destIata,
        destName,
        scheduledTimeLocal: timeLocal,
        status: (f.status as string) ?? '',
      };
    }).filter((r) => r.number);
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') throw err;
    console.warn('[FlightService] fetchFlightsBySlot error', err);
    return [];
  }
}
