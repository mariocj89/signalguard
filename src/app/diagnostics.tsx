import { useState } from 'react';
import { Redirect } from 'expo-router';
import { Switch, Text, View } from 'react-native';
import { SignalGuard, type Simulation } from '../../modules/signal-guard-native';
import { useGuard } from '../state/GuardProvider';
import { isActive } from '../domain/presentation';
import { Body, Button, Card, Heading, Page, styles, usePalette } from '../ui/components';
import { t, errorText, type StringKey } from '../localization';

const actions: [Simulation, StringKey][] = [['internet', 'simulateInternet'], ['cellular', 'simulateCellular'], ['both', 'simulateBoth'], ['recovery', 'simulateRecovery'], ['interruption', 'simulateInterruption'], ['completion', 'simulateCompletion'], ['real', 'restoreReadings']];
export default function Diagnostics() {
  const { state, refresh } = useGuard();
  const colors = usePalette();
  const [error, setError] = useState<string | null>(null);
  if (!__DEV__) return <Redirect href="/" />;
  const active = isActive(state);
  const simulate = async (action: Simulation) => {
    try { setError(null); await SignalGuard.simulate(action); await refresh(); }
    catch (failure) { setError(errorText(failure)); }
  };
  return <Page>
    <Heading>{t('diagnostics')}</Heading>
    <Body muted>{t('diagnosticHelp')}</Body>
    <Card>
      <View style={styles.row}><Body>{t('shortTiming')}</Body><Switch accessibilityLabel={t('shortTiming')} value={state.testTimingActive ?? false} disabled={active || state.phase === 'starting'} onValueChange={(value) => {
        void SignalGuard.setTestTiming(value).then(refresh).catch((failure: unknown) => setError(errorText(failure)));
      }} /></View>
      <Body muted>{t('shortTimingHelp')}</Body>
    </Card>
    {actions.map(([action, label]) => <Button key={action} secondary label={t(label)} onPress={() => { void simulate(action); }} disabled={!active} />)}
    {error && <Text style={{ color: colors.red }}>{error}</Text>}
  </Page>;
}
