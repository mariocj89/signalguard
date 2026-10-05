import React from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, useColorScheme, View, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { healthTone } from '../domain/presentation';
import { t } from '../localization';
import type { Health } from '../../modules/signal-guard-native';

export function usePalette() {
  const dark = useColorScheme() === 'dark';
  return { background: dark ? '#101316' : '#FAFAF8', card: dark ? '#1C2126' : '#FFFFFF', text: dark ? '#F4F5F6' : '#142029', muted: dark ? '#AEB8C2' : '#586570', line: dark ? '#35404A' : '#DDE2E5', green: dark ? '#5BDC9B' : '#146F45', amber: dark ? '#F3CA66' : '#865B00', red: dark ? '#FF8585' : '#B12937', neutral: dark ? '#AEB8C2' : '#586570', button: dark ? '#F2F5F6' : '#142029', buttonText: dark ? '#142029' : '#FFFFFF' };
}
export function Page({ children }: React.PropsWithChildren) {
  const colors = usePalette();
  return <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top', 'left', 'right']}>
    <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">{children}</ScrollView>
  </SafeAreaView>;
}
export function Heading({ children }: React.PropsWithChildren) {
  const colors = usePalette(); return <Text accessibilityRole="header" style={[styles.heading, { color: colors.text }]}>{children}</Text>;
}
export function Body({ children, muted = false }: React.PropsWithChildren<{ muted?: boolean }>) {
  const colors = usePalette(); return <Text style={[styles.body, { color: muted ? colors.muted : colors.text }]}>{children}</Text>;
}
export function Card({ children, style }: React.PropsWithChildren<{ style?: ViewStyle }>) {
  const colors = usePalette(); return <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.line }, style]}>{children}</View>;
}
export function Button({ label, onPress, disabled = false, busy = false, secondary = false }: { label: string; onPress: () => void; disabled?: boolean; busy?: boolean; secondary?: boolean }) {
  const colors = usePalette();
  return <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ disabled, busy }} disabled={disabled || busy} onPress={onPress} style={({ pressed }) => [styles.button, { backgroundColor: secondary ? colors.card : colors.button, borderColor: colors.line, opacity: disabled ? 0.4 : pressed ? 0.7 : 1 }]}>
    {busy ? <ActivityIndicator color={secondary ? colors.text : colors.buttonText} /> : <Text style={[styles.buttonLabel, { color: secondary ? colors.text : colors.buttonText }]}>{label}</Text>}
  </Pressable>;
}
export function StatusRow({ label, health }: { label: string; health: Health }) {
  const colors = usePalette();
  const mark = health === 'healthy' ? '✓' : health === 'checking' ? '…' : health === 'unavailable' ? '✕' : '—';
  return <View accessibilityLabel={`${label}: ${t(health)}`} style={styles.row}>
    <Text style={[styles.rowLabel, { color: colors.text }]}>{label}</Text>
    <Text style={[styles.mark, { color: colors[healthTone(health)] }]}>{mark}</Text>
  </View>;
}
export const styles = StyleSheet.create({
  page: { padding: 24, paddingTop: 26, paddingBottom: 32, maxWidth: 560, width: '100%', alignSelf: 'center', gap: 20 },
  heading: { fontSize: 32, fontWeight: '700', letterSpacing: -1 },
  body: { fontSize: 16, lineHeight: 24 },
  card: { borderRadius: 20, borderWidth: StyleSheet.hairlineWidth, padding: 20, gap: 14 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 44, gap: 12 },
  rowLabel: { fontSize: 18, flexShrink: 1 },
  mark: { fontSize: 23, fontWeight: '600', minWidth: 28, textAlign: 'center' },
  button: { padding: 18, minHeight: 56, borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center' },
  buttonLabel: { fontSize: 16, fontWeight: '700', letterSpacing: 0.3 },
});
