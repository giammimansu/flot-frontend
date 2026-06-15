/* ============================================================
   FLOT — i18n configuration (it / en)
   ============================================================ */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import it from './locales/it.json';
import en from './locales/en.json';

export const SUPPORTED_LANGS = ['it', 'en'] as const;
export type AppLang = (typeof SUPPORTED_LANGS)[number];

export const FALLBACK_LANG: AppLang = 'it';
const STORAGE_KEY = 'flot_lang';

/** Map any value to a supported language; unknown → fallback ("it"). */
export function normalizeLang(value: string | null | undefined): AppLang {
  const v = value?.slice(0, 2).toLowerCase();
  return v === 'en' ? 'en' : v === 'it' ? 'it' : FALLBACK_LANG;
}

function isSupported(value: string | null | undefined): value is AppLang {
  return value === 'it' || value === 'en';
}

/**
 * Initial language for a NOT-logged-in user.
 * Order: localStorage ("flot_lang") → navigator language → fallback.
 * For logged-in users the backend `user.lang` wins and is applied at bootstrap
 * (see syncLanguageFromUser).
 */
function detectInitialLang(): AppLang {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (isSupported(stored)) return stored;
  } catch {
    /* localStorage unavailable (SSR / privacy mode) */
  }
  if (typeof navigator !== 'undefined') {
    return normalizeLang(navigator.language);
  }
  return FALLBACK_LANG;
}

const resources = { it, en } as const;

void i18n.use(initReactI18next).init({
  resources,
  lng: detectInitialLang(),
  fallbackLng: FALLBACK_LANG,
  supportedLngs: [...SUPPORTED_LANGS],
  defaultNS: 'common',
  interpolation: {
    escapeValue: false, // React already escapes
  },
});

/** Persist the chosen language and keep <html lang> in sync. */
function persist(lng: string): void {
  const lang = normalizeLang(lng);
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    /* ignore */
  }
  if (typeof document !== 'undefined') {
    document.documentElement.lang = lang;
  }
}

i18n.on('languageChanged', persist);
persist(i18n.language);

/** Imperatively switch the UI language. */
export function changeAppLanguage(lang: AppLang): Promise<unknown> {
  return i18n.changeLanguage(lang) as Promise<unknown>;
}

/**
 * Align the UI language with the logged-in user's `lang` (backend is the source
 * of truth post-login). No-op when already aligned or when user has no lang.
 */
export function syncLanguageFromUser(userLang: string | null | undefined): void {
  if (!userLang) return;
  const target = normalizeLang(userLang);
  if (i18n.language !== target) {
    void i18n.changeLanguage(target);
  }
}

export default i18n;
