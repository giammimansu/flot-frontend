/* ============================================================
   FLOT — Airports Service
   ============================================================ */

import { api } from './api';
import type { Airport, AirportStats } from '../types/api';

/** Fetch all active airports */
export async function fetchAirports(): Promise<Airport[]> {
  return api.get('airports').json<Airport[]>();
}

/** Fetch aggregate stats for an airport (savings counter on entry screen) */
export async function fetchAirportStats(code: string): Promise<AirportStats> {
  return api.get(`airports/${code}/stats`).json<AirportStats>();
}
