import { useCallback, useState } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { SignalGuard, isDevelopmentPreview, type Session } from '../../modules/signal-guard-native';
import { Button, Card, Heading, Page, usePalette } from '../ui/components';
import { t, clock, dateLabel, errorText, type StringKey } from '../localization';
import { historyEntries } from '../domain/history';
import { InterruptionDetails } from '../ui/InterruptionDetails';
import { incidentDuration } from '../domain/presentation';

const outcomes: Record<Session['outcome'], StringKey> = { completed: 'completed', stopped: 'stopped', interrupted: 'interrupted', running: 'running' };
export default function History() {
  const colors = usePalette();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try { setSessions([...(await SignalGuard.getHistory())].sort((a, b) => b.start - a.start)); }
    finally { setLoading(false); }
  }, []);
  useFocusEffect(useCallback(() => { void load().catch((failure: unknown) => setError(errorText(failure))); }, [load]));
  const entries = historyEntries(sessions);
  const clear = () => Alert.alert(t('clearTitle'), t('clearBody'), [
    { text: t('cancel'), style: 'cancel' },
    { text: t('clearConfirm'), style: 'destructive', onPress: () => { void SignalGuard.clearHistory().then(load).catch((failure: unknown) => setError(errorText(failure))); } },
  ]);
  return <Page>
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
      <Heading>{t('history')}</Heading>
      <Pressable accessibilityRole="button" accessibilityLabel={t('aboutTitle')} onPress={() => router.push('/information')} style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name="information-circle-outline" size={26} color={colors.muted} accessible={false} />
      </Pressable>
    </View>
    {isDevelopmentPreview && <Text style={{ color: colors.muted, fontSize: 14 }}>{t('previewHistory')}</Text>}
    {loading ? <ActivityIndicator color={colors.muted} /> : error ? null : sessions.length === 0 ? <Card style={{ alignItems: 'center', paddingVertical: 32 }}>
      <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: colors.inset, alignItems: 'center', justifyContent: 'center' }}><Ionicons name="time-outline" size={28} color={colors.muted} accessible={false} /></View>
      <Text style={{ color: colors.text, fontSize: 18, fontWeight: '600', textAlign: 'center' }}>{t('noHistory')}</Text>
      <Text style={{ color: colors.muted, fontSize: 15, lineHeight: 22, textAlign: 'center' }}>{t('noHistoryBody')}</Text>
    </Card> : entries.map(({ session, monitoredDuration, events }, index) => {
      const tone = session.outcome === 'interrupted' ? colors.red : session.outcome === 'completed' ? colors.green : colors.muted;
      const icon = session.outcome === 'interrupted' ? 'alert-circle-outline' : session.outcome === 'completed' ? 'checkmark-circle-outline' : session.outcome === 'stopped' ? 'stop-circle-outline' : 'time-outline';
      const end = session.end ?? session.lastHeartbeat;
      const endLabel = new Date(session.start).toDateString() === new Date(end).toDateString() ? clock(end) : `${dateLabel(end)} · ${clock(end)}`;
      return <View key={session.id} style={{ gap: 10 }}>
        {dateLabel(session.start) !== (index > 0 ? dateLabel(entries[index - 1]!.session.start) : '') && <Text accessibilityRole="header" style={{ color: colors.muted, fontSize: 15, fontWeight: '600', paddingHorizontal: 4 }}>{dateLabel(session.start)}</Text>}
        <Card style={{ gap: 16, padding: 16 }}>
          <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
            <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: session.outcome === 'interrupted' ? colors.redTint : colors.inset, alignItems: 'center', justifyContent: 'center' }}><Ionicons name={icon} size={25} color={tone} accessible={false} /></View>
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={{ color: tone, fontSize: 17, fontWeight: '600' }}>{t(outcomes[session.outcome])}</Text>
              <Text style={{ color: colors.muted, fontSize: 13, fontVariant: ['tabular-nums'] }}>{t('sessionUntil', { start: clock(session.start), end: endLabel })}</Text>
            </View>
            <Text accessibilityLabel={t('duration', { duration: incidentDuration(0, monitoredDuration) })} style={{ color: colors.text, fontSize: 16, fontWeight: '600', fontVariant: ['tabular-nums'] }}>{incidentDuration(0, monitoredDuration)}</Text>
          </View>
          {events.map((event, eventIndex) => event.kind === 'interrupted' ? <InterruptionDetails key={`interrupted-${eventIndex}`} segment={event.segment} at={event.at} /> : <View key={`${event.kind}-${eventIndex}`} style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
            <Ionicons name="play-circle-outline" size={18} color={colors.muted} accessible={false} />
            <Text style={{ color: colors.muted, fontSize: 13, flex: 1 }}>{t('resumed')}</Text>
            <Text style={{ color: colors.muted, fontSize: 13, fontVariant: ['tabular-nums'] }}>{clock(event.at)}</Text>
          </View>)}
          {session.incidents.length === 0 && <View style={{ borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line, paddingTop: 12 }}><Text style={{ color: colors.muted, fontSize: 14 }}>{t('noIncidents')}</Text></View>}
          {session.incidents.map(incident => <View key={incident.id} style={{ gap: 8, paddingTop: 12, borderTopColor: colors.line, borderTopWidth: StyleSheet.hairlineWidth }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: incident.crossedThreshold ? colors.red : colors.amber }} />
              <Text style={{ flex: 1, color: colors.muted, fontSize: 13, fontVariant: ['tabular-nums'] }}>{clock(incident.start)}</Text>
              <Text style={{ color: colors.text, fontSize: 14, fontWeight: '500', fontVariant: ['tabular-nums'] }}>{incidentDuration(incident.start, incident.end ?? session.lastHeartbeat)}</Text>
            </View>
            <Text style={{ color: colors.text, fontSize: 16, fontWeight: '500' }}>{t(incident.dimensions.length > 1 ? 'bothIncident' : incident.dimensions.includes('cellular') ? 'cellularIncident' : 'internetIncident')}</Text>
            <Text style={{ color: incident.crossedThreshold ? colors.red : colors.amber, fontSize: 13 }}>{t(incident.crossedThreshold ? 'alerted' : 'brief')}</Text>
            {incident.acknowledged && <Text style={{ color: colors.muted, fontSize: 13 }}>{t('wasAcknowledged')}</Text>}
          </View>)}
        </Card>
      </View>;
    })}
    {error && <Text style={{ color: colors.red }}>{error}</Text>}
    {sessions.length > 0 && <Button secondary label={t('clearHistory')} onPress={clear} />}
  </Page>;
}
