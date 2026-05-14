import type { Candle, Timeframe } from '@invest-training/core';

type YahooFinanceResponse = {
  chart: {
    result: {
      timestamp: number[];
      indicators: {
        quote: {
          open: (number | null)[];
          high: (number | null)[];
          low: (number | null)[];
          close: (number | null)[];
          volume: (number | null)[];
        }[];
      };
    }[];
    error: unknown;
  };
};

export async function fetchCandles(
  symbol: string,
  timeframe: Timeframe,
  from: Date,
  to: Date,
): Promise<Candle[]> {
  const period1 = Math.floor(from.getTime() / 1000);
  const period2 = Math.floor(to.getTime() / 1000);

  const url =
    `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}` +
    `?interval=${timeframe}&period1=${period1}&period2=${period2}`;

  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; invest-training-app/1.0)',
    },
    next: { revalidate: 0 },
  });

  if (!res.ok) {
    throw new Error(`Yahoo Finance API error: ${res.status} ${res.statusText}`);
  }

  const json = (await res.json()) as YahooFinanceResponse;

  if (json.chart.error || !json.chart.result?.[0]) {
    throw new Error(`Yahoo Finance returned no data for ${symbol}`);
  }

  const result = json.chart.result[0];
  const { timestamp: timestamps, indicators } = result;
  const quote = indicators.quote[0];

  if (!quote || !timestamps) {
    throw new Error(`Invalid data structure for ${symbol}`);
  }

  const candles: Candle[] = [];
  for (let i = 0; i < timestamps.length; i++) {
    const o = quote.open[i];
    const h = quote.high[i];
    const l = quote.low[i];
    const c = quote.close[i];
    const v = quote.volume[i];
    if (o == null || h == null || l == null || c == null || v == null) continue;
    candles.push({
      timestamp: timestamps[i]! * 1000,
      open: Math.round(o * 100) / 100,
      high: Math.round(h * 100) / 100,
      low: Math.round(l * 100) / 100,
      close: Math.round(c * 100) / 100,
      volume: Math.round(v),
    });
  }

  return candles;
}
