import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GuardProvider } from '../state/GuardProvider';
import { t } from '../localization';
import { usePalette } from '../ui/components';
import { StatusBar } from 'expo-status-bar';

export default function Layout() {
  const colors = usePalette();
  return <SafeAreaProvider><GuardProvider><StatusBar style="auto" /><Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: colors.text, tabBarInactiveTintColor: colors.muted, tabBarStyle: { backgroundColor: colors.card, borderTopColor: colors.line } }}>
    <Tabs.Screen name="index" options={{ title: t('home'), tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>◉</Text> }} />
    <Tabs.Screen name="history" options={{ title: t('history'), tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>◷</Text> }} />
    <Tabs.Screen name="settings" options={{ title: t('settings'), tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>⚙</Text> }} />
    <Tabs.Screen name="diagnostics" options={{ href: null, title: t('diagnostics') }} />
  </Tabs></GuardProvider></SafeAreaProvider>;
}
