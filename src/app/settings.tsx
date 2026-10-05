import { useState } from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { router } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { SignalGuard, type GuardSettings } from '../../modules/signal-guard-native';
import { useGuard } from '../state/GuardProvider';
import { validSettings } from '../domain/settings';
import { isActive } from '../domain/presentation';
import { Card, Heading, Page, styles, usePalette } from '../ui/components';
import { t, errorText } from '../localization';

export default function Settings() {
  const { state, refresh } = useGuard();
  const colors = usePalette();
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
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
    <Card style={{ gap: 0, paddingVertical: 4 }}>
      {(['internet', 'cellular'] as const).map((key, index) => <View key={key} style={[styles.row, { minHeight: 64, borderBottomWidth: index === 0 ? StyleSheet.hairlineWidth : 0, borderBottomColor: colors.line }]}>
        <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center', flex: 1 }}>
          <Ionicons name={key === 'internet' ? 'globe-outline' : 'call-outline'} size={22} color={colors.muted} accessible={false} />
          <Text style={{ fontSize: 17, color: colors.text }}>{t(key)}</Text>
        </View>
        <Switch accessibilityLabel={t(key)} accessibilityHint={locked ? t('lockedSettings') : undefined} value={state.settings[key]} disabled={locked || saving} onValueChange={(value) => { void change(key, value); }} trackColor={{ true: colors.green }} />
      </View>)}
    </Card>
    {error && <Text accessibilityRole="alert" style={{ color: colors.red }}>{error}</Text>}
  </Page>;
}
