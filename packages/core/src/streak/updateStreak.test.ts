import { describe, expect, it } from 'vitest';
import { updateStreak } from './updateStreak';

const JST = -540; // UTC+9

function utc(dateStr: string): Date {
  return new Date(dateStr + 'T00:00:00Z');
}

describe('updateStreak', () => {
  describe('初回アクセス', () => {
    it('lastActiveAt が null → streak 1', () => {
      const result = updateStreak({
        currentStreak: 0,
        lastActiveAt: null,
        now: utc('2026-05-13'),
        tzOffsetMinutes: JST,
      });
      expect(result).toEqual({ newStreak: 1, streakUpdated: true });
    });
  });

  describe('ストリーク継続', () => {
    it('JST で前日にアクセス済み → streak +1', () => {
      // lastActiveAt: 2026-05-12 23:00 UTC = JST 2026-05-13 08:00 → ローカル日付は5/13
      // now: 2026-05-13 15:00 UTC = JST 2026-05-14 00:00 → ローカル日付は5/14
      const result = updateStreak({
        currentStreak: 3,
        lastActiveAt: new Date('2026-05-12T23:00:00Z'),
        now: new Date('2026-05-13T15:00:00Z'),
        tzOffsetMinutes: JST,
      });
      expect(result).toEqual({ newStreak: 4, streakUpdated: true });
    });
  });

  describe('今日すでに学習済み', () => {
    it('同じローカル日付 → streak 変化なし', () => {
      const result = updateStreak({
        currentStreak: 5,
        lastActiveAt: new Date('2026-05-13T01:00:00Z'),
        now: new Date('2026-05-13T10:00:00Z'),
        tzOffsetMinutes: JST,
      });
      expect(result).toEqual({ newStreak: 5, streakUpdated: false });
    });
  });

  describe('ストリークリセット', () => {
    it('2日以上空いた → streak 1', () => {
      const result = updateStreak({
        currentStreak: 10,
        lastActiveAt: utc('2026-05-10'),
        now: utc('2026-05-13'),
        tzOffsetMinutes: 0,
      });
      expect(result).toEqual({ newStreak: 1, streakUpdated: true });
    });
  });

  describe('エッジケース', () => {
    it('currentStreak 負数 → エラー', () => {
      expect(() =>
        updateStreak({
          currentStreak: -1,
          lastActiveAt: null,
          now: utc('2026-05-13'),
          tzOffsetMinutes: 0,
        }),
      ).toThrow();
    });
  });
});
