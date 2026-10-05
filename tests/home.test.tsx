import React from 'react';
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
  expect(screen.queryByText(/GUARD ACTIVE/)).toBeNull();
  await act(async () => { reject(new Error('startFailed')); });
  await waitFor(() => expect(screen.getByText(/iOS could not start monitoring immediately/)).toBeTruthy());
  expect(screen.queryByText(/GUARD ACTIVE/)).toBeNull();
});
test('native confirmation activates the guard and acknowledgement does not hide a red incident', async () => {
  const active: GuardState = { ...idle, phase: 'activeIncident', monitoring: true, internet: 'unavailable', cellular: 'healthy', end: Date.now() + 28800000, lastConfirmed: Date.now(), incident: { id: 'a', start: Date.now() - 65000, dimensions: ['internet'], crossedThreshold: true, acknowledged: false } };
  const screen = await render(<GuardProvider><Home /></GuardProvider>);
  await waitFor(() => expect(bridge.addListener).toHaveBeenCalled());
  await act(() => listener(active));
  expect(screen.getByText('GUARD ACTIVE')).toBeTruthy();
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
  expect(screen.queryByText(/GUARD ACTIVE/)).toBeNull();
});
