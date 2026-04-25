/* ============================================================
   FLOT — Formatting Utilities
   ============================================================ */

/**
 * Format cents to a currency string.
 * @param cents Amount in cents (e.g. 12000 = €120.00)
 * @param currency ISO currency code (e.g. "EUR")
 */
export function formatCurrency(cents: number, currency: string): string {
  const value = cents / 100;
  try {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency,
      minimumFractionDigits: value % 1 === 0 ? 0 : 2,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `€${value.toFixed(2)}`;
  }
}

/**
 * Calculate estimated savings.
 * @param baseFareCents Full fare in cents
 * @param paxCount Number of passengers pooling
 * @returns Savings in cents
 */
export function calcSavings(baseFareCents: number, paxCount: number): number {
  // You pay baseFare / (paxCount + 1), saving the rest
  const yourShare = Math.round(baseFareCents / (paxCount + 1));
  return baseFareCents - yourShare;
}
