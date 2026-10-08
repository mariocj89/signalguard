import { useCallback, useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { SignalGuard, type Session } from '../../modules/signal-guard-native';
import { Body, Button, Card, Heading, Page, usePalette } from '../ui/components';
import { t, clock, dateLabel, errorText, type StringKey } from '../localization';
import { incidentDuration } from '../domain/presentation';

const outcomes: Record<Session['outcome'], StringKey> = { completed: 'completed', stopped: 'stopped', interrupted: 'interrupted', running: 'running' };
export default function History() {
  const colors = usePalette();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(async () => { setSessions(await SignalGuard.getHistory()); }, []);
  useFocusEffect(useCallback(() => { void load().catch((failure: unknown) => setError(errorText(failure))); }, [load]));
  const clear = () => Alert.alert(t('clearTitle'), t('clearBody'), [
    { text: t('cancel'), style: 'cancel' },
    { text: t('clearConfirm'), style: 'destructive', onPress: () => { void SignalGuard.clearHistory().then(load).catch((failure: unknown) => setError(errorText(failure))); } },
  ]);
  return <Page>
    <Heading>{t('history')}</Heading>
    {sessions.length === 0 ? <Card><Body>{t('noHistory')}</Body><Body muted>{t('noHistoryBody')}</Body></Card> : sessions.map((session, index) => <View key={session.id} style={{ gap: 12 }}>
      {dateLabel(session.start) !== (index > 0 ? dateLabel(sessions[index - 1]!.start) : '') && <Text accessibilityRole="header" style={{ color: colors.muted, fontSize: 17, fontWeight: '600' }}>{dateLabel(session.start)}</Text>}
      <Card>
        <Text style={{ color: session.outcome === 'interrupted' ? colors.red : colors.text, fontSize: 19, fontWeight: '600' }}>{t(outcomes[session.outcome])}</Text>
        <Body muted>{t('sessionUntil', { start: clock(session.start), end: clock(session.end ?? session.scheduledEnd) })}</Body>
        <Body muted>{t('duration', { duration: incidentDuration(session.start, session.end ?? session.lastHeartbeat) })}</Body>
        {session.outcome === 'interrupted' && session.interruptionReason && <Body muted>{errorText(new Error(session.interruptionReason))}</Body>}
        {session.incidents.map((incident) => <View key={incident.id} style={{ gap: 5, paddingTop: 12, borderTopColor: colors.line, borderTopWidth: 1 }}>
          <Text style={{ color: incident.crossedThreshold ? colors.red : colors.amber, fontSize: 16, fontWeight: '600' }}>{clock(incident.start)} · {t(incident.dimensions.length > 1 ? 'bothIncident' : incident.dimensions.includes('cellular') ? 'cellularIncident' : 'internetIncident')}</Text>
          <Body muted>{incidentDuration(incident.start, incident.end ?? session.lastHeartbeat)} · {t(incident.crossedThreshold ? 'alerted' : 'brief')}</Body>
          {incident.acknowledged && <Body muted>{t('wasAcknowledged')}</Body>}
        </View>)}
      </Card>
    </View>)}
    {error && <Text style={{ color: colors.red }}>{error}</Text>}
    {sessions.length > 0 && <Button secondary label={t('clearHistory')} onPress={clear} />}
  </Page>;
}
