import Ionicons from '@expo/vector-icons/Ionicons';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { t } from '../localization';
import { usePalette } from './components';

export function PowerButton({ active, disabled, busy, tone, label, onPress }: {
  active: boolean; disabled: boolean; busy: boolean; tone: 'green' | 'amber' | 'red'; label: string; onPress: () => void;
}) {
  const colors = usePalette();
  const color = active ? colors[tone] : colors.line;
  const foreground = active ? (tone === 'green' ? colors.greenText : colors.background) : colors.text;
  return <View style={{ padding: 10, borderRadius: 112, borderWidth: 2, borderColor: color, alignSelf: 'center' }}>
    <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ disabled: disabled || busy, busy }}
      disabled={disabled || busy} onPress={onPress} style={({ pressed }) => ({
        width: 188, height: 188, borderRadius: 94, backgroundColor: active ? color : colors.card,
        alignItems: 'center', justifyContent: 'center', gap: 10, opacity: disabled ? 0.55 : 1, transform: [{ scale: pressed ? 0.97 : 1 }],
      })}>
      {busy ? <ActivityIndicator size="large" color={foreground} /> : <Ionicons name="power-outline" size={56} color={foreground} accessible={false} />}
      <Text style={{ color: foreground, fontSize: 24, fontWeight: '700', letterSpacing: 1 }}>{busy ? t('powerBusy') : active ? t('powerOn') : t('powerOff')}</Text>
    </Pressable>
  </View>;
}
