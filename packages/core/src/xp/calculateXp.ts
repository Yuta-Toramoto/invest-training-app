export type XpInput = {
  isCorrect: boolean;
  difficulty: number;
  timeTakenMs: number;
};

export type XpResult = {
  base: number;
  speedBonus: number;
  total: number;
};

export function calculateXp(input: XpInput): XpResult {
  const { isCorrect, difficulty, timeTakenMs } = input;

  if (difficulty < 1 || difficulty > 5 || !Number.isInteger(difficulty)) {
    throw new RangeError(`difficulty must be an integer between 1 and 5, got ${difficulty}`);
  }
  if (timeTakenMs < 0) {
    throw new RangeError(`timeTakenMs must be non-negative, got ${timeTakenMs}`);
  }

  if (!isCorrect) {
    return { base: 0, speedBonus: 0, total: 0 };
  }

  const base = difficulty * 10;
  const speedBonus = timeTakenMs <= 5000 ? 10 : timeTakenMs <= 10000 ? 5 : 0;

  return { base, speedBonus, total: base + speedBonus };
}
