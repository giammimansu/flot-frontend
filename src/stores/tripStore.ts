/* ============================================================
   FLOT — Trip Store (Zustand)
   ============================================================ */

import { create } from 'zustand';
import type { TripStatus } from '../types/domain';
import type { CreateTripRequest, CreateTripResponse } from '../types/api';
import { createTrip } from '../services/trips';

interface TripState {
  tripId: string | null;
  status: TripStatus;
  error: string | null;

  /** Submit a new trip */
  submitTrip: (data: CreateTripRequest) => Promise<CreateTripResponse | null>;
  /** Set status manually */
  setStatus: (status: TripStatus) => void;
  /** Reset */
  reset: () => void;
}

export const useTripStore = create<TripState>((set) => ({
  tripId: null,
  status: 'idle',
  error: null,

  submitTrip: async (data) => {
    set({ status: 'creating', error: null });
    try {
      const response = await createTrip(data);
      set({
        tripId: response.tripId,
        status: 'searching',
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

  setStatus: (status) =>
    set({ status }),

  reset: () =>
    set({ tripId: null, status: 'idle', error: null }),
}));
