export const MAX_GUARD_MS = 24 * 60 * 60 * 1000;
export function endForClock(now: Date, hours: number, minutes: number): Date {
  if (!Number.isInteger(hours) || hours < 0 || hours > 23 || !Number.isInteger(minutes) || minutes < 0 || minutes > 59) throw new Error('invalidEnd');
  const end = new Date(now);
  end.setHours(hours, minutes, 0, 0);
  if (end.getTime() <= now.getTime()) end.setDate(end.getDate() + 1);
  if (!validEnd(now.getTime(), end.getTime())) throw new Error('invalidEnd');
  return end;
}
export function endForDuration(now: Date, hours: number): Date {
  const end = new Date(now.getTime() + hours * 3600000);
  if (!validEnd(now.getTime(), end.getTime())) throw new Error('invalidEnd');
  return end;
}
export function validEnd(now: number, end: number): boolean {
  return Number.isFinite(end) && end > now && end - now <= MAX_GUARD_MS;
}
