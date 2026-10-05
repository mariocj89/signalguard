import type { GuardState, Health } from '../../modules/signal-guard-native';
export function isActive(state: GuardState): boolean {
  return state.monitoring && ['activeHealthy', 'activeDegraded', 'activeIncident'].includes(state.phase);
}
export function healthTone(health: Health): 'green' | 'amber' | 'red' | 'neutral' {
  return health === 'healthy' ? 'green' : health === 'checking' ? 'amber' : health === 'unavailable' ? 'red' : 'neutral';
}
export function incidentDuration(start: number, end: number): string {
  const seconds = Math.max(0, Math.floor((end - start) / 1000));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return hours > 0 ? `${hours}h ${minutes.toString().padStart(2, '0')}m` : `${minutes}m ${seconds % 60}s`;
}
