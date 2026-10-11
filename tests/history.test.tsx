import React from 'react';
import { render, waitFor, fireEvent } from '@testing-library/react-native';
import History from '../src/app/history';
import { SignalGuard, type Session } from '../modules/signal-guard-native';
import { t, dateLabel, clock } from '../src/localization';

jest.mock('expo-router', () => ({
  router: { push: jest.fn() },
  useFocusEffect: (callback: () => void) => { const React = require('react'); React.useEffect(callback, [callback]); },
}));
jest.mock('react-native-safe-area-context', () => ({ SafeAreaView: require('react-native').View }));
jest.mock('../modules/signal-guard-native', () => ({ SignalGuard: { getHistory: jest.fn(), clearHistory: jest.fn() } }));
jest.mock('expo-clipboard', () => ({ setStringAsync: jest.fn().mockResolvedValue(true) }));
const bridge = SignalGuard as jest.Mocked<typeof SignalGuard>;
const start = new Date(2026, 9, 7, 23, 0).getTime();
const completed: Session = { id: 'completed', start, scheduledEnd: start + 8 * 3600000, end: start + 8 * 3600000, lastHeartbeat: start + 8 * 3600000, outcome: 'completed', incidents: [] };

test('history sorts newest first and distinguishes brief outages from acknowledged alerts', async () => {
  const interrupted: Session = { ...completed, id: 'interrupted', start: start + 24 * 3600000, end: start + 28 * 3600000, lastHeartbeat: start + 28 * 3600000, outcome: 'interrupted', interruptionReason: 'taskExpired', incidents: [
    { id: 'brief', start, end: start + 23000, dimensions: ['internet'], crossedThreshold: false, acknowledged: false },
    { id: 'alert', start: start + 60000, end: start + 162000, dimensions: ['internet', 'cellular'], crossedThreshold: true, acknowledged: true },
  ] };
  bridge.getHistory.mockResolvedValue([completed, interrupted]);
  const screen = await render(<History />);
  await waitFor(() => expect(screen.getAllByText(t('interrupted'))).toBeTruthy());
  await fireEvent.press(screen.getByRole('button', { name: t('interruptionOpen', { time: clock(interrupted.end!) }) }));
  expect(screen.getByText(t('interruptionSystemDetail'))).toBeTruthy();
  expect(screen.getByText(t('brief'))).toBeTruthy();
  expect(screen.getByText(t('alerted'))).toBeTruthy();
  expect(screen.getByText(t('wasAcknowledged'))).toBeTruthy();
  expect(screen.getByText(t('noIncidents'))).toBeTruthy();
  expect(screen.getByText('0m 23s')).toBeTruthy();
  expect(screen.getAllByRole('header').map(node => node.props.children)).toEqual([t('history'), dateLabel(interrupted.start), dateLabel(completed.start)]);
});

test('history read failure never claims there is no history', async () => {
  bridge.getHistory.mockRejectedValue(new Error('storageUnavailable'));
  const screen = await render(<History />);
  await waitFor(() => expect(screen.getByText(t('storageUnavailable'))).toBeTruthy());
  expect(screen.queryByText(t('noHistory'))).toBeNull();
});


test('each interruption retains its own reason after resuming and details copy only that segment', async () => {
  const Clipboard = require('expo-clipboard');
  const first: Session = { ...completed, id: 'first', start, end: start + 600000, lastHeartbeat: start + 590000, outcome: 'interrupted', interruptionReason: 'taskExpired' };
  const second: Session = { ...first, id: 'second', resumedFrom: 'first', start: start + 900000, end: start + 960000, lastHeartbeat: start + 950000, interruptionReason: 'processStopped' };
  const last: Session = { ...second, id: 'last', resumedFrom: 'second', start: start + 1200000, end: start + 1500000, outcome: 'stopped', interruptionReason: undefined };
  bridge.getHistory.mockResolvedValue([last, second, first]);
  const screen = await render(<History />);
  await waitFor(() => expect(screen.getByRole('button', { name: t('interruptionOpen', { time: clock(first.end!) }) })).toBeTruthy());
  expect(screen.queryByText(t('interruptionSystemDetail'))).toBeNull();
  await fireEvent.press(screen.getByRole('button', { name: t('interruptionOpen', { time: clock(first.end!) }) }));
  expect(screen.getByText(t('interruptionSystemDetail'))).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: t('copyInterruptionDetails') }));
  await waitFor(() => expect(screen.getByText(t('interruptionCopied'))).toBeTruthy());
  const report = Clipboard.setStringAsync.mock.calls.at(-1)[0];
  expect(report).toContain('taskExpired');
  expect(report).toContain(new Date(first.start).toISOString());
  expect(report).toContain(new Date(first.lastHeartbeat).toISOString());
  expect(report).not.toContain('processStopped');
  await fireEvent.press(screen.getByRole('button', { name: t('interruptionOpen', { time: clock(first.end!) }) }));
  await fireEvent.press(screen.getByRole('button', { name: t('interruptionOpen', { time: clock(second.end!) }) }));
  expect(screen.getByText(t('interruptionProcessDetail'))).toBeTruthy();
  Clipboard.setStringAsync.mockResolvedValueOnce(false);
  await fireEvent.press(screen.getByRole('button', { name: t('copyInterruptionDetails') }));
  await waitFor(() => expect(screen.getByText(t('interruptionCopyFailed'))).toBeTruthy());
  expect(screen.queryByText(t('interruptionCopied'))).toBeNull();
});

test('old interruptions without a reason remain inspectable and copying failures are handled', async () => {
  const Clipboard = require('expo-clipboard');
  const interrupted: Session = { ...completed, outcome: 'interrupted', interruptionReason: undefined };
  bridge.getHistory.mockResolvedValue([interrupted]);
  const screen = await render(<History />);
  await waitFor(() => expect(screen.getByRole('button', { name: t('interruptionOpen', { time: clock(interrupted.end!) }) })).toBeTruthy());
  await fireEvent.press(screen.getByRole('button', { name: t('interruptionOpen', { time: clock(interrupted.end!) }) }));
  expect(screen.getByText(t('interruptionUnknownDetail'))).toBeTruthy();
  Clipboard.setStringAsync.mockRejectedValueOnce(new Error('clipboard unavailable'));
  await fireEvent.press(screen.getByRole('button', { name: t('copyInterruptionDetails') }));
  await waitFor(() => expect(screen.getByText(t('interruptionCopyFailed'))).toBeTruthy());
});
