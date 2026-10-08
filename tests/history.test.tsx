import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import History from '../src/app/history';
import { SignalGuard, type Session } from '../modules/signal-guard-native';
import { t, dateLabel } from '../src/localization';

jest.mock('expo-router', () => ({
  useFocusEffect: (callback: () => void) => { const React = require('react'); React.useEffect(callback, [callback]); },
}));
jest.mock('react-native-safe-area-context', () => ({ SafeAreaView: require('react-native').View }));
jest.mock('../modules/signal-guard-native', () => ({ SignalGuard: { getHistory: jest.fn(), clearHistory: jest.fn() } }));
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
  await waitFor(() => expect(screen.getByText(t('interrupted'))).toBeTruthy());
  expect(screen.getByText(t('taskExpired'))).toBeTruthy();
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
