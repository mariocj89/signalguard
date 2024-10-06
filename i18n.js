import '@formatjs/intl-pluralrules/polyfill';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import en from './locales/en/translation.json';
import es from './locales/es/translation.json';

const languageTag = Localization.locale;

i18n.use(initReactI18next).init({
  lng: languageTag,
  fallbackLng: 'en',
  resources: {
    en: { translation: en },
    es: { translation: es },
  },
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;