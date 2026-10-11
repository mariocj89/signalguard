import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as Clipboard from 'expo-clipboard';
import type { Session } from '../../modules/signal-guard-native';
import { clock, t } from '../localization';
import { interruptionDescription, interruptionReport } from '../domain/interruption';
import { Button, usePalette } from './components';

export function InterruptionDetails({ segment, at }: { segment: Session; at: number }) {
  const colors = usePalette();
  const [expanded, setExpanded] = useState(false);
  const [copyState, setCopyState] = useState<'idle' | 'copying' | 'copied' | 'failed'>('idle');
  const copy = async () => {
    setCopyState('copying');
    try {
      const copied = await Clipboard.setStringAsync(interruptionReport(segment, at));
      setCopyState(copied ? 'copied' : 'failed');
    } catch { setCopyState('failed'); }
  };
  return <View style={{ gap: 10 }}>
    <Pressable accessibilityRole="button" accessibilityLabel={t('interruptionOpen', { time: clock(at) })} accessibilityState={{ expanded }} onPress={() => setExpanded(!expanded)} style={{ flexDirection: 'row', gap: 8, alignItems: 'center', minHeight: 44 }}>
      <Ionicons name="pause-circle-outline" size={18} color={colors.red} accessible={false} />
      <Text style={{ color: colors.muted, fontSize: 13, flex: 1 }}>{t('interrupted')}</Text>
      <Text style={{ color: colors.muted, fontSize: 13, fontVariant: ['tabular-nums'] }}>{clock(at)}</Text>
      <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={16} color={colors.muted} accessible={false} />
    </Pressable>
    {expanded && <View style={{ gap: 10, padding: 12, borderRadius: 12, backgroundColor: colors.inset }}>
      <Text style={{ color: colors.text, fontSize: 15, lineHeight: 21 }}>{interruptionDescription(segment.interruptionReason)}</Text>
      <Text selectable style={{ color: colors.muted, fontSize: 13 }}>{t('interruptionCode')}: {segment.interruptionReason || t('interruptionNotRecorded')}</Text>
      <Text style={{ color: colors.muted, fontSize: 13 }}>{t('interruptionSegmentStart')}: {clock(segment.start)}</Text>
      <Text style={{ color: colors.muted, fontSize: 13 }}>{t('interruptionLastHeartbeat')}: {clock(segment.lastHeartbeat)}</Text>
      <Text style={{ color: colors.muted, fontSize: 13, lineHeight: 19 }}>{t('interruptionEvidenceNote')}</Text>
      <Button secondary label={t('copyInterruptionDetails')} busy={copyState === 'copying'} onPress={() => { void copy(); }} />
      {copyState === 'copied' && <Text accessibilityLiveRegion="polite" style={{ color: colors.green, fontSize: 13 }}>{t('interruptionCopied')}</Text>}
      {copyState === 'failed' && <Text accessibilityLiveRegion="polite" style={{ color: colors.red, fontSize: 13 }}>{t('interruptionCopyFailed')}</Text>}
    </View>}
  </View>;
}
