import type { GuardSettings, GuardState, Session, SignalGuardInterface } from './index';

// Memory-only UI fixtures. Never imported by the production branch or native builds.
export function createDevelopmentPreview(now = Date.now()): SignalGuardInterface {
  let settings: GuardSettings = { internet: true, cellular: true };
  const midnight = new Date(now); midnight.setHours(0, 0, 0, 0);
  const day = midnight.getTime();
  const hour = 3600000;
  const previousDay = (days: number) => { const value = new Date(day); value.setDate(value.getDate() - days); return value.getTime(); };
  const completedStart = day - 10 * hour;
  let history: Session[] = [
    { id: 'preview-recent', start: now - 2 * hour, scheduledEnd: now - hour / 3, end: now - hour / 3, lastHeartbeat: now - hour / 3, outcome: 'stopped', incidents: [] },
    { id: 'preview-completed', start: completedStart, scheduledEnd: day - 2 * hour, end: day - 2 * hour, lastHeartbeat: day - 2 * hour, outcome: 'completed', incidents: [
      { id: 'preview-brief', start: completedStart + hour, end: completedStart + hour + 23000, dimensions: ['cellular'], crossedThreshold: false, acknowledged: false },
      { id: 'preview-internet', start: completedStart + 3 * hour, end: completedStart + 3 * hour + 102000, dimensions: ['internet'], crossedThreshold: true, acknowledged: true },
      { id: 'preview-combined', start: completedStart + 5 * hour, end: completedStart + 5 * hour + 191000, dimensions: ['internet', 'cellular'], crossedThreshold: true, acknowledged: false },
    ] },
    { id: 'preview-interrupted', start: previousDay(1) - 8 * hour, scheduledEnd: previousDay(1), end: previousDay(1) - 4 * hour, lastHeartbeat: previousDay(1) - 4 * hour, outcome: 'interrupted', interruptionReason: 'taskExpired', incidents: [] },
    { id: 'preview-healthy', start: previousDay(2) - 8 * hour, scheduledEnd: previousDay(2), end: previousDay(2), lastHeartbeat: previousDay(2), outcome: 'completed', incidents: [] },
  ];
  const listeners = new Set<(state: GuardState) => void>();
  const state = (): GuardState => ({ phase: 'idle', internet: 'unknown', cellular: 'unknown', monitoring: false, settings: { ...settings } });
  const unavailable = (): Promise<never> => Promise.reject(new Error('nativeUnavailable'));
  return {
    getGuardState: async () => state(),
    getPreflightStatus: async () => ({ ready: false, internet: false, cellular: false, notifications: false, timeSensitive: false, permissionUndetermined: false, issues: ['nativeUnavailable'] }),
    getSettings: async () => ({ ...settings }),
    updateSettings: async next => {
      if (typeof next.internet !== 'boolean' || typeof next.cellular !== 'boolean' || !(next.internet || next.cellular)) throw new Error('conditionsRequired');
      settings = { ...next };
      listeners.forEach(listener => listener(state()));
    },
    addListener: (_event, listener) => { listeners.add(listener); return { remove: () => { listeners.delete(listener); } }; },
    getHistory: async () => JSON.parse(JSON.stringify(history)) as Session[],
    clearHistory: async () => { history = []; },
    requestNotificationPermission: unavailable, startGuard: unavailable, stopGuard: unavailable,
    acknowledgeIncident: unavailable, simulate: unavailable, setTestTiming: unavailable,
  };
}
