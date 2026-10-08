import { createDevelopmentPreview } from '../modules/signal-guard-native/preview';

const now = new Date(2026, 9, 8, 9, 0).getTime();
test('Expo Go preview can change selection and emit it without claiming monitoring is available', async () => {
  const preview = createDevelopmentPreview(now);
  const listener = jest.fn();
  const subscription = preview.addListener('onGuardState', listener);
  await preview.updateSettings({ internet: false, cellular: true });
  expect((await preview.getGuardState()).settings).toEqual({ internet: false, cellular: true });
  expect(listener).toHaveBeenCalledWith(expect.objectContaining({ monitoring: false }));
  await expect(preview.updateSettings({ internet: false, cellular: false })).rejects.toThrow('conditionsRequired');
  expect((await preview.getPreflightStatus()).ready).toBe(false);
  await expect(preview.startGuard({ internet: false, cellular: true, end: now + 3600000 })).rejects.toThrow('nativeUnavailable');
  subscription.remove();
});
test('sample history covers past outcomes and incidents, can be cleared, and never mutates real storage', async () => {
  const preview = createDevelopmentPreview(now);
  const history = await preview.getHistory();
  expect(history).toHaveLength(5);
  expect(history.every(session => session.start < session.end! && session.end! < now)).toBe(true);
  expect(history.some(session => session.outcome === 'interrupted')).toBe(true);
  expect(history.flatMap(session => session.incidents).some(incident => !incident.crossedThreshold)).toBe(true);
  expect(history.flatMap(session => session.incidents).some(incident => incident.acknowledged)).toBe(true);
  history[0]!.outcome = 'running';
  expect((await preview.getHistory())[0]!.outcome).toBe('stopped');
  await preview.clearHistory();
  expect(await preview.getHistory()).toEqual([]);
  expect(await createDevelopmentPreview(now).getHistory()).toHaveLength(5);
});
