import React from 'react';
import { Alert } from 'react-native';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import Home from '../src/app/index';
import { GuardProvider } from '../src/state/GuardProvider';
import { SignalGuard, type GuardState } from '../modules/signal-guard-native';

jest.mock('expo-router', () => ({
  useFocusEffect: (callback: () => void) => { const React = require('react'); React.useEffect(callback, [callback]); },
}));
jest.mock('react-native-safe-area-context', () => ({ SafeAreaView: require('react-native').View }));
jest.mock('@react-native-community/datetimepicker', () => () => null);
jest.mock('../modules/signal-guard-native', () => ({
  SignalGuard: {
    getGuardState: jest.fn(), getPreflightStatus: jest.fn(), startGuard: jest.fn(), stopGuard: jest.fn(),
    requestNotificationPermission: jest.fn(), acknowledgeIncident: jest.fn(), addListener: jest.fn(),
  },
}));
const bridge = SignalGuard as jest.Mocked<typeof SignalGuard>;
const idle: GuardState = { phase: 'idle', internet: 'unknown', cellular: 'unknown', monitoring: false, settings: { internet: true, cellular: true } };
let listener: (state: GuardState) => void;
beforeEach(() => {
  bridge.getGuardState.mockResolvedValue(idle);
  bridge.acknowledgeIncident.mockResolvedValue(undefined);
  bridge.startGuard.mockResolvedValue(idle);
  bridge.stopGuard.mockResolvedValue(undefined);
  bridge.getPreflightStatus.mockResolvedValue({ ready: true, internet: true, cellular: true, notifications: true, timeSensitive: true, permissionUndetermined: false, issues: [] });
  bridge.addListener.mockImplementation((_event, callback) => { listener = callback; return { remove: jest.fn() }; });
});
test('automatically checks setup and blocks start when Time Sensitive delivery is disabled', async () => {
  bridge.getPreflightStatus.mockResolvedValue({ ready: false, internet: true, cellular: true, notifications: true, timeSensitive: false, permissionUndetermined: false, issues: ['timeSensitiveRequired'] });
  const screen = await render(<GuardProvider><Home /></GuardProvider>);
  await waitFor(() => expect(screen.getByText(/Enable Time Sensitive/)).toBeTruthy());
  expect(screen.getByRole('button', { name: 'START GUARD' }).props.accessibilityState.disabled).toBe(true);
  expect(bridge.getPreflightStatus).toHaveBeenCalled();
});
test('does not show guard active while native start is pending; shows a visible failure', async () => {
  let reject!: (error: Error) => void;
  bridge.startGuard.mockImplementation(() => new Promise((_resolve, failure) => { reject = failure; }));
  const screen = await render(<GuardProvider><Home /></GuardProvider>);
  await waitFor(() => expect(screen.getByRole('button', { name: 'START GUARD' }).props.accessibilityState.disabled).toBe(false));
  await fireEvent.press(screen.getByRole('button', { name: 'START GUARD' }));
  expect(screen.queryByText(/Monitoring active/)).toBeNull();
  await act(async () => { reject(new Error('startFailed')); });
  await waitFor(() => expect(screen.getByText(/iOS could not start monitoring immediately/)).toBeTruthy());
  expect(screen.queryByText(/Monitoring active/)).toBeNull();
});
test('native confirmation activates the guard and acknowledgement does not hide a red incident', async () => {
  const active: GuardState = { ...idle, phase: 'activeIncident', monitoring: true, internet: 'unavailable', cellular: 'healthy', end: Date.now() + 28800000, lastConfirmed: Date.now(), incident: { id: 'a', start: Date.now() - 65000, dimensions: ['internet'], crossedThreshold: true, acknowledged: false } };
  const screen = await render(<GuardProvider><Home /></GuardProvider>);
  await waitFor(() => expect(bridge.addListener).toHaveBeenCalled());
  await act(() => listener(active));
  expect(screen.getByText('Monitoring active')).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: 'Acknowledge' }));
  expect(bridge.acknowledgeIncident).toHaveBeenCalled();
  await act(() => listener({ ...active, incident: { ...active.incident!, acknowledged: true } }));
  expect(screen.getByText('Acknowledged · waiting for recovery')).toBeTruthy();
  expect(screen.getByText('Connectivity could not be confirmed')).toBeTruthy();
  expect(screen.queryByRole('button', { name: 'Acknowledge' })).toBeNull();
});

