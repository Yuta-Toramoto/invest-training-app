import type { Candle, MovingAverage } from './types';

export function calculateMA(candles: Candle[], period: number): MovingAverage {
  if (period <= 0 || !Number.isInteger(period)) {
    throw new RangeError(`period must be a positive integer, got ${period}`);
  }

  const values: { timestamp: number; value: number }[] = [];

  for (let i = period - 1; i < candles.length; i++) {
    let sum = 0;
    for (let j = i - (period - 1); j <= i; j++) {
      sum += candles[j]!.close;
    }
    values.push({
      timestamp: candles[i]!.timestamp,
      value: Math.round((sum / period) * 100) / 100,
    });
  }

  return { period, values };
}
