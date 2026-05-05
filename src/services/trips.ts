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
  const raw = await api.get('trips/my').json<{ trips: Record<string, unknown>[] }>();
  // Normalize: backend returns some numeric fields as strings
  const trips = raw.trips.map((t) => ({
    tripId: String(t.tripId ?? ''),
    airportCode: String(t.airportCode ?? ''),
    terminal: String(t.terminal ?? ''),
    destination: String(t.destination ?? ''),
    direction: String(t.direction ?? ''),
    mode: (t.mode as import('../types/domain').TripMode) ?? 'scheduled',
    status: (t.status as import('../types/api').MyTripsResponse['trips'][0]['status']) ?? 'scheduled',
    flightTime: String(t.flightTime ?? t.timeBucket ?? ''),
    flightNumber: t.flightNumber ? String(t.flightNumber) : undefined,
    flightDate: t.flightDate ? String(t.flightDate) : undefined,
    luggage: Number(t.luggage ?? 0),
    paxCount: Number(t.paxCount ?? 1),
    matchId: (t.matchId as string | null) ?? (t.tentativeMatchId as string | null) ?? null,
    createdAt: String(t.createdAt ?? ''),
    expiresAt: t.expiresAt ? String(t.expiresAt) : undefined,
  }));
  return { trips };
}

/** DELETE /trips/:tripId */
export async function cancelTrip(tripId: string): Promise<{ tripId: string; status: string }> {
  return api.delete(`trips/${tripId}`).json<{ tripId: string; status: string }>();
}
