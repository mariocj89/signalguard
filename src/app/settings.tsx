import { useCallback, useState } from 'react';
import { AppState, Linking, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { SignalGuard, type GuardSettings, type NotificationStatus } from '../../modules/signal-guard-native';
import { useGuard } from '../state/GuardProvider';
import { validSettings } from '../domain/settings';
import { isActive } from '../domain/presentation';
import { Body, Button, Card, Heading, Page, styles, usePalette } from '../ui/components';
import { t, errorText } from '../localization';

export default function Settings() {
  const { state, refresh } = useGuard();
  const colors = usePalette();
  const [error, setError] = useState<string | null>(null);
  const [notificationStatus, setNotificationStatus] = useState<NotificationStatus | null>(null);
  const [saving, setSaving] = useState(false);
  useFocusEffect(useCallback(() => {
    let mounted = true;
    let generation = 0;
    const load = async () => {
      const request = ++generation;
      if (mounted) setNotificationStatus(null);
      try {
        // Old development clients may not yet include this new native method.
        if (typeof SignalGuard.getNotificationStatus !== 'function') return;
        const status = await SignalGuard.getNotificationStatus();
        if (mounted && request === generation) setNotificationStatus(status);
      } catch { /* Keep unknown status rather than claiming permission. */ }
    };
    void load();
    const listener = AppState.addEventListener('change', next => { if (next === 'active') void load(); });
    return () => { mounted = false; listener.remove(); };
  }, []));
  const locked = isActive(state) || state.phase === 'starting' || state.phase === 'stopping';
  const change = async (key: keyof GuardSettings, enabled: boolean) => {
    const next = { ...state.settings, [key]: enabled };
    if (!validSettings(next)) { setError(t('conditionsRequired')); return; }
    setSaving(true); setError(null);
    try { await SignalGuard.updateSettings(next); await refresh(); }
    catch (failure) { setError(errorText(failure)); }
    finally { setSaving(false); }
  };
  return <Page>
    <Pressable disabled={!__DEV__} onLongPress={__DEV__ ? () => router.push('/diagnostics') : undefined}>
      <Heading>{t('settings')}</Heading>
    </Pressable>
    <View style={{ gap: 8 }}>
      <Text accessibilityRole="header" style={{ color: colors.muted, fontSize: 16, fontWeight: '600', paddingHorizontal: 16 }}>{t('monitorSection')}</Text>
      <Card style={{ gap: 0, paddingVertical: 4, paddingHorizontal: 16 }}>
      {(['internet', 'cellular'] as const).map((key, index) => <View key={key} style={[styles.row, { minHeight: 64, borderBottomWidth: index === 0 ? StyleSheet.hairlineWidth : 0, borderBottomColor: colors.line }]}>
        <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center', flex: 1, minWidth: 0 }}>
          <Ionicons name={key === 'internet' ? 'globe-outline' : 'call-outline'} size={22} color={colors.muted} accessible={false} style={{ width: 24, textAlign: 'center' }} />
          <Text style={{ flex: 1, flexShrink: 1, fontSize: 17, color: colors.text }}>{t(key)}</Text>
        </View>
        <View style={{ width: 52, minHeight: 44, flexShrink: 0, alignItems: 'flex-end', justifyContent: 'center' }}>
          <Switch accessibilityLabel={t(key)} accessibilityHint={locked ? t('lockedSettings') : undefined} value={state.settings[key]} disabled={locked || saving} onValueChange={(value) => { void change(key, value); }} trackColor={{ true: colors.green }} />
        </View>
      </View>)}
      </Card>
    </View>
    <View style={{ gap: 8 }}>
      <Text accessibilityRole="header" style={{ color: colors.muted, fontSize: 16, fontWeight: '600', paddingHorizontal: 16 }}>{t('notifications')}</Text>
      <Card style={{ gap: 12, paddingHorizontal: 16 }}>
        {([
          ['volume-high-outline', 'notificationSound', notificationStatus?.sound === 'enabled' ? 'soundAllowed' : notificationStatus?.sound === 'disabled' ? 'soundNotAllowed' : 'unknown'],
          ['phone-portrait-outline', 'notificationVibration', 'managedByIos'],
          ['alert-circle-outline', 'criticalAlerts', 'notAvailable'],
        ] as const).map(([icon, label, value]) => <View key={label} style={[styles.row, { minHeight: 44 }]}>
          <View style={{ flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Ionicons name={icon} size={22} color={colors.muted} accessible={false} style={{ width: 24, textAlign: 'center' }} />
            <Text style={{ color: colors.text, fontSize: 16, flexShrink: 1 }}>{t(label)}</Text>
          </View>
          <Text style={{ color: colors.muted, fontSize: 14, textAlign: 'right', maxWidth: '45%' }}>{t(value)}</Text>
        </View>)}
        <Body muted>{t('notificationHow')}</Body>
        <Body muted>{t('notificationLimits')}</Body>
        <Body muted>{t('criticalApproval')}</Body>
        <Button secondary label={t('openSettings')} onPress={() => { void Linking.openSettings().catch((failure: unknown) => setError(errorText(failure))); }} />
      </Card>
    </View>
    {error && <Text accessibilityRole="alert" style={{ color: colors.red }}>{error}</Text>}
  </Page>;
}
