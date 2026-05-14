export type Timeframe = '5m' | '1m';

export type Candle = {
  timestamp: number; // Unix ms (UTC)
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

export type MovingAverage = {
  period: number;
  values: { timestamp: number; value: number }[];
};

export type MockOrderBook = {
  patternName: string;
  description: string;
  bids: { price: number; size: number }[];
  asks: { price: number; size: number }[];
};
