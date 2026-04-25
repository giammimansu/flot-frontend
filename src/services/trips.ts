/* ============================================================
   FLOT — Trips Service
   ============================================================ */

import { api } from './api';
import type { CreateTripRequest, CreateTripResponse } from '../types/api';

/** Create a new trip */
export async function createTrip(data: CreateTripRequest): Promise<CreateTripResponse> {
  return api.post('trips', { json: data }).json<CreateTripResponse>();
}
