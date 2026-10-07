export function todayKey(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function sessionDurationMs(
  startAt: string,
  endAt: string | null,
  now: number = Date.now(),
): number {
  const start = new Date(startAt).getTime();
  const end = endAt ? new Date(endAt).getTime() : now;
  return Math.max(0, end - start);
}
