/* ============================================================
   FLOT — Utility: Build Destinations from Airport Zones
   ============================================================ */

import type { Airport } from '../types/api';
import type { Destination } from '../types/domain';

/**
 * Build a flat list of selectable destinations from an airport's zones.
 * Each landmark becomes a destination entry.
 */
export function buildDestinations(airport: Airport): Destination[] {
  const destinations: Destination[] = [];

  for (const zone of airport.zones) {
    for (const landmark of zone.landmarks) {
      destinations.push({
        name: landmark,
        sub: `${zone.label} · ${airport.city}`,
        zone: zone.label,
        zoneCode: zone.code,
      });
    }
  }

  return destinations;
}

/**
 * Find the zone code for a given destination name.
 */
export function findZoneForDestination(
  airport: Airport,
  destName: string,
): string | undefined {
  for (const zone of airport.zones) {
    if (zone.landmarks.includes(destName)) {
      return zone.code;
    }
  }
  return undefined;
}
