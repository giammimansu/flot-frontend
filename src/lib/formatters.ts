export function formatDateShort(dateStr: string | Date): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '';
  
  return new Intl.DateTimeFormat('it-IT', {
    day: '2-digit',
    month: 'short'
  }).format(date);
}

export function formatTimeShort(dateStr: string | Date): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '';
  
  return new Intl.DateTimeFormat('it-IT', {
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

export function formatRelativeTime(dateStr: string | Date): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffMins < 60) return `${diffMins}m fa`;
  if (diffHours < 24) return `${diffHours}h fa`;
  return `${diffDays}g fa`;
}

export function formatCurrency(amount: number, currency: string = 'EUR'): string {
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

export function calcSavings(_passengers: number, luggage: number): number {
  // Mock savings calculation based on basic rules
  const baseCost = 120; // assumed cost of taxi
  let extraLuggageCost = Math.max(0, luggage - 1) * 10;
  let totalCost = baseCost + extraLuggageCost;
  return totalCost / 2; // Assuming splitting in half
}
