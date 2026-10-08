import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Linking, Platform, Pressable, Switch, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useFocusEffect } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { SignalGuard, type GuardSettings, type Health } from '../../modules/signal-guard-native';
import { useGuard } from '../state/GuardProvider';
import { t, clock, errorText } from '../localization';
import { endForClock, endForDuration } from '../domain/scheduling';
import { validSettings } from '../domain/settings';
import { isActive } from '../domain/presentation';
import { Body, Button, Card, Heading, Page, StatusRow, styles, usePalette } from '../ui/components';
import { PowerButton } from '../ui/PowerButton';

export default function Home() {
  const { state, preflight, checking, refresh } = useGuard();
  const colors = usePalette();
  const [selected, setSelected] = useState(() => endForDuration(new Date(), 8));
  const [duration, setDuration] = useState<number | null>(8);
  const [timed, setTimed] = useState(false);
  const [resuming, setResuming] = useState(false);
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState(false);
  const [stopNotice, setStopNotice] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const active = isActive(state);
  const resumeSelection = state.resumeSettings ?? state.settings;
  const canResume = state.phase === 'interrupted' && state.canResume === true && state.end !== undefined && resumeSelection.internet === state.settings.internet && resumeSelection.cellular === state.settings.cellular;
  const transitioning = busy || saving || state.phase === 'starting' || state.phase === 'stopping';
  const tone = state.phase === 'activeIncident' || state.phase === 'interrupted' ? 'red' : state.phase === 'activeDegraded' ? 'amber' : 'green';
  useFocusEffect(useCallback(() => {
    void refresh().catch((failure: unknown) => setError(errorText(failure)));
  }, [refresh]));
  // This timer only dismisses UI feedback; native Swift still owns monitoring.
  useEffect(() => {
    if (!stopNotice) return;
    const timer = setTimeout(() => setStopNotice(false), 4000);
    return () => clearTimeout(timer);
  }, [stopNotice]);
  const change = async (key: keyof GuardSettings, enabled: boolean) => {
    if (active || transitioning) return;
    const next = { ...state.settings, [key]: enabled };
    if (!validSettings(next)) { setError(t('conditionsRequired')); return; }
    setSaving(true); setError(null);
    try { await SignalGuard.updateSettings(next); await refresh(); }
    catch (failure) { setError(errorText(failure)); }
    finally { setSaving(false); }
  };
  const submit = async () => {
    setStopNotice(false);
    setBusy(true); setError(null);
    try {
      const now = new Date();
      if (canResume) {
        setResuming(true);
        if (typeof SignalGuard.resumeGuard !== 'function') throw new Error('nativeUnavailable');
        await SignalGuard.resumeGuard();
        await refresh();
        return;
      }
      const end = !timed ? endForDuration(now, 24) : duration !== null ? endForDuration(now, duration) : endForClock(now, selected.getHours(), selected.getMinutes());
      await SignalGuard.startGuard({ ...state.settings, end: end.getTime() });
      await refresh();
    } catch (failure) { setError(errorText(failure)); await refresh().catch(() => {}); }
    finally { setBusy(false); setResuming(false); }
  };
  const stop = async () => {
    if (transitioning) return;
    setBusy(true); setError(null); setStopNotice(false);
    try {
      await SignalGuard.stopGuard();
      setStopNotice(true);
      await refresh();
    } catch (failure) { setError(errorText(failure)); }
    finally { setBusy(false); }
  };
  const askPermission = () => Alert.alert(t('permissionTitle'), t('permissionBody'), [
    { text: t('cancel'), style: 'cancel' },
    { text: t('continue'), onPress: () => {
      setBusy(true);
      void SignalGuard.requestNotificationPermission().then(refresh).catch((failure: unknown) => setError(errorText(failure))).finally(() => setBusy(false));
    } },
  ]);
  const inactiveHealth = (enabled: boolean, confirmed?: boolean): Health => !enabled ? 'disabled' : checking || confirmed === undefined || preflight?.issues.some(issue => issue === 'nativeUnavailable' || issue === 'iosRequired') ? 'unknown' : confirmed ? 'healthy' : 'unavailable';
  const nativeError = state.error ? errorText(new Error(state.error)) : null;
  return <Page>
    <Pressable style={{ alignItems: 'center' }} disabled={!__DEV__} onLongPress={__DEV__ ? () => router.push('/diagnostics') : undefined}><Heading>{t('appName')}</Heading></Pressable>
    {stopNotice && !active && <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: colors.card, borderRadius: 14, padding: 12 }}>
      <Ionicons name="stop-circle-outline" size={20} color={colors.muted} accessible={false} />
      <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={{ color: colors.text, fontSize: 15 }}>{t('monitoringStopped')}</Text>
    </View>}
    {__DEV__ && state.simulationActive && <Text style={{ color: colors.amber }}>{t('simulationActive')}</Text>}
    {__DEV__ && state.testTimingActive && <Text style={{ color: colors.amber }}>{t('testTimingActive')}</Text>}
    <View style={{ alignItems: 'center', gap: 16, paddingVertical: 6 }}>
      <PowerButton active={active} tone={tone} busy={transitioning} disabled={!active && (!preflight?.ready || checking)}
        inactiveText={canResume ? t('resumeGuard') : undefined} busyText={resuming || state.resuming ? t('resuming') : undefined}
        label={active ? t('stopGuard') : canResume ? t('resumeGuard') : t('startGuard')}
        onPress={() => { void (active ? stop() : submit()); }} />
      {active ? <View style={{ alignItems: 'center', gap: 5 }}>
        <Text accessibilityRole="header" style={{ color: colors[tone], fontSize: 17, fontWeight: '600' }}>{t('active')}</Text>
        <Text style={{ color: colors.muted, fontSize: 15, fontVariant: ['tabular-nums'] }}>{t('until', { time: state.end ? clock(state.end) : t('unknown') })}</Text>
      </View> : <Text style={{ color: colors.muted, fontSize: 14 }}>{canResume && state.end ? t('until', { time: clock(state.end) }) : timed ? t('until', { time: clock(selected) }) : t('powerLimit')}</Text>}
    </View>
    {state.phase === 'interrupted' && <View accessibilityLabel={`${t('monitoring')}: ${t('unavailable')}`} style={{ alignItems: 'center', gap: 6 }}>
      <Text accessibilityRole="header" style={{ color: colors.red, fontSize: 18, fontWeight: '600' }}>{t('interrupted')}</Text>
      <Text style={{ color: colors.muted, fontSize: 15 }}>{t('interruptedBody')}</Text>
    </View>}
    {state.phase === 'completed' && <Text style={{ color: colors.green, textAlign: 'center', fontSize: 15 }}>{t('completed')}</Text>}
    <View style={{ gap: 8, width: '100%', maxWidth: 350, alignSelf: 'center' }}>
      {!active && <Text accessibilityRole="header" style={{ color: colors.muted, fontSize: 15, fontWeight: '600', paddingHorizontal: 16 }}>{t('monitorSection')}</Text>}
      <Card style={{ gap: 0, paddingVertical: 4, paddingHorizontal: 16 }}>
        {(['internet', 'cellular'] as const).map((key, index) => <StatusRow key={key} last={index === 1} icon={key === 'internet' ? 'globe-outline' : 'call-outline'} label={t(key)}
          health={active ? state[key] : inactiveHealth(state.settings[key], preflight?.[key])}
          control={!active ? <View style={{ width: 52, alignItems: 'flex-end' }}><Switch accessibilityLabel={t(key)} value={state.settings[key]} disabled={transitioning} onValueChange={value => { void change(key, value); }} trackColor={{ true: colors.green }} /></View> : undefined} />)}
      </Card>
    </View>
    {active && state.internet === 'checking' && <Text style={{ color: colors.amber, textAlign: 'center' }}>{t('checkingInternet')}</Text>}
    {active && state.cellular === 'checking' && <Text style={{ color: colors.amber, textAlign: 'center' }}>{t('checkingCellular')}</Text>}
    {active && state.phase === 'activeIncident' && <Card>
      <Text style={{ color: colors.red, fontSize: 18, fontWeight: '600' }}>{t('incident')}</Text>
      {state.incident?.acknowledged ? <Body muted>{t('acknowledged')}</Body> : <>
        <Body muted>{t('acknowledgeHelp')}</Body>
        <Button secondary label={t('acknowledge')} onPress={() => { void SignalGuard.acknowledgeIncident().catch((failure: unknown) => setError(errorText(failure))); }} />
      </>}
    </Card>}
    {active ? <View style={[styles.row, { minHeight: 28, maxWidth: 310, width: '100%', alignSelf: 'center' }]}>
      <Text style={{ color: colors.muted, fontSize: 14 }}>{t('lastConfirmed')}</Text>
      <Text style={{ color: colors.text, fontSize: 14 }}>{state.lastConfirmed ? state.lastConfirmationRecent ? t('justNow') : clock(state.lastConfirmed) : t('unknown')}</Text>
    </View> : <>
      {(resuming || state.resuming) && <Text style={{ color: colors.muted, textAlign: 'center' }}>{t('resuming')}</Text>}
      {checking && <Text style={{ color: colors.muted, textAlign: 'center' }}>{t('checkingSetup')}</Text>}
      {preflight?.issues.map((issue) => <Text key={issue} style={{ color: colors.red, fontSize: 15, lineHeight: 22 }}>{t(issue)}</Text>)}
      {preflight?.permissionUndetermined ? <Button secondary label={t('enableNotifications')} onPress={askPermission} disabled={transitioning} /> : preflight?.issues.some((issue) => issue === 'notificationsRequired' || issue === 'timeSensitiveRequired' || issue === 'cellularUnavailable') ? <Button secondary label={t('openSettings')} onPress={() => { void Linking.openSettings().catch((failure: unknown) => setError(errorText(failure))); }} /> : null}
      {!canResume && <Pressable accessibilityRole="button" accessibilityLabel={t('chooseEndTime')} accessibilityState={{ expanded: timed, disabled: transitioning }} disabled={transitioning}
        onPress={() => { setTimed(!timed); setError(null); }} style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, minHeight: 44 }}>
        <Ionicons name="time-outline" size={19} color={colors.muted} accessible={false} />
        <Text style={{ color: colors.muted, fontSize: 15 }}>{t('chooseEndTime')}</Text>
        <Ionicons name={timed ? 'chevron-up' : 'chevron-down'} size={15} color={colors.muted} accessible={false} />
      </Pressable>}
      {timed && !canResume && <Card style={{ gap: 12 }}>
        <View style={[styles.row, { minHeight: 28 }]}><Body muted>{t('start')}</Body><Body muted>{t('now')}</Body></View>
        <View style={styles.row}>
          <Body>{t('end')}</Body>
          {Platform.OS === 'ios' ? <DateTimePicker value={selected} mode="time" display="compact" onChange={(_, value) => {
            if (!value) return;
            try { setSelected(endForClock(new Date(), value.getHours(), value.getMinutes())); setDuration(null); setError(null); }
            catch (failure) { setError(errorText(failure)); }
          }} accessibilityLabel={t('end')} /> : <Text style={{ color: colors.text, fontSize: 32, fontWeight: '500', fontVariant: ['tabular-nums'] }}>{clock(selected)}</Text>}
        </View>
        {duration === null && selected.getDate() !== new Date().getDate() && <Body muted>{t('tomorrow')}</Body>}
        <View style={{ flexDirection: 'row', gap: 4, backgroundColor: colors.inset, borderRadius: 14, padding: 4 }}>
          {[1, 4, 8, 12].map((hours) => <Pressable key={hours} accessibilityRole="button" accessibilityLabel={t('quickDuration', { hours })} accessibilityState={{ selected: duration === hours }} onPress={() => { setDuration(hours); setSelected(endForDuration(new Date(), hours)); setError(null); }} style={({ pressed }) => ({ flex: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center', backgroundColor: duration === hours ? colors.card : 'transparent', borderRadius: 10, borderWidth: duration === hours ? 1 : 0, borderColor: colors.line, opacity: pressed ? 0.65 : 1 })}>
            <Text style={{ fontSize: 16, fontWeight: duration === hours ? '700' : '500', color: duration === hours ? colors.text : colors.muted }}>+{hours}h</Text>
          </Pressable>)}
        </View>
      </Card>}
    </>}
    {(error || nativeError) && <Text accessibilityRole="alert" style={{ color: colors.red, fontSize: 15, lineHeight: 22 }}>{error ?? nativeError}</Text>}
  </Page>;
}
