import fs from 'node:fs';
import path from 'node:path';
import en from '../src/localization/en.json';
import es from '../src/localization/es.json';
import { errorText, supportedLanguage, informationURLs } from '../src/localization';

const placeholders = (value: string) => value.match(/\{\{[^}]+\}\}|%@/g)?.sort() ?? [];
test('all English UI strings have Spanish translations and matching placeholders', () => {
  expect(Object.keys(es).sort()).toEqual(Object.keys(en).sort());
  for (const key of Object.keys(en) as (keyof typeof en)[]) {
    expect(es[key].trim().length).toBeGreaterThan(0);
    expect(placeholders(es[key])).toEqual(placeholders(en[key]));
  }
});
test('native English and Spanish strings are complete and all native keys are translated', () => {
  const base = path.join(process.cwd(), 'modules/signal-guard-native/ios');
  const read = (language: string): Record<string, string> => Object.fromEntries(Array.from(fs.readFileSync(path.join(base, `Resources/${language}.lproj/Localizable.strings`), 'utf8').matchAll(/"([^"]+)" = "([^"]+)";/g), (match) => [match[1], match[2]]));
  const english = read('en'); const spanish = read('es');
  expect(Object.keys(spanish).sort()).toEqual(Object.keys(english).sort());
  for (const [key, value] of Object.entries(english)) expect(placeholders(spanish[key]!)).toEqual(placeholders(value));
  const source = ['NativeStrings.swift', 'NotificationService.swift', 'GuardCoordinator.swift'].map((name) => fs.readFileSync(path.join(base, name), 'utf8')).join('\n');
  for (const match of source.matchAll(/(?:text|title:)\("?((?:task|watchdog|incident|completion|action)\.[a-z]+)"/g)) expect(english[match[1]!]).toBeDefined();
});
test('no untranslated literal display text in route components', () => {
  const routes = fs.readdirSync(path.join(process.cwd(), 'src/app')).filter((name) => name.endsWith('.tsx'));
  for (const name of routes) {
    const source = fs.readFileSync(path.join(process.cwd(), 'src/app', name), 'utf8');
    expect(source).not.toMatch(/<(?:Text|Body|Heading)[^>]*>\s*[A-Za-z][^<{]*<\//);
  }
});

test('language follows the first supported iOS preference and falls back to English', () => {
  expect(supportedLanguage(['ca', 'es', 'en'])).toBe('es');
  expect(supportedLanguage(['en', 'es'])).toBe('en');
  expect(supportedLanguage(['de', null])).toBe('en');
});


test('native task and completion notification errors retain their specific explanation', () => {
  expect(errorText(new Error('completionNotificationFailed'))).toBe(en.completionNotificationFailed);
  expect(errorText(new Error('taskUnavailable'))).toBe(en.taskUnavailable);
});

test('information links select the published privacy and support language', () => {
  expect(informationURLs('es')).toEqual({ privacy: 'https://web.mcorchero.com/apps/signalguard/privacidad/', support: 'https://web.mcorchero.com/apps/signalguard/soporte/' });
  expect(informationURLs('en')).toEqual({ privacy: 'https://web.mcorchero.com/apps/signalguard/privacy/', support: 'https://web.mcorchero.com/apps/signalguard/support/' });
});
