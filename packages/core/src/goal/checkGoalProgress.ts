export type GoalProgressInput = {
  earnedXp: number;
  goalXp: number;
};

export type GoalProgressResult = {
  progressPercent: number;
  isAchieved: boolean;
};

export function checkGoalProgress(input: GoalProgressInput): GoalProgressResult {
  const { earnedXp, goalXp } = input;

  if (goalXp <= 0) {
    throw new RangeError(`goalXp must be positive, got ${goalXp}`);
  }
  if (earnedXp < 0) {
    throw new RangeError(`earnedXp must be non-negative, got ${earnedXp}`);
  }

  const isAchieved = earnedXp >= goalXp;
  const progressPercent = Math.min(100, Math.floor((earnedXp / goalXp) * 100));

  return { progressPercent, isAchieved };
}
