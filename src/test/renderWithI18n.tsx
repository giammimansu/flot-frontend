import type { ReactElement } from 'react';
import { render, type RenderOptions } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import i18n, { type AppLang } from '../i18n/config';

/**
 * Render a component wrapped in the i18n provider, optionally forcing a
 * starting language. Returns the RTL result plus the live i18n instance.
 */
export function renderWithI18n(
  ui: ReactElement,
  { lang, ...options }: { lang?: AppLang } & Omit<RenderOptions, 'wrapper'> = {},
) {
  if (lang && i18n.language !== lang) {
    void i18n.changeLanguage(lang);
  }
  const result = render(
    <I18nextProvider i18n={i18n}>{ui}</I18nextProvider>,
    options,
  );
  return { ...result, i18n };
}
