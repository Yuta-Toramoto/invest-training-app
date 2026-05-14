import type { MarketDataSource } from './MarketDataSource';
import type { Candle, Timeframe } from './types';

export type MockFixtures = {
  candles: Partial<Record<string, Partial<Record<Timeframe, Candle[]>>>>;
};

export class MockMarketSource implements MarketDataSource {
  constructor(private fixtures: MockFixtures) {}

  async getCandles(
    symbol: string,
    timeframe: Timeframe,
    from: number,
    to: number,
  ): Promise<Candle[]> {
    const bySymbol = this.fixtures.candles[symbol];
    if (!bySymbol) {
      throw new RangeError(`No fixture data for symbol: ${symbol}`);
    }

    const candles = bySymbol[timeframe] ?? [];
    return candles.filter((c) => c.timestamp >= from && c.timestamp <= to);
  }
}
