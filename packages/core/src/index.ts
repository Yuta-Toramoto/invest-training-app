export { calculateXp } from './xp/calculateXp';
export type { XpInput, XpResult } from './xp/calculateXp';

export { updateStreak } from './streak/updateStreak';
export type { StreakInput, StreakResult } from './streak/updateStreak';

export { selectNextQuestion } from './srs/selectNextQuestion';
export type { QuestionStats } from './srs/selectNextQuestion';

export type { MarketDataSource } from './market/MarketDataSource';
export type { Candle, Timeframe, MovingAverage, MockOrderBook } from './market/types';
export { calculateMA } from './market/calculateMA';
export { MockMarketSource } from './market/MockMarketSource';
export type { MockFixtures } from './market/MockMarketSource';
export { ORDER_BOOK_PATTERNS } from './market/orderBookPatterns';

export { checkGoalProgress } from './goal/checkGoalProgress';
export type { GoalProgressInput, GoalProgressResult } from './goal/checkGoalProgress';

export { getWeeklyXp } from './goal/getWeeklyXp';
export type { WeeklyXpInput } from './goal/getWeeklyXp';
