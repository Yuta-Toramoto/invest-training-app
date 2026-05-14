import { describe, expect, it } from 'vitest';
import { MockMarketSource } from './MockMarketSource';
import type { Candle } from './types';

function candle(ts: number, close: number): Candle {
  return { timestamp: ts, open: close, high: close + 5, low: close - 5, close, volume: 1000 };
}

const fixtures = {
  candles: {
    '7203.T': {
      '5m': [
        candle(1_000_000, 1800),
        candle(1_300_000, 1810),
        candle(1_600_000, 1820),
        candle(1_900_000, 1815),
      ],
    },
  },
};

const source = new MockMarketSource(fixtures);

describe('MockMarketSource', () => {
  it('returns candles within the specified range', async () => {
    const result = await source.getCandles('7203.T', '5m', 1_000_000, 1_600_000);
    expect(result).toHaveLength(3);
    expect(result[0]!.timestamp).toBe(1_000_000);
    expect(result[2]!.timestamp).toBe(1_600_000);
  });

  it('excludes candles outside the range', async () => {
    const result = await source.getCandles('7203.T', '5m', 1_300_000, 1_600_000);
    expect(result).toHaveLength(2);
  });

  it('returns empty array when no candles match the range', async () => {
    const result = await source.getCandles('7203.T', '5m', 9_000_000, 9_999_999);
    expect(result).toHaveLength(0);
  });

  it('throws RangeError for unknown symbol', async () => {
    await expect(source.getCandles('9999.T', '5m', 0, 9_999_999)).rejects.toThrow(RangeError);
  });

  it('returns empty array for timeframe with no fixture data', async () => {
    const result = await source.getCandles('7203.T', '1m', 0, 9_999_999);
    expect(result).toHaveLength(0);
  });

  it('MockMarketSource satisfies MarketDataSource interface', () => {
    // 型レベルの確認: MarketDataSource に代入できれば型エラーなし
    const _: import('./MarketDataSource').MarketDataSource = source;
    expect(source).toBeDefined();
  });
});
