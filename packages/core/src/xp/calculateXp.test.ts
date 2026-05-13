import { describe, expect, it } from 'vitest';
import { calculateXp } from './calculateXp';

describe('calculateXp', () => {
  describe('不正解', () => {
    it('不正解は XP 0', () => {
      expect(calculateXp({ isCorrect: false, difficulty: 3, timeTakenMs: 3000 })).toEqual({
        base: 0,
        speedBonus: 0,
        total: 0,
      });
    });
  });

  describe('正解・基本 XP', () => {
    it('difficulty 1 → base 10', () => {
      const r = calculateXp({ isCorrect: true, difficulty: 1, timeTakenMs: 30000 });
      expect(r.base).toBe(10);
      expect(r.speedBonus).toBe(0);
      expect(r.total).toBe(10);
    });

    it('difficulty 5 → base 50', () => {
      const r = calculateXp({ isCorrect: true, difficulty: 5, timeTakenMs: 30000 });
      expect(r.base).toBe(50);
      expect(r.total).toBe(50);
    });
  });

  describe('速さボーナス', () => {
    it('5秒以内 → +10', () => {
      const r = calculateXp({ isCorrect: true, difficulty: 3, timeTakenMs: 4999 });
      expect(r.speedBonus).toBe(10);
      expect(r.total).toBe(40);
    });

    it('ちょうど5秒 → +10', () => {
      const r = calculateXp({ isCorrect: true, difficulty: 3, timeTakenMs: 5000 });
      expect(r.speedBonus).toBe(10);
    });

    it('5秒超 10秒以内 → +5', () => {
      const r = calculateXp({ isCorrect: true, difficulty: 3, timeTakenMs: 7000 });
      expect(r.speedBonus).toBe(5);
      expect(r.total).toBe(35);
    });

    it('ちょうど10秒 → +5', () => {
      const r = calculateXp({ isCorrect: true, difficulty: 3, timeTakenMs: 10000 });
      expect(r.speedBonus).toBe(5);
    });

    it('10秒超 → ボーナスなし', () => {
      const r = calculateXp({ isCorrect: true, difficulty: 3, timeTakenMs: 10001 });
      expect(r.speedBonus).toBe(0);
    });
  });

  describe('エッジケース', () => {
    it('difficulty 0 → エラー', () => {
      expect(() => calculateXp({ isCorrect: true, difficulty: 0, timeTakenMs: 1000 })).toThrow();
    });

    it('difficulty 6 → エラー', () => {
      expect(() => calculateXp({ isCorrect: true, difficulty: 6, timeTakenMs: 1000 })).toThrow();
    });

    it('timeTakenMs 負数 → エラー', () => {
      expect(() => calculateXp({ isCorrect: true, difficulty: 3, timeTakenMs: -1 })).toThrow();
    });
  });
});
