import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import tr from './tr.json';
import en from './en.json';

export const resources = {
  tr: { translation: tr },
  en: { translation: en },
} as const;

export const defaultNS = 'translation';
export const fallbackLng = 'tr';

i18n.use(initReactI18next).init({
  resources,
  lng: fallbackLng,
  fallbackLng,
  defaultNS,
  interpolation: {
    escapeValue: false, // React Native güvenlidir
  },
  compatibilityJSON: 'v4',
});

export default i18n;

// Tür güvenli t() için yardımcı (opsiyonel)
export type TranslationKeys = typeof tr;
