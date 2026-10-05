/** @jest-environment node */
import fs from 'node:fs';
// Exercise config mods through their registered callbacks, avoiding generated native files.
const plugin = require('../modules/signal-guard-native/plugin');
test('CNG configuration uses only processing and Time Sensitive entitlement', async () => {
  const config = plugin({ name: 'SignalGuard', slug: 'signalguard', ios: {} });
  const plist = await config.mods.ios.infoPlist({ modResults: {}, modRequest: {}, ios: {} });
  const entitlements = await config.mods.ios.entitlements({ modResults: {}, modRequest: {}, ios: {} });
  expect(plist.modResults.UIBackgroundModes).toEqual(['processing']);
  expect(plist.modResults.BGTaskSchedulerPermittedIdentifiers).toEqual(['com.etcaterva.signalguard.guard.*']);
  expect(entitlements.modResults).toEqual({ 'com.apple.developer.usernotifications.time-sensitive': true });
});
test('task register/submit identifiers match permitted wildcard', () => {
  const swift = fs.readFileSync('modules/signal-guard-native/ios/GuardCoordinator.swift', 'utf8');
  expect(swift).toContain('com.etcaterva.signalguard.guard.session');
  expect(swift).toContain('request.strategy = .fail');
  expect(swift).not.toContain('requiresNetworkConnectivity = true');
});
test('production config is iPhone only, iOS 26, and has no remote service configuration', () => {
  const { expo } = JSON.parse(fs.readFileSync('app.json', 'utf8'));
  expect(expo.ios.bundleIdentifier).toBe('com.etcaterva.signalguard');
  expect(expo.platforms).toEqual(['ios']);
  expect(expo.ios.supportsTablet).toBe(false);
  expect(expo.plugins).toContainEqual(['expo-build-properties', { ios: { deploymentTarget: '26.0' } }]);
  expect(expo.updates).toBeUndefined();
  expect(Object.keys(expo.extra ?? {}).every((key) => ['eas', 'router'].includes(key))).toBe(true);
});

test('EAS includes every native module source/resource while excluding generated root projects', () => {
  const ignore = require('ignore');
  const rules = ignore().add(fs.readFileSync('.easignore', 'utf8'));
  for (const file of ['modules/signal-guard-native/ios/GuardCoordinator.swift', 'modules/signal-guard-native/ios/Core/GuardCore.swift', 'modules/signal-guard-native/ios/SignalGuardNative.podspec', 'modules/signal-guard-native/ios/Resources/es.lproj/Localizable.strings', 'modules/signal-guard-native/expo-module.config.json', 'modules/signal-guard-native/plugin.js']) {
    expect(rules.ignores(file)).toBe(false);
  }
  expect(rules.ignores('ios/SignalGuard/Info.plist')).toBe(true);
  expect(rules.ignores('.tools/swift.tar.gz')).toBe(true);
});
