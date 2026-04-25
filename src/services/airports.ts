/* ============================================================
   FLOT — Airports Service
   ============================================================ */

import { api } from './api';
import type { Airport } from '../types/api';

/** Fetch all active airports */
export async function fetchAirports(): Promise<Airport[]> {
  return api.get('airports').json<Airport[]>();
}
