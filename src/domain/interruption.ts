import type { Session } from '../../modules/signal-guard-native';
import { t, type StringKey } from '../localization';

const explanations: Record<string, StringKey> = {
  taskExpired: 'interruptionSystemDetail',
  heartbeatMissed: 'interruptionHeartbeatDetail',
  processStopped: 'interruptionProcessDetail',
  notificationsChanged: 'notificationsChanged',
  notificationSchedulingFailed: 'notificationSchedulingFailed',
  storageUnavailable: 'storageUnavailable',
  clockChanged: 'clockChanged',
  monitorInterrupted: 'interruptionUnknownDetail',
};
export function interruptionDescription(reason?: string): string {
  const key = reason && Object.prototype.hasOwnProperty.call(explanations, reason) ? explanations[reason]! : 'interruptionUnknownDetail';
  return t(key);
}
// Copy only the selected segment's evidence, never SIM/device/session identifiers.
export function interruptionReport(segment: Session, at: number): string {
  return [
    `SignalGuard · ${t('interruptionDetails')}`,
    interruptionDescription(segment.interruptionReason),
    `${t('interruptionCode')}: ${segment.interruptionReason || t('interruptionNotRecorded')}`,
    `${t('interruptionSegmentStart')}: ${new Date(segment.start).toISOString()}`,
    `${t('interruptionRecordedAt')}: ${new Date(at).toISOString()}`,
    `${t('interruptionLastHeartbeat')}: ${new Date(segment.lastHeartbeat).toISOString()}`,
    t('interruptionEvidenceNote'),
  ].join('\n');
}
