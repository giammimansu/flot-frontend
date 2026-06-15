/* Local persistence of matchIds the user has already reviewed.
   The backend trip/match payloads carry no "reviewed" flag, so we
   remember submitted reviews client-side to keep the UI consistent
   across reloads. */

const KEY = 'flot.reviewedMatchIds';

export function getReviewedMatchIds(): Set<string> {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw) as string[];
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

export function markMatchReviewed(matchId: string): void {
  try {
    const ids = getReviewedMatchIds();
    ids.add(matchId);
    localStorage.setItem(KEY, JSON.stringify([...ids]));
  } catch { /* storage unavailable — non-fatal */ }
}

export function isMatchReviewed(matchId: string): boolean {
  return getReviewedMatchIds().has(matchId);
}
