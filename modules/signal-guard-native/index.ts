import { requireOptionalNativeModule, NativeModule } from 'expo';
export type Dimension = 'internet' | 'cellular';
export type Health = 'healthy' | 'checking' | 'unavailable' | 'unknown' | 'disabled';
export type Phase = 'idle' | 'preflighting' | 'ready' | 'starting' | 'activeHealthy' | 'activeDegraded' | 'activeIncident' | 'stopping' | 'completed' | 'interrupted';
export interface GuardSettings { internet: boolean; cellular: boolean }
export interface GuardConfig extends GuardSettings { end: number }
export interface Incident {
  id: string; start: number; end?: number; dimensions: Dimension[];
  crossedThreshold: boolean; acknowledged: boolean;
}
export interface NotificationStatus { sound: 'enabled' | 'disabled' | 'unknown'; timeSensitive: 'enabled' | 'disabled' | 'unknown'; vibration: 'system'; critical: 'unavailable' }
export interface Session {
  id: string; start: number; scheduledEnd: number; end?: number; lastHeartbeat: number;
  outcome: 'running' | 'completed' | 'stopped' | 'interrupted'; incidents: Incident[]; interruptionReason?: string;
}
export interface GuardState {
  phase: Phase; internet: Health; cellular: Health; monitoring: boolean;
  start?: number; end?: number; lastConfirmed?: number;
  incident?: Incident; error?: string; settings: GuardSettings;
  lastConfirmationRecent?: boolean; simulationActive?: boolean; testTimingActive?: boolean;
}
export type PreflightIssue = 'nativeUnavailable' | 'iosRequired' | 'internetUnavailable' | 'cellularUnavailable' | 'notificationsRequired' | 'timeSensitiveRequired' | 'conditionsRequired' | 'storageUnavailable' | 'taskUnavailable';
export interface PreflightStatus {
  ready: boolean; internet: boolean; cellular: boolean; notifications: boolean;
  timeSensitive: boolean; permissionUndetermined: boolean; issues: PreflightIssue[];
}
export type Simulation = 'internet' | 'cellular' | 'both' | 'recovery' | 'interruption' | 'completion' | 'real';
type Events = { onGuardState: (state: GuardState) => void };
declare class SignalGuardNative extends NativeModule<Events> {
  getPreflightStatus(): Promise<PreflightStatus>;
  getNotificationStatus(): Promise<NotificationStatus>;
  requestNotificationPermission(): Promise<void>;
  startGuard(config: GuardConfig): Promise<GuardState>;
  stopGuard(): Promise<void>;
  getGuardState(): Promise<GuardState>;
  getHistory(): Promise<Session[]>;
  clearHistory(): Promise<void>;
  acknowledgeIncident(): Promise<void>;
  getSettings(): Promise<GuardSettings>;
  updateSettings(settings: GuardSettings): Promise<void>;
  simulate(action: Simulation): Promise<void>;
  setTestTiming(enabled: boolean): Promise<void>;
}
const native = requireOptionalNativeModule<SignalGuardNative>('SignalGuardNative');
const settings: GuardSettings = { internet: true, cellular: true };
const unavailable = (): Promise<never> => Promise.reject(new Error('nativeUnavailable'));
// Web / Expo Go fail closed. There is deliberately no browser monitoring emulation.
export type SignalGuardInterface = Pick<SignalGuardNative, 'getNotificationStatus' | 'getPreflightStatus' | 'getGuardState' | 'getHistory' | 'getSettings' | 'addListener' | 'requestNotificationPermission' | 'startGuard' | 'stopGuard' | 'clearHistory' | 'acknowledgeIncident' | 'updateSettings' | 'simulate' | 'setTestTiming'>;
export const SignalGuard: SignalGuardInterface = native ?? {
  getNotificationStatus: async (): Promise<NotificationStatus> => ({ sound: 'unknown', timeSensitive: 'unknown', vibration: 'system', critical: 'unavailable' }),
  getPreflightStatus: async (): Promise<PreflightStatus> => ({ ready: false, internet: false, cellular: false, notifications: false, timeSensitive: false, permissionUndetermined: false, issues: ['nativeUnavailable'] }),
  getGuardState: async (): Promise<GuardState> => ({ phase: 'idle', internet: 'unknown', cellular: 'unknown', monitoring: false, settings }),
  getHistory: async (): Promise<Session[]> => [],
  getSettings: async () => settings,
  addListener: (_event: string, _listener: (state: GuardState) => void) => ({ remove() {} }),
  requestNotificationPermission: unavailable, startGuard: unavailable, stopGuard: unavailable,
  clearHistory: unavailable, acknowledgeIncident: unavailable, updateSettings: unavailable,
  simulate: unavailable, setTestTiming: unavailable,
};
