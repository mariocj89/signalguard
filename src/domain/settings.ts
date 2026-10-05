import type { GuardSettings } from '../../modules/signal-guard-native';
export function validSettings(settings: GuardSettings): boolean {
  return typeof settings.internet === 'boolean' && typeof settings.cellular === 'boolean' && (settings.internet || settings.cellular);
}
