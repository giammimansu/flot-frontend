export interface AirlineInfo {
  iata: string;
  name: string;
  nameIT: string;
}

export const AIRLINE_PREFIXES: Record<string, AirlineInfo> = {
  AZ: { iata: 'AZ', name: 'ITA Airways', nameIT: 'ITA Airways' },
  FR: { iata: 'FR', name: 'Ryanair', nameIT: 'Ryanair' },
  U2: { iata: 'U2', name: 'easyJet', nameIT: 'easyJet' },
  LH: { iata: 'LH', name: 'Lufthansa', nameIT: 'Lufthansa' },
  LX: { iata: 'LX', name: 'Swiss', nameIT: 'Swiss' },
  EK: { iata: 'EK', name: 'Emirates', nameIT: 'Emirates' },
  TK: { iata: 'TK', name: 'Turkish Airlines', nameIT: 'Turkish Airlines' },
  AF: { iata: 'AF', name: 'Air France', nameIT: 'Air France' },
  KL: { iata: 'KL', name: 'KLM', nameIT: 'KLM' },
  BA: { iata: 'BA', name: 'British Airways', nameIT: 'British Airways' },
  IB: { iata: 'IB', name: 'Iberia', nameIT: 'Iberia' },
  VY: { iata: 'VY', name: 'Vueling', nameIT: 'Vueling' },
  W6: { iata: 'W6', name: 'Wizz Air', nameIT: 'Wizz Air' },
  OS: { iata: 'OS', name: 'Austrian Airlines', nameIT: 'Austrian Airlines' },
  SK: { iata: 'SK', name: 'SAS', nameIT: 'SAS' },
  AY: { iata: 'AY', name: 'Finnair', nameIT: 'Finnair' },
  TP: { iata: 'TP', name: 'TAP Air Portugal', nameIT: 'TAP Air Portugal' },
  QR: { iata: 'QR', name: 'Qatar Airways', nameIT: 'Qatar Airways' },
  EY: { iata: 'EY', name: 'Etihad Airways', nameIT: 'Etihad Airways' },
  SV: { iata: 'SV', name: 'Saudia', nameIT: 'Saudia' },
  MS: { iata: 'MS', name: 'EgyptAir', nameIT: 'EgyptAir' },
  RO: { iata: 'RO', name: 'TAROM', nameIT: 'TAROM' },
  FZ: { iata: 'FZ', name: 'flydubai', nameIT: 'flydubai' },
  PC: { iata: 'PC', name: 'Pegasus Airlines', nameIT: 'Pegasus Airlines' },
  XQ: { iata: 'XQ', name: 'SunExpress', nameIT: 'SunExpress' },
  DY: { iata: 'DY', name: 'Norwegian', nameIT: 'Norwegian' },
};

export function getAirlineFromPrefix(flightNumber: string): AirlineInfo | null {
  const clean = flightNumber.replace(/\s/g, '').toUpperCase();
  return (
    AIRLINE_PREFIXES[clean.slice(0, 3)] ??
    AIRLINE_PREFIXES[clean.slice(0, 2)] ??
    null
  );
}
