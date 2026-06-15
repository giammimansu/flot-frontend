import { describe, it, expect, beforeEach } from 'vitest';
import i18n, { normalizeLang, changeAppLanguage, syncLanguageFromUser } from '../config';

describe('normalizeLang', () => {
  it('keeps supported languages', () => {
    expect(normalizeLang('it')).toBe('it');
    expect(normalizeLang('en')).toBe('en');
  });
  it('maps locale variants by prefix', () => {
    expect(normalizeLang('en-US')).toBe('en');
    expect(normalizeLang('it-IT')).toBe('it');
  });
  it('falls back to "it" for unknown / empty', () => {
    expect(normalizeLang('fr')).toBe('it');
    expect(normalizeLang('de')).toBe('it');
    expect(normalizeLang(null)).toBe('it');
    expect(normalizeLang(undefined)).toBe('it');
    expect(normalizeLang('')).toBe('it');
  });
});

describe('translation', () => {
  beforeEach(async () => {
    await changeAppLanguage('it');
  });

  it('returns language-specific copy', async () => {
    expect(i18n.t('common:save')).toBe('Salva');
    await changeAppLanguage('en');
    expect(i18n.t('common:save')).toBe('Save');
  });

  it('interpolates {{var}} values', () => {
    expect(i18n.t('match:savings', { amount: 7 })).toBe('Risparmia ~€7');
  });

  it('pluralizes _one / _other', () => {
    expect(i18n.t('myTrips:tripCount', { count: 1 })).toBe('1 viaggio');
    expect(i18n.t('myTrips:tripCount', { count: 3 })).toBe('3 viaggi');
  });

  it('keeps <html lang> in sync on change', async () => {
    await changeAppLanguage('en');
    expect(document.documentElement.lang).toBe('en');
    await changeAppLanguage('it');
    expect(document.documentElement.lang).toBe('it');
  });
});

describe('syncLanguageFromUser', () => {
  beforeEach(async () => {
    await changeAppLanguage('it');
  });

  it('aligns UI to the backend user lang', () => {
    syncLanguageFromUser('en');
    expect(i18n.language).toBe('en');
  });
  it('normalizes unsupported backend lang to fallback', () => {
    syncLanguageFromUser('es');
    expect(i18n.language).toBe('it');
  });
  it('is a no-op when user has no lang', () => {
    syncLanguageFromUser(undefined);
    expect(i18n.language).toBe('it');
  });
});
