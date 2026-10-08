import { endForClock, endForDuration, validEnd } from '../src/domain/scheduling';
import { validSettings } from '../src/domain/settings';
import { healthTone, isActive, incidentDuration } from '../src/domain/presentation';
import type { GuardState } from '../modules/signal-guard-native';

describe('Guard scheduling', () => {
  const now = new Date(2026, 9, 5, 23, 30, 0);
  test('an earlier clock time ends the next day', () => {
    const end = endForClock(now, 8, 0);
    expect(end.getDate()).toBe(6);
    expect(end.getHours()).toBe(8);
    expect(end.getTime() - now.getTime()).toBe(8.5 * 3600000);
  });
  test('a later clock time ends today', () => {
    expect(endForClock(now, 23, 45).getDate()).toBe(5);
  });
  test('same clock time means tomorrow', () => {
    expect(endForClock(now, 23, 30).getTime() - now.getTime()).toBe(86400000);
  });
  test('default eight hours crosses midnight', () => {
    expect(endForDuration(now, 8).getHours()).toBe(7);
    expect(endForDuration(now, 8).getDate()).toBe(6);
  });
  test('24 hours is the hard maximum', () => {
    expect(validEnd(now.getTime(), now.getTime() + 86400000)).toBe(true);
    expect(validEnd(now.getTime(), now.getTime() + 86400001)).toBe(false);
    expect(validEnd(now.getTime(), Number.NaN)).toBe(false);
    expect(validEnd(now.getTime(), now.getTime())).toBe(false);
    expect(() => endForDuration(now, 25)).toThrow('invalidEnd');
    expect(() => endForClock(now, 24, 0)).toThrow('invalidEnd');
  });
  test('DST cannot create a guard over 24 actual hours', () => {
    const fallBack = new Date(2026, 9, 25, 0, 30);
    const end = endForClock(fallBack, 22, 0);
    expect(validEnd(fallBack.getTime(), end.getTime())).toBe(true);
    expect(() => endForClock(fallBack, 0, 30)).toThrow('invalidEnd');
    expect(() => endForClock(fallBack, 0, 0)).toThrow('invalidEnd');
  });
});
describe('Safety presentation and settings', () => {
  test('at least one condition is required', () => {
    expect(validSettings({ internet: true, cellular: true })).toBe(true);
    expect(validSettings({ internet: true, cellular: false })).toBe(true);
    expect(validSettings({ internet: false, cellular: true })).toBe(true);
    expect(validSettings({ internet: false, cellular: false })).toBe(false);
  });
  test('persisted phase alone cannot imply monitoring', () => {
    const state: GuardState = { phase: 'activeHealthy', monitoring: false, internet: 'healthy', cellular: 'healthy', settings: { internet: true, cellular: true } };
    expect(isActive(state)).toBe(false);
    expect(isActive({ ...state, monitoring: true })).toBe(true);
    expect(isActive({ ...state, phase: 'starting', monitoring: true })).toBe(false);
    expect(isActive({ ...state, phase: 'interrupted', monitoring: true })).toBe(false);
  });
  test('grace periods use amber and unverified states use neutral', () => {
    expect(healthTone('checking')).toBe('amber');
    expect(healthTone('unknown')).toBe('neutral');
    expect(healthTone('unavailable')).toBe('red');
  });
  test('duration has sensible readable bounds', () => {
    expect(incidentDuration(0, 102000)).toBe('1m 42s');
    expect(incidentDuration(0, 28800000)).toBe('8h 00m');
    expect(incidentDuration(1000, 0)).toBe('0m 0s');
  });
});


test('resumed history groups linked segments and displays events without a gap duration', () => {
  const { historyEntries } = require('../src/domain/history');
  const first = { id: 'a', start: 0, scheduledEnd: 3600000, lastHeartbeat: 600000, end: 600000, outcome: 'interrupted', incidents: [] };
  const next = { ...first, id: 'b', start: 900000, end: 3600000, lastHeartbeat: 3600000, outcome: 'completed', resumedFrom: 'a' };
  const entries = historyEntries([next, first]);
  expect(entries).toHaveLength(1);
  expect(entries[0].session.outcome).toBe('completed');
  expect(entries[0].monitoredDuration).toBe(3300000);
  expect(entries[0].events).toEqual([{ kind: 'interrupted', at: 600000 }, { kind: 'resumed', at: 900000 }]);
  expect(entries[0]).not.toHaveProperty('gapDuration');
});


test('a resumed segment still shows its resume event after older history was cleared', () => {
  const { historyEntries } = require('../src/domain/history');
  const entries = historyEntries([{ id: 'new', resumedFrom: 'deleted', start: 1000, end: 2000, lastHeartbeat: 2000, scheduledEnd: 2000, outcome: 'completed', incidents: [] }]);
  expect(entries[0].events).toEqual([{ kind: 'resumed', at: 1000 }]);
});