test('automatic guard completion clears old readiness and rechecks prerequisites', async () => {
  const screen = await render(<GuardProvider><Home /></GuardProvider>);
  await waitFor(() => expect(screen.getByRole('button', { name: 'START GUARD' }).props.accessibilityState.disabled).toBe(false));
  const active: GuardState = { ...idle, phase: 'activeHealthy', monitoring: true, internet: 'healthy', cellular: 'healthy', end: Date.now() + 1000, lastConfirmed: Date.now() };
  await act(() => listener(active));
  const completed: GuardState = { ...idle, phase: 'completed' };
  bridge.getGuardState.mockResolvedValue(completed);
  bridge.getPreflightStatus.mockResolvedValue({ ready: false, internet: false, cellular: true, notifications: true, timeSensitive: true, permissionUndetermined: false, issues: ['internetUnavailable'] });
  await act(() => listener(completed));
  await waitFor(() => expect(screen.getByText('Internet connectivity could not be confirmed.')).toBeTruthy());
  expect(screen.getByRole('button', { name: 'START GUARD' }).props.accessibilityState.disabled).toBe(true);
});

test('interrupted monitoring stays unavailable even when restart prerequisites pass', async () => {
  bridge.getGuardState.mockResolvedValue({ ...idle, phase: 'interrupted' });
  const screen = await render(<GuardProvider><Home /></GuardProvider>);
  await waitFor(() => expect(screen.getByRole('button', { name: 'RESTART GUARD' }).props.accessibilityState.disabled).toBe(false));
  expect(screen.getByText('Guard interrupted')).toBeTruthy();
  expect(screen.getByLabelText('Monitoring: Unavailable')).toBeTruthy();
  expect(screen.queryByText(/Monitoring active/)).toBeNull();
});


test('the power button starts a bounded 24-hour guard without requiring time selection', async () => {
  const screen = await render(<GuardProvider><Home /></GuardProvider>);
  await waitFor(() => expect(screen.getByRole('button', { name: 'START GUARD' }).props.accessibilityState.disabled).toBe(false));
  expect(screen.getByText('24-hour limit')).toBeTruthy();
  expect(screen.queryByRole('button', { name: 'Add 8 hours' })).toBeNull();
  const before = Date.now();
  await fireEvent.press(screen.getByRole('button', { name: 'START GUARD' }));
  const end = bridge.startGuard.mock.calls[0]![0].end;
  expect(end - before).toBeGreaterThanOrEqual(24 * 3600000);
  expect(end).toBeLessThanOrEqual(Date.now() + 24 * 3600000);
  expect(screen.queryByText('Monitoring active')).toBeNull();
});

test('optional end-time controls still start the selected shorter guard', async () => {
  const screen = await render(<GuardProvider><Home /></GuardProvider>);
  await waitFor(() => expect(screen.getByRole('button', { name: 'START GUARD' }).props.accessibilityState.disabled).toBe(false));
  await fireEvent.press(screen.getByRole('button', { name: 'Choose end time' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Add 4 hours' }));
  const before = Date.now();
  await fireEvent.press(screen.getByRole('button', { name: 'START GUARD' }));
  expect(bridge.startGuard.mock.calls[0]![0].end - before).toBeGreaterThanOrEqual(4 * 3600000);
  expect(bridge.startGuard.mock.calls[0]![0].end).toBeLessThanOrEqual(Date.now() + 4 * 3600000);
});

test('the same power button asks for confirmation before stopping an actual native guard', async () => {
  const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  try {
    const screen = await render(<GuardProvider><Home /></GuardProvider>);
    await waitFor(() => expect(bridge.addListener).toHaveBeenCalled());
    await act(() => listener({ ...idle, phase: 'activeHealthy', monitoring: true, internet: 'healthy', cellular: 'healthy', end: Date.now() + 10000 }));
    expect(screen.getByText('ON')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'STOP GUARD' }));
    expect(bridge.stopGuard).not.toHaveBeenCalled();
    expect(screen.getByText('ON')).toBeTruthy();
    const confirm = alert.mock.calls[0]![2]!.find(button => button.style === 'destructive');
    await act(() => confirm!.onPress!());
    await waitFor(() => expect(bridge.stopGuard).toHaveBeenCalledTimes(1));
  } finally { alert.mockRestore(); }
});


test('an unavailable native module shows unconfirmed connections rather than claiming a physical outage', async () => {
  bridge.getPreflightStatus.mockResolvedValue({ ready: false, internet: false, cellular: false, notifications: false, timeSensitive: false, permissionUndetermined: false, issues: ['nativeUnavailable'] });
  const screen = await render(<GuardProvider><Home /></GuardProvider>);
  await waitFor(() => expect(screen.getByLabelText('Internet: Not confirmed')).toBeTruthy());
  expect(screen.getByLabelText('Cellular network: Not confirmed')).toBeTruthy();
  expect(screen.getByRole('button', { name: 'START GUARD' }).props.accessibilityState.disabled).toBe(true);
  expect(screen.getByText('OFF')).toBeTruthy();
});
