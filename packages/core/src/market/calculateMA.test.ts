import { describe, expect, it } from 'vitest';
import { calculateMA } from './calculateMA';
import type { Candle } from './types';

function makeCandle(close: number, i: number): Candle {
  return { timestamp: i * 300_000, open: close, high: close, low: close, close, volume: 1000 };
}

const candles: Candle[] = [100, 102, 104, 106, 108, 110, 112].map(makeCandle);

describe('calculateMA', () => {
  it('calculates 3-period MA correctly', () => {
    const ma = calculateMA(candles, 3);
    expect(ma.period).toBe(3);
    expect(ma.values).toHaveLength(5); // 7 - 3 + 1
    expect(ma.values[0]!.value).toBeCloseTo((100 + 102 + 104) / 3);
    expect(ma.values[4]!.value).toBeCloseTo((108 + 110 + 112) / 3);
  });

  it('returns empty values when period > candles length', () => {
    const ma = calculateMA(candles.slice(0, 2), 5);
    expect(ma.values).toHaveLength(0);
  });

  it('returns single value when period equals candles length', () => {
    const ma = calculateMA(candles, 7);
    expect(ma.values).toHaveLength(1);
    expect(ma.values[0]!.value).toBeCloseTo((100 + 102 + 104 + 106 + 108 + 110 + 112) / 7);
  });

  it('returns empty values for empty candles array', () => {
    const ma = calculateMA([], 5);
    expect(ma.values).toHaveLength(0);
  });

  it('throws RangeError for period 0', () => {
    expect(() => calculateMA(candles, 0)).toThrow(RangeError);
  });

  it('throws RangeError for negative period', () => {
    expect(() => calculateMA(candles, -1)).toThrow(RangeError);
  });

  it('timestamps match the last candle in each window', () => {
    const ma = calculateMA(candles, 3);
    expect(ma.values[0]!.timestamp).toBe(candles[2]!.timestamp);
    expect(ma.values[1]!.timestamp).toBe(candles[3]!.timestamp);
  });
});
