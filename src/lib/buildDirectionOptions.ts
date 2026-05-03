import type { Airport } from '../types/api';

export interface DirectionOption {
  value: string;   // API payload value e.g. "TO_MILAN"
  emoji: string;
  label: string;   // Human-readable e.g. "Arrivo a Milano"
  hint: string;    // Contextual hint below segment
}

export function buildDirectionOptions(airport: Airport): DirectionOption[] {
  return [
    {
      value: airport.directionLabels[0] ?? 'TO_CITY',
      emoji: '🛬',
      label: `Arrivo a ${airport.city}`,
      hint: 'Stai atterrando e vuoi raggiungere la città',
    },
    {
      value: airport.directionLabels[1] ?? 'FROM_CITY',
      emoji: '🛫',
      label: `Parto da ${airport.city}`,
      hint: 'Stai andando in aeroporto per partire',
    },
  ];
}

export function getPickerLabel(direction: string, directionLabels: string[]): string {
  return direction === directionLabels[0] ? 'Quando atterri?' : 'Quando vuoi partire?';
}

export function getCtaLabel(mode: string, direction: string, directionLabels: string[]): string {
  if (mode === 'live') return 'Cerca ora';
  return direction === directionLabels[0] ? 'Conferma arrivo' : 'Conferma partenza';
}
