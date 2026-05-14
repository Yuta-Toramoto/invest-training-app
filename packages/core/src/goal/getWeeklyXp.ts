export type WeeklyXpInput = {
  attempts: { xpEarned: number; answeredAt: Date }[];
  now: Date;
  tzOffsetMinutes: number;
};

function toLocalDateStr(utcDate: Date, tzOffsetMinutes: number): string {
  const localMs = utcDate.getTime() - tzOffsetMinutes * 60 * 1000;
  return new Date(localMs).toISOString().slice(0, 10);
}

function getMondayOfWeek(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00Z');
  const day = d.getUTCDay(); // 0=Sun, 1=Mon, ..., 6=Sat
  const diff = day === 0 ? -6 : 1 - day; // shift to Monday
  d.setUTCDate(d.getUTCDate() + diff);
  return d.toISOString().slice(0, 10);
}

export function getWeeklyXp(input: WeeklyXpInput): number {
  const { attempts, now, tzOffsetMinutes } = input;

  const nowStr = toLocalDateStr(now, tzOffsetMinutes);
  const weekStart = getMondayOfWeek(nowStr);

  let total = 0;
  for (const a of attempts) {
    const dayStr = toLocalDateStr(a.answeredAt, tzOffsetMinutes);
    if (dayStr >= weekStart && dayStr <= nowStr) {
      total += a.xpEarned;
    }
  }
  return total;
}
