import { create } from 'zustand';
import type { MatchResponse } from '../types/api';

interface MatchState {
  currentMatch: MatchResponse | null;
  setMatch: (match: MatchResponse | null) => void;
  reset: () => void;
}

export const useMatchStore = create<MatchState>((set) => ({
  currentMatch: null,
  setMatch: (match) => set({ currentMatch: match }),
  reset: () => set({ currentMatch: null }),
}));
