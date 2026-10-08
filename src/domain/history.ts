import type { Session } from '../../modules/signal-guard-native';
export interface HistoryEntry {
  session: Session;
  monitoredDuration: number;
  events: { kind: 'interrupted' | 'resumed'; at: number }[];
}
export function historyEntries(sessions: Session[]): HistoryEntry[] {
  const parents = new Map<string, HistoryEntry>();
  const entries: HistoryEntry[] = [];
  for (const segment of [...sessions].sort((a, b) => a.start - b.start)) {
    const end = segment.end ?? segment.lastHeartbeat;
    let entry = segment.resumedFrom ? parents.get(segment.resumedFrom) : undefined;
    if (!entry) {
      entry = { session: { ...segment, incidents: [...segment.incidents] }, monitoredDuration: 0, events: segment.resumedFrom ? [{ kind: 'resumed', at: segment.start }] : [] };
      entries.push(entry);
    } else {
      entry.events.push({ kind: 'resumed', at: segment.start });
      entry.session = { ...segment, id: entry.session.id, start: entry.session.start, incidents: [...entry.session.incidents, ...segment.incidents] };
    }
    entry.monitoredDuration += Math.max(0, end - segment.start);
    if (segment.outcome === 'interrupted') entry.events.push({ kind: 'interrupted', at: end });
    parents.set(segment.id, entry);
  }
  return entries.sort((a, b) => b.session.start - a.session.start);
}
