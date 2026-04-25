/* ============================================================
   FLOT — Airport Store (Zustand)
   ============================================================ */

import { create } from 'zustand';
import type { Airport } from '../types/api';
import { fetchAirports } from '../services/airports';

interface AirportState {
  airports: Airport[];
  selectedAirport: Airport | null;
  loading: boolean;
  error: string | null;

  /** Fetch all airports from API */
  loadAirports: () => Promise<void>;
  /** Select an airport */
  selectAirport: (code: string) => void;
  /** Reset */
  reset: () => void;
}

export const useAirportStore = create<AirportState>((set, get) => ({
  airports: [],
  selectedAirport: null,
  loading: false,
  error: null,

  loadAirports: async () => {
    set({ loading: true, error: null });
    try {
      const airports = await fetchAirports();
      const active = airports.filter((a) => a.active);
      set({ airports: active, loading: false });

      // Auto-select if only one active airport
      if (active.length === 1) {
        set({ selectedAirport: active[0] });
      }
    } catch (err) {
      set({
        loading: false,
        error: err instanceof Error ? err.message : 'Failed to load airports',
      });
    }
  },

  selectAirport: (code) => {
    const airport = get().airports.find((a) => a.code === code) ?? null;
    set({ selectedAirport: airport });
  },

  reset: () =>
    set({ airports: [], selectedAirport: null, loading: false, error: null }),
}));
