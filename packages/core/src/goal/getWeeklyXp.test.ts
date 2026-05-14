import { describe, expect, it } from 'vitest';
import { getWeeklyXp } from './getWeeklyXp';

// JST (UTC+9) → tzOffsetMinutes = -540
const JST = -540;

// 2026-05-11 (Mon)〜 2026-05-17 (Sun) の週を使ってテスト
// now = 2026-05-14 (Thu) JST

function jst(dateStr: string): Date {
  // JST の YYYY-MM-DD 12:00 を UTC に変換
  return new Date(dateStr + 'T03:00:00Z'); // JST 12:00 = UTC 03:00
}

describe('getWeeklyXp', () => {
  it('returns 0 when no attempts', () => {
    const result = getWeeklyXp({ attempts: [], now: jst('2026-05-14'), tzOffsetMinutes: JST });
    expect(result).toBe(0);
  });

  it('sums xpEarned for attempts in the current week', () => {
    const attempts = [
      { xpEarned: 30, answeredAt: jst('2026-05-11') }, // Mon
      { xpEarned: 20, answeredAt: jst('2026-05-13') }, // Wed
      { xpEarned: 10, answeredAt: jst('2026-05-14') }, // Thu (today)
    ];
    const result = getWeeklyXp({ attempts, now: jst('2026-05-14'), tzOffsetMinutes: JST });
    expect(result).toBe(60);
  });

  it('excludes attempts from the previous week', () => {
    const attempts = [
      { xpEarned: 50, answeredAt: jst('2026-05-10') }, // Sun (prev week)
      { xpEarned: 20, answeredAt: jst('2026-05-11') }, // Mon (this week)
    ];
    const result = getWeeklyXp({ attempts, now: jst('2026-05-14'), tzOffsetMinutes: JST });
    expect(result).toBe(20);
  });

  it('excludes attempts from the next week', () => {
    const attempts = [
      { xpEarned: 30, answeredAt: jst('2026-05-14') }, // Thu (this week)
      { xpEarned: 50, answeredAt: jst('2026-05-18') }, // Mon (next week)
    ];
    const result = getWeeklyXp({ attempts, now: jst('2026-05-14'), tzOffsetMinutes: JST });
    expect(result).toBe(30);
  });

  it('includes Monday (week start) itself', () => {
    const attempts = [{ xpEarned: 40, answeredAt: jst('2026-05-11') }]; // Mon
    const result = getWeeklyXp({ attempts, now: jst('2026-05-11'), tzOffsetMinutes: JST });
    expect(result).toBe(40);
  });

  it('includes Sunday (week end) itself', () => {
    const attempts = [{ xpEarned: 40, answeredAt: jst('2026-05-17') }]; // Sun
    const result = getWeeklyXp({ attempts, now: jst('2026-05-17'), tzOffsetMinutes: JST });
    expect(result).toBe(40);
  });

  it('handles attempt with xpEarned = 0 (incorrect answer)', () => {
    const attempts = [
      { xpEarned: 0, answeredAt: jst('2026-05-14') },
      { xpEarned: 20, answeredAt: jst('2026-05-14') },
    ];
    const result = getWeeklyXp({ attempts, now: jst('2026-05-14'), tzOffsetMinutes: JST });
    expect(result).toBe(20);
  });
});
