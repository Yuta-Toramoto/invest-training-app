export type StreakInput = {
  currentStreak: number;
  lastActiveAt: Date | null;
  now: Date;
  tzOffsetMinutes: number;
};

export type StreakResult = {
  newStreak: number;
  streakUpdated: boolean;
};

function toLocalDateStr(utcDate: Date, tzOffsetMinutes: number): string {
  const localMs = utcDate.getTime() - tzOffsetMinutes * 60 * 1000;
  const localDate = new Date(localMs);
  return localDate.toISOString().slice(0, 10);
}

export function updateStreak(input: StreakInput): StreakResult {
  const { currentStreak, lastActiveAt, now, tzOffsetMinutes } = input;

  if (currentStreak < 0) {
    throw new RangeError(`currentStreak must be non-negative, got ${currentStreak}`);
  }

  if (lastActiveAt === null) {
    return { newStreak: 1, streakUpdated: true };
  }

  const todayStr = toLocalDateStr(now, tzOffsetMinutes);
  const lastStr = toLocalDateStr(lastActiveAt, tzOffsetMinutes);

  if (lastStr === todayStr) {
    return { newStreak: currentStreak, streakUpdated: false };
  }

  const todayDate = new Date(todayStr);
  const lastDate = new Date(lastStr);
  const diffDays = Math.round((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 1) {
    return { newStreak: currentStreak + 1, streakUpdated: true };
  }

  return { newStreak: 1, streakUpdated: true };
}
