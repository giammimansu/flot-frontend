/* ============================================================
   FLOT — Trip Store (Zustand)
   ============================================================ */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { TripStatus, TripMode, Trip } from '../types/domain';
import type { TripDestination } from '../types/domain';
import type { CreateTripRequest, CreateTripResponse } from '../types/api';
import { createTrip } from '../services/trips';

interface TripState {
  tripId: string | null;
  status: TripStatus;
  error: string | null;
  terminal: string | null;
  destination: string | null;
  luggage: number | null;
  draftDestination: TripDestination | null;

  /** Full trip object from POST /trips response */
  currentTrip: Trip | null;

  /** List of user trips */
  myTrips: import('../types/api').MyTripsResponse['trips'];
  isLoadingMyTrips: boolean;

  /** Persisted across sessions — used as default mode in Check-in */
  preferredMode: TripMode;

  submitTrip: (data: CreateTripRequest) => Promise<CreateTripResponse | null>;
  fetchMyTrips: () => Promise<void>;
  deleteTrip: (tripId: string) => Promise<boolean>;
  setDraftDestination: (dest: TripDestination | null) => void;
  setStatus: (status: TripStatus) => void;
  setCurrentTrip: (trip: Trip) => void;
  setPreferredMode: (mode: TripMode) => void;
  clearTrip: () => void;
  reset: () => void;
}

export const useTripStore = create<TripState>()(
  persist(
    (set) => ({
      tripId: null,
      status: 'idle',
      error: null,
      terminal: null,
      destination: null,
      luggage: null,
      draftDestination: null,
      currentTrip: null,
      myTrips: [],
      isLoadingMyTrips: false,
      preferredMode: 'scheduled',

      submitTrip: async (data) => {
        set({ status: 'creating', error: null });
        try {
          const response = await createTrip(data);
          const trip: Trip = {
            tripId: response.tripId,
            airportCode: response.airportCode,
            mode: response.mode,
            status: response.status,
            matchId: response.matchId,
            flightTime: response.flightTime,
            expiresAt: response.expiresAt,
            createdAt: response.createdAt,
          };
          set({
            tripId: response.tripId,
            status: 'searching',
            terminal: data.terminal,
            destination: data.destination,
            luggage: data.luggage,
            currentTrip: trip,
            preferredMode: data.mode,
          });
          return response;
        } catch (err) {
          set({
            status: 'error',
            error: err instanceof Error ? err.message : 'Failed to create trip',
          });
          return null;
        }
      },

      fetchMyTrips: async () => {
        set({ isLoadingMyTrips: true });
        try {
          const res = await import('../services/trips').then(m => m.getMyTrips());
          set({ myTrips: res.trips, isLoadingMyTrips: false });
        } catch (err) {
          console.error('Failed to fetch my trips', err);
          set({ isLoadingMyTrips: false });
        }
      },

      deleteTrip: async (tripId) => {
        try {
          await import('../services/trips').then(m => m.cancelTrip(tripId));
          set((state) => ({
            myTrips: state.myTrips.map(t => t.tripId === tripId ? { ...t, status: 'cancelled' } : t),
            ...(state.tripId === tripId ? { status: 'cancelled' as TripStatus } : {})
          }));
          return true;
        } catch (err) {
          console.error('Failed to cancel trip', err);
          return false;
        }
      },

      setDraftDestination: (dest) => set({ draftDestination: dest }),

      setStatus: (status) => set({ status }),

      setCurrentTrip: (trip) => set({ currentTrip: trip }),

      setPreferredMode: (mode) => set({ preferredMode: mode }),

      clearTrip: () =>
        set({
          tripId: null,
          status: 'idle',
          error: null,
          terminal: null,
          destination: null,
          luggage: null,
          draftDestination: null,
          currentTrip: null,
        }),

      reset: () =>
        set({
          tripId: null,
          status: 'idle',
          error: null,
          terminal: null,
          destination: null,
          luggage: null,
          draftDestination: null,
          currentTrip: null,
        }),
    }),
    {
      name: 'flot-trip',
      partialize: (s) => ({
        preferredMode: s.preferredMode,
        tripId: s.tripId,
        terminal: s.terminal,
        destination: s.destination,
        luggage: s.luggage,
        currentTrip: s.currentTrip,
      }),
    },
  ),
);
