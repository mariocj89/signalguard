import { Tabs } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GuardProvider } from '../state/GuardProvider';
import { t } from '../localization';
import { usePalette } from '../ui/components';
import { StatusBar } from 'expo-status-bar';

export default function Layout() {
  const colors = usePalette();
  return <SafeAreaProvider><GuardProvider><StatusBar style="auto" /><Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: colors.text, tabBarInactiveTintColor: colors.muted, tabBarStyle: { backgroundColor: colors.card, borderTopColor: colors.line } }}>
    <Tabs.Screen name="index" options={{ title: t('home'), tabBarIcon: ({ color }) => <Ionicons name="shield-checkmark-outline" size={23} color={color} /> }} />
    <Tabs.Screen name="history" options={{ title: t('history'), tabBarIcon: ({ color }) => <Ionicons name="time-outline" size={23} color={color} /> }} />
    <Tabs.Screen name="settings" options={{ title: t('settings'), tabBarIcon: ({ color }) => <Ionicons name="settings-outline" size={23} color={color} /> }} />
    <Tabs.Screen name="diagnostics" options={{ href: null, title: t('diagnostics') }} />
  </Tabs></GuardProvider></SafeAreaProvider>;
}
