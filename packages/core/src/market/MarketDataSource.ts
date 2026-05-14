import type { Candle, Timeframe } from './types';

export interface MarketDataSource {
  getCandles(symbol: string, timeframe: Timeframe, from: number, to: number): Promise<Candle[]>;
}
