import { describe, expect, it } from 'vitest';
import { checkGoalProgress } from './checkGoalProgress';

describe('checkGoalProgress', () => {
  it('returns 0% when no XP earned', () => {
    const result = checkGoalProgress({ earnedXp: 0, goalXp: 100 });
    expect(result).toEqual({ progressPercent: 0, isAchieved: false });
  });

  it('returns 50% at halfway', () => {
    const result = checkGoalProgress({ earnedXp: 50, goalXp: 100 });
    expect(result).toEqual({ progressPercent: 50, isAchieved: false });
  });

  it('returns 100% and isAchieved when exactly at goal', () => {
    const result = checkGoalProgress({ earnedXp: 100, goalXp: 100 });
    expect(result).toEqual({ progressPercent: 100, isAchieved: true });
  });

  it('clamps progressPercent to 100 when exceeding goal', () => {
    const result = checkGoalProgress({ earnedXp: 150, goalXp: 100 });
    expect(result).toEqual({ progressPercent: 100, isAchieved: true });
  });

  it('floors progressPercent (no decimals)', () => {
    const result = checkGoalProgress({ earnedXp: 33, goalXp: 100 });
    expect(result.progressPercent).toBe(33);
  });

  it('handles goalXp of 50', () => {
    const result = checkGoalProgress({ earnedXp: 25, goalXp: 50 });
    expect(result).toEqual({ progressPercent: 50, isAchieved: false });
  });

  it('throws RangeError when goalXp is 0', () => {
    expect(() => checkGoalProgress({ earnedXp: 0, goalXp: 0 })).toThrow(RangeError);
  });

  it('throws RangeError when goalXp is negative', () => {
    expect(() => checkGoalProgress({ earnedXp: 0, goalXp: -1 })).toThrow(RangeError);
  });

  it('throws RangeError when earnedXp is negative', () => {
    expect(() => checkGoalProgress({ earnedXp: -1, goalXp: 100 })).toThrow(RangeError);
  });
});
