import { useState } from 'react';
import { Linking, Switch, Text, View } from 'react-native';
import { Link } from 'expo-router';
import { SignalGuard, type GuardSettings } from '../../modules/signal-guard-native';
import { useGuard } from '../state/GuardProvider';
import { validSettings } from '../domain/settings';
import { isActive } from '../domain/presentation';
import { Body, Button, Card, Heading, Page, styles, usePalette } from '../ui/components';
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
    <Heading>{t('settings')}</Heading>
    <Card><Body>{t('languageTitle')}</Body><Body muted>{t('language')}</Body><Button secondary label={t('openSettings')} onPress={() => { void Linking.openSettings().catch((failure: unknown) => setError(errorText(failure))); }} /></Card>
    <Card><Body>{t('privacyTitle')}</Body><Body muted>{t('privacy')}</Body><Body muted>{t('privacyLocal')}</Body></Card>
    <Card><Body>{t('aboutTitle')}</Body><Body muted>{t('about')}</Body><Body muted>{t('limits')}</Body></Card>
    <Card>
      <Text accessibilityRole="header" style={{ color: colors.text, fontSize: 20, fontWeight: '600' }}>{t('advanced')}</Text>
      <Body muted>{t('advancedHelp')}</Body>
      {(['internet', 'cellular'] as const).map((key) => <View key={key} style={styles.row}>
        <Text style={{ flex: 1, fontSize: 17, color: colors.text }}>{t(key === 'internet' ? 'triggerInternet' : 'triggerCellular')}</Text>
        <Switch accessibilityLabel={t(key === 'internet' ? 'triggerInternet' : 'triggerCellular')} value={state.settings[key]} disabled={locked || saving} onValueChange={(value) => { void change(key, value); }} trackColor={{ true: colors.green }} />
      </View>)}
      {locked && <Body muted>{t('lockedSettings')}</Body>}
      <Body muted>{t('watchdogAlways')}</Body>
      <Body muted>{t('fixedTiming')}</Body>
    </Card>
    {error && <Text accessibilityRole="alert" style={{ color: colors.red }}>{error}</Text>}
    {__DEV__ && <Link href="/diagnostics" style={{ color: colors.text, fontSize: 16, padding: 12 }}>{t('diagnostics')}</Link>}
  </Page>;
}
