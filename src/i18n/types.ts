/* ============================================================
   FLOT — i18next type augmentation
   it.json is the source of truth for key type-safety.
   ============================================================ */

import 'i18next';
import type it from './locales/it.json';

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'common';
    resources: typeof it;
  }
}
