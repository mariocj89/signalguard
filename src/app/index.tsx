import React, { useCallback, useState } from 'react';
import { Alert, Linking, Platform, Pressable, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { SignalGuard, type Health } from '../../modules/signal-guard-native';
import { useGuard } from '../state/GuardProvider';
import { t, clock, errorText } from '../localization';
import { endForClock, endForDuration } from '../domain/scheduling';
import { isActive } from '../domain/presentation';
import { Body, Button, Card, Heading, Page, StatusRow, styles, usePalette } from '../ui/components';

export default function Home() {
  const { state, preflight, checking, refresh } = useGuard();
  const colors = usePalette();
  const [selected, setSelected] = useState(() => endForDuration(new Date(), 8));
  const [duration, setDuration] = useState<number | null>(8);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const active = isActive(state);
  const transitioning = busy || state.phase === 'starting' || state.phase === 'stopping';
  useFocusEffect(useCallback(() => {
    void refresh().catch((failure: unknown) => setError(errorText(failure)));
  }, [refresh]));
  const submit = async () => {
    setBusy(true); setError(null);
    try {
      const now = new Date();
      const end = duration !== null ? endForDuration(now, duration) : endForClock(now, selected.getHours(), selected.getMinutes());
      await SignalGuard.startGuard({ ...state.settings, end: end.getTime() });
      await refresh();
    } catch (failure) { setError(errorText(failure)); await refresh().catch(() => {}); }
    finally { setBusy(false); }
  };
  const stop = () => Alert.alert(t('stopTitle'), t('stopBody'), [
    { text: t('cancel'), style: 'cancel' },
    { text: t('stopConfirm'), style: 'destructive', onPress: () => {
      setBusy(true);
      void SignalGuard.stopGuard().then(refresh).catch((failure: unknown) => setError(errorText(failure))).finally(() => setBusy(false));
    } },
  ]);
  const askPermission = () => Alert.alert(t('permissionTitle'), t('permissionBody'), [
    { text: t('cancel'), style: 'cancel' },
    { text: t('continue'), onPress: () => {
      setBusy(true);
      void SignalGuard.requestNotificationPermission().then(refresh).catch((failure: unknown) => setError(errorText(failure))).finally(() => setBusy(false));
    } },
  ]);
  const inactiveHealth = (enabled: boolean, confirmed?: boolean): Health => !enabled ? 'disabled' : checking || confirmed === undefined ? 'unknown' : confirmed ? 'healthy' : 'unavailable';
  const phaseColor = state.phase === 'activeIncident' || state.phase === 'interrupted' ? colors.red : state.phase === 'activeDegraded' ? colors.amber : colors.green;
  const nativeError = state.error ? errorText(new Error(state.error)) : null;
  return <Page>
    <Heading>{t('appName')}</Heading>
    {__DEV__ && state.simulationActive && <Text style={{ color: colors.amber }}>{t('simulationActive')}</Text>}
    {__DEV__ && state.testTimingActive && <Text style={{ color: colors.amber }}>{t('testTimingActive')}</Text>}
    {active ? <View style={{ gap: 8 }}>
      <Text accessibilityRole="header" style={{ fontSize: 20, fontWeight: '700', color: phaseColor }}>{t('active')}{state.phase === 'activeHealthy' ? ' ✓' : ''}</Text>
      <Text style={{ color: colors.muted, fontSize: 24 }}>{t('until', { time: state.end ? clock(state.end) : t('unknown') })}</Text>
    </View> : state.phase === 'interrupted' ? <Card>
      <Text accessibilityRole="header" style={{ color: colors.red, fontSize: 22, fontWeight: '700' }}>{t('interrupted')}</Text>
      <Body>{t('interruptedBody')}</Body>
    </Card> : state.phase === 'completed' ? <Body>{t('completed')} ✓</Body> : null}
    <Card>
      <StatusRow label={t('internet')} health={active ? state.internet : inactiveHealth(state.settings.internet, preflight?.internet)} />
      <StatusRow label={t('cellular')} health={active ? state.cellular : inactiveHealth(state.settings.cellular, preflight?.cellular)} />
      {!active && <StatusRow label={t('notifications')} health={inactiveHealth(true, preflight ? preflight.notifications && preflight.timeSensitive : undefined)} />}
      <StatusRow label={t('monitoring')} health={state.phase === 'interrupted' ? 'unavailable' : active ? 'healthy' : inactiveHealth(true, preflight?.ready)} />
    </Card>
    {active && state.internet === 'checking' && <Text style={{ color: colors.amber }}>{t('checkingInternet')}</Text>}
    {active && state.cellular === 'checking' && <Text style={{ color: colors.amber }}>{t('checkingCellular')}</Text>}
    {active && state.phase === 'activeIncident' && <Card>
      <Text style={{ color: colors.red, fontSize: 18, fontWeight: '600' }}>{t('incident')}</Text>
      {state.incident?.acknowledged ? <Body muted>{t('acknowledged')}</Body> : <>
        <Body muted>{t('acknowledgeHelp')}</Body>
        <Button secondary label={t('acknowledge')} onPress={() => { void SignalGuard.acknowledgeIncident().catch((failure: unknown) => setError(errorText(failure))); }} />
      </>}
    </Card>}
    {active ? <>
      <View style={{ gap: 6 }}><Body muted>{t('lastConfirmed')}</Body><Body>{state.lastConfirmed ? state.lastConfirmationRecent ? t('justNow') : clock(state.lastConfirmed) : t('unknown')}</Body></View>
      <Button label={t('stopGuard')} onPress={stop} busy={transitioning} />
    </> : <>
      <View style={{ gap: 6 }}>
        <Body muted>{t('guardEnds')}</Body>
        <View style={styles.row}><Body>{t('start')}</Body><Body>{t('now')}</Body></View>
        <View style={styles.row}>
          <Body>{t('end')}</Body>
          {Platform.OS === 'ios' ? <DateTimePicker value={selected} mode="time" display="compact" onChange={(_, value) => {
            if (!value) return;
            try { setSelected(endForClock(new Date(), value.getHours(), value.getMinutes())); setDuration(null); setError(null); }
            catch (failure) { setError(errorText(failure)); }
          }} accessibilityLabel={t('end')} /> : <Text style={{ color: colors.text, fontSize: 36, fontWeight: '500', fontVariant: ['tabular-nums'] }}>{clock(selected)}</Text>}
        </View>
        {duration === null && selected.getDate() !== new Date().getDate() && <Body muted>{t('tomorrow')}</Body>}
        <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
          {[1, 4, 8, 12].map((hours) => <Pressable key={hours} accessibilityRole="button" accessibilityLabel={t('quickDuration', { hours })} accessibilityState={{ selected: duration === hours }} onPress={() => { setDuration(hours); setSelected(endForDuration(new Date(), hours)); setError(null); }} style={{ backgroundColor: colors.card, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 16, borderWidth: duration === hours ? 2 : 1, borderColor: duration === hours ? colors.text : colors.line }}>
            <Text style={{ fontSize: 16, color: colors.text }}>+{hours}h</Text>
          </Pressable>)}
        </View>
        <Body muted>{t('endHelp')}</Body>
      </View>
      {checking && <Body muted>{t('checkingSetup')}</Body>}
      {preflight?.issues.map((issue) => <Text key={issue} style={{ color: colors.red, fontSize: 16, lineHeight: 23 }}>{t(issue)}</Text>)}
      {preflight?.permissionUndetermined ? <Button secondary label={t('enableNotifications')} onPress={askPermission} disabled={transitioning} /> : preflight?.issues.some((issue) => issue === 'notificationsRequired' || issue === 'timeSensitiveRequired' || issue === 'cellularUnavailable') ? <Button secondary label={t('openSettings')} onPress={() => { void Linking.openSettings().catch((failure: unknown) => setError(errorText(failure))); }} /> : null}
      <Button label={state.phase === 'interrupted' ? t('restartGuard') : t('startGuard')} onPress={() => { void submit(); }} disabled={!preflight?.ready || checking || transitioning} busy={transitioning} />
    </>}
    {(error || nativeError) && <Text accessibilityRole="alert" style={{ color: colors.red, fontSize: 16, lineHeight: 24 }}>{error ?? nativeError}</Text>}
    <Body muted>{t('safetyNote')}</Body>
  </Page>;
}
