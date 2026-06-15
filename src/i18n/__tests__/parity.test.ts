import { describe, it, expect } from 'vitest';
import itLocale from '../locales/it.json';
import enLocale from '../locales/en.json';

/** Recursively collect dotted key paths from a nested object. */
function keyPaths(obj: Record<string, unknown>, prefix = ''): string[] {
  return Object.entries(obj).flatMap(([k, v]) => {
    const path = prefix ? `${prefix}.${k}` : k;
    return v && typeof v === 'object' && !Array.isArray(v)
      ? keyPaths(v as Record<string, unknown>, path)
      : [path];
  });
}

describe('locale key parity', () => {
  const itKeys = keyPaths(itLocale).sort();
  const enKeys = keyPaths(enLocale).sort();

  it('it.json and en.json have identical keys', () => {
    const onlyIt = itKeys.filter((k) => !enKeys.includes(k));
    const onlyEn = enKeys.filter((k) => !itKeys.includes(k));
    expect({ onlyIt, onlyEn }).toEqual({ onlyIt: [], onlyEn: [] });
  });

  it('has no empty string values', () => {
    const empties = [...itKeys, ...enKeys].filter((path) => {
      const src = itKeys.includes(path) ? itLocale : enLocale;
      const val = path.split('.').reduce<unknown>((o, p) => (o as Record<string, unknown>)?.[p], src);
      return val === '';
    });
    expect(empties).toEqual([]);
  });
});
