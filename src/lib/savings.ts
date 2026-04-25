import type { Airport } from '../types/api';

/** Savings per rider when pool of N shares a fixed fare */
export function computeSavings(baseFareCents: number, paxShare: number): number {
  if (paxShare <= 1) return 0;
  const perRider = baseFareCents / paxShare;
  return (baseFareCents - perRider) / 100;
}

/** Share per rider (money each pays) */
export function computeShare(baseFareCents: number, paxShare: number): number {
  if (paxShare <= 0) return baseFareCents / 100;
  return baseFareCents / paxShare / 100;
}

/** Max savings for airport (2 riders) */
export function maxSavings(airport: Airport): number {
  return computeSavings(airport.baseFare, 2);
}
