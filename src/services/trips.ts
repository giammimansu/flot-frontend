/* ============================================================
   FLOT — Trips Service
   ============================================================ */

import { api } from './api';
import type { CreateTripRequest, CreateTripResponse } from '../types/api';
import type { Trip } from '../types/domain';

/** Create a new trip */
export async function createTrip(data: CreateTripRequest): Promise<CreateTripResponse> {
  return api.post('trips', { json: data }).json<CreateTripResponse>();
}

/** GET /trips/:tripId */
export async function getTrip(tripId: string): Promise<Trip> {
  return api.get(`trips/${tripId}`).json<Trip>();
}

/** PATCH /trips/:tripId — e.g. cancel */
export async function patchTrip(tripId: string, patch: Partial<Pick<Trip, 'status'>>): Promise<void> {
  await api.patch(`trips/${tripId}`, { json: patch });
}

/** GET /trips/my */
export async function getMyTrips(): Promise<import('../types/api').MyTripsResponse> {
  return api.get('trips/my').json<import('../types/api').MyTripsResponse>();
}

/** DELETE /trips/:tripId */
export async function cancelTrip(tripId: string): Promise<{ tripId: string; status: string }> {
  return api.delete(`trips/${tripId}`).json<{ tripId: string; status: string }>();
}
