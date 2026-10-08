import { createInstance } from 'i18next';
import { getLocales, getCalendars } from 'expo-localization';
import en from './en.json';
import es from './es.json';
export function supportedLanguage(codes: (string | null)[]): 'en' | 'es' {
  return codes.find((code): code is 'en' | 'es' => code === 'en' || code === 'es') ?? 'en';
}
const locales = getLocales();
const language = supportedLanguage(locales.map((locale) => locale.languageCode));
const localeTag = locales.find((locale) => locale.languageCode === language)?.languageTag ?? language;
const i18next = createInstance();
export type StringKey = keyof typeof en;
void i18next.init({
  lng: language,
  fallbackLng: 'en', resources: { en: { translation: en }, es: { translation: es } },
  interpolation: { escapeValue: false }, initAsync: false,
});
export function t(key: StringKey, values?: Record<string, string | number>): string { return i18next.t(key, values); }
export function clock(date: number | Date): string {
  return new Intl.DateTimeFormat(localeTag, { hour: '2-digit', minute: '2-digit', hour12: getCalendars()[0]?.uses24hourClock === false }).format(date);
}
export function dateLabel(date: number): string {
  const now = new Date(); const value = new Date(date);
  if (value.toDateString() === now.toDateString()) return t('today');
  now.setDate(now.getDate() - 1);
  if (value.toDateString() === now.toDateString()) return t('yesterday');
  return new Intl.DateTimeFormat(localeTag, { dateStyle: 'medium' }).format(value);
}
export function errorText(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  const codes: StringKey[] = ['nativeUnavailable', 'iosRequired', 'clockChanged', 'invalidEnd', 'alreadyActive', 'foregroundRequired', 'conditionsRequired', 'settingsLocked', 'settingsChanged', 'cellularUnavailable', 'notificationsChanged', 'notificationSchedulingFailed', 'monitorInterrupted', 'taskExpired', 'heartbeatMissed', 'processStopped', 'storageUnavailable', 'preflightFailed', 'startFailed', 'guardRequired', 'invalidSimulation'];
  return t(codes.find((code) => message.includes(code)) ?? 'genericFailure');
}
