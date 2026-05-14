/**
 * 問題自動生成スクリプト
 *
 * 使い方:
 *   pnpm tsx scripts/generateQuestions.ts [銘柄数] [時間足]
 *
 * 例:
 *   pnpm tsx scripts/generateQuestions.ts 10 5m
 *
 * 出力: 標準出力に JSON 形式の分析結果を表示
 *   → Claude Code がこの出力をもとに解説文を書き、Supabase MCP で INSERT する
 */

// ─── 型定義 ───────────────────────────────────────────────────────────────────

type Timeframe = '5m' | '1m';

type Candle = {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

type MovingAverage = {
  period: number;
  values: { timestamp: number; value: number }[];
};

type Scenario = {
  symbol: string;
  name: string;
  sector: string;
  endDatetime: string; // ISO 8601
  timeframe: Timeframe;
  orderBookPattern: string;
  unitId: string;
  difficulty: number;
  tags: string[];
};

// ─── 銘柄マスタ（多様な銘柄を網羅） ─────────────────────────────────────────

const STOCKS = [
  { symbol: '7203.T', name: 'トヨタ自動車', sector: '自動車' },
  { symbol: '9984.T', name: 'ソフトバンクグループ', sector: 'IT・通信' },
  { symbol: '6758.T', name: 'ソニーグループ', sector: '電機' },
  { symbol: '9983.T', name: 'ファーストリテイリング', sector: '小売' },
  { symbol: '7974.T', name: '任天堂', sector: 'ゲーム' },
  { symbol: '6861.T', name: 'キーエンス', sector: '精密機器' },
  { symbol: '8306.T', name: '三菱UFJ FG', sector: '銀行' },
  { symbol: '1570.T', name: '日経レバETF', sector: 'ETF' },
  { symbol: '4519.T', name: '中外製薬', sector: '医薬品' },
  { symbol: '6098.T', name: 'リクルートHD', sector: 'サービス' },
  { symbol: '9432.T', name: '日本電信電話', sector: '通信' },
  { symbol: '6367.T', name: 'ダイキン工業', sector: '機械' },
  { symbol: '8035.T', name: '東京エレクトロン', sector: '半導体' },
  { symbol: '6954.T', name: 'FANUC', sector: 'ロボット' },
  { symbol: '4063.T', name: '信越化学', sector: '化学' },
];

const ORDER_BOOK_PATTERNS = ['標準', '本尊押し', '環境増し', '薄板（流動性低）'];

// デフォルトのユニットID（既存のテストデータ）
const DEFAULT_UNIT_ID = 'bbbbbbbb-0000-0000-0000-000000000001';

// ─── ヘルパー関数 ─────────────────────────────────────────────────────────────

function calcMA(candles: Candle[], period: number): MovingAverage {
  const values: { timestamp: number; value: number }[] = [];
  for (let i = period - 1; i < candles.length; i++) {
    let sum = 0;
    for (let j = i - (period - 1); j <= i; j++) sum += candles[j]!.close;
    values.push({
      timestamp: candles[i]!.timestamp,
      value: Math.round((sum / period) * 100) / 100,
    });
  }
  return { period, values };
}

async function fetchCandles(
  symbol: string,
  timeframe: Timeframe,
  from: Date,
  to: Date,
): Promise<Candle[]> {
  const p1 = Math.floor(from.getTime() / 1000);
  const p2 = Math.floor(to.getTime() / 1000);
  const url =
    `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}` +
    `?interval=${timeframe}&period1=${p1}&period2=${p2}`;

  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; invest-training/1.0)' },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${symbol}`);

  const json = (await res.json()) as {
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
    };
  };

  const result = json.chart.result?.[0];
  if (!result) throw new Error(`No data for ${symbol}`);

  const { timestamp: timestamps, indicators } = result;
  const quote = indicators.quote[0];
  if (!quote) throw new Error(`No quote data for ${symbol}`);
  const candles: Candle[] = [];
  for (let i = 0; i < timestamps.length; i++) {
    const o = quote.open[i],
      h = quote.high[i],
      l = quote.low[i],
      c = quote.close[i],
      v = quote.volume[i];
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

function generateChartSvg(candles: Candle[], mas: MovingAverage[], symbol: string): string {
  if (candles.length === 0)
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 480"><text x="320" y="240" text-anchor="middle" fill="#888">データなし</text></svg>`;

  const W = 640,
    H = 480,
    PL = 60,
    PR = 12,
    PT = 12,
    CHART_H = 340,
    VOL_TOP = 368,
    VOL_H = 88,
    CW = 5;
  const prices = candles.flatMap((c) => [c.high, c.low]);
  const pMin = Math.min(...prices) * 0.998;
  const pMax = Math.max(...prices) * 1.002;
  const maxVol = Math.max(...candles.map((c) => c.volume));
  const scaleY = (v: number) => PT + ((pMax - v) / (pMax - pMin)) * CHART_H;
  const scaleX = (i: number) => PL + (i + 0.5) * ((W - PL - PR) / candles.length);

  const parts: string[] = [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" style="background:#1a1a2e;font-family:monospace">`,
    ...[0, 0.25, 0.5, 0.75, 1].map((t) => {
      const y = Math.round(PT + t * CHART_H);
      const p = pMax - t * (pMax - pMin);
      return `<line x1="${PL}" y1="${y}" x2="${W - PR}" y2="${y}" stroke="#2a2a4a" stroke-width="1"/><text x="${PL - 4}" y="${y + 4}" fill="#888" font-size="10" text-anchor="end">${p.toFixed(0)}</text>`;
    }),
    `<text x="${PL}" y="10" fill="#aaa" font-size="11">${symbol}</text>`,
    ...candles.map((c, i) => {
      const x = scaleX(i),
        yO = scaleY(c.open),
        yC = scaleY(c.close),
        yH = scaleY(c.high),
        yL = scaleY(c.low);
      const bull = c.close >= c.open,
        col = bull ? '#26a69a' : '#ef5350';
      const bTop = Math.min(yO, yC),
        bH = Math.max(Math.abs(yC - yO), 1);
      return `<line x1="${x}" y1="${yH}" x2="${x}" y2="${yL}" stroke="${col}" stroke-width="1"/><rect x="${x - CW / 2}" y="${bTop}" width="${CW}" height="${bH}" fill="${col}"/>`;
    }),
    ...mas.map((ma) => {
      if (ma.values.length < 2) return '';
      const cols: Record<number, string> = { 5: '#ffc800', 25: '#1cb0f6', 75: '#ff9600' };
      const col = cols[ma.period] ?? '#fff';
      const offset = candles.length - ma.values.length;
      const pts = ma.values.map((v, idx) => `${scaleX(offset + idx)},${scaleY(v.value)}`).join(' ');
      const last = ma.values.at(-1)!;
      return `<polyline points="${pts}" fill="none" stroke="${col}" stroke-width="1.5" opacity="0.9"/><text x="${W - PR - 2}" y="${scaleY(last.value)}" fill="${col}" font-size="9" text-anchor="end">${ma.period}MA</text>`;
    }),
    `<line x1="${PL}" y1="${VOL_TOP - 4}" x2="${W - PR}" y2="${VOL_TOP - 4}" stroke="#2a2a4a" stroke-width="1"/>`,
    ...candles.map((c, i) => {
      const x = scaleX(i),
        bH = maxVol > 0 ? (c.volume / maxVol) * VOL_H : 0;
      const col = c.close >= c.open ? '#26a69a' : '#ef5350';
      return `<rect x="${x - CW / 2}" y="${VOL_TOP + VOL_H - bH}" width="${CW}" height="${bH}" fill="${col}" opacity="0.7"/>`;
    }),
    '</svg>',
  ];
  return parts.join('');
}

function generateOrderBookSvg(patternName: string, basePrice: number): string {
  const patterns: Record<string, { bids: number[]; asks: number[] }> = {
    標準: { asks: [3000, 2000, 1500, 2500, 1800], bids: [2000, 1500, 3000, 2200, 1800] },
    本尊押し: { asks: [15000, 12000, 8000, 5000, 3000], bids: [1500, 1200, 1000, 800, 600] },
    環境増し: { asks: [1200, 900, 800, 700, 600], bids: [8000, 12000, 15000, 10000, 7000] },
    '薄板（流動性低）': { asks: [300, 200, 150, 200, 100], bids: [200, 150, 300, 100, 200] },
  };
  const p = patterns[patternName] ?? patterns['標準']!;
  const maxS = Math.max(...p.asks, ...p.bids);
  const W = 320,
    H = 400,
    ROW_H = 32,
    LC = 160;
  const startY = (H - 11 * ROW_H) / 2;
  const rows: string[] = [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" style="background:#1a1a2e;font-family:monospace">`,
    `<rect x="0" y="0" width="${W}" height="28" fill="#111130"/>`,
    `<text x="${LC / 2}" y="18" fill="#aaa" font-size="11" text-anchor="middle">価格</text>`,
    `<text x="${LC + 80}" y="18" fill="#aaa" font-size="11" text-anchor="middle">数量</text>`,
  ];
  [...p.asks].reverse().forEach((size, i) => {
    const price = basePrice + (5 - i);
    const y = startY + i * ROW_H;
    const bW = (size / maxS) * (W - 10);
    rows.push(
      `<rect x="0" y="${y}" width="${bW}" height="${ROW_H - 1}" fill="#ef5350" opacity="0.15"/>`,
      `<text x="${LC - 8}" y="${y + ROW_H / 2 + 4}" fill="#ef5350" font-size="12" text-anchor="end">${price.toLocaleString()}</text>`,
      `<text x="${LC + 8}" y="${y + ROW_H / 2 + 4}" fill="#ef5350" font-size="12">${size.toLocaleString()}</text>`,
    );
  });
  const midY = startY + 5 * ROW_H;
  rows.push(
    `<rect x="0" y="${midY}" width="${W}" height="${ROW_H}" fill="#2a2a4a"/>`,
    `<text x="${W / 2}" y="${midY + ROW_H / 2 + 5}" fill="#ffc800" font-size="14" font-weight="bold" text-anchor="middle">▶ ${basePrice.toLocaleString()}</text>`,
  );
  p.bids.forEach((size, i) => {
    const price = basePrice - (i + 1);
    const y = midY + ROW_H + i * ROW_H;
    const bW = (size / maxS) * (W - 10);
    rows.push(
      `<rect x="0" y="${y}" width="${bW}" height="${ROW_H - 1}" fill="#26a69a" opacity="0.15"/>`,
      `<text x="${LC - 8}" y="${y + ROW_H / 2 + 4}" fill="#26a69a" font-size="12" text-anchor="end">${price.toLocaleString()}</text>`,
      `<text x="${LC + 8}" y="${y + ROW_H / 2 + 4}" fill="#26a69a" font-size="12">${size.toLocaleString()}</text>`,
    );
  });
  rows.push(
    `<rect x="0" y="${H - 24}" width="${W}" height="24" fill="#111130"/>`,
    `<text x="${W / 2}" y="${H - 8}" fill="#888" font-size="10" text-anchor="middle">板: ${patternName}</text>`,
    '</svg>',
  );
  return rows.join('');
}

// ─── 祝日リスト（2026年 日本） ─────────────────────────────────────────────────

const JP_HOLIDAYS_2026 = new Set([
  '2026-01-01',
  '2026-01-12',
  '2026-02-11',
  '2026-02-23',
  '2026-03-20',
  '2026-04-29',
  '2026-05-03',
  '2026-05-04',
  '2026-05-05',
  '2026-05-06',
  '2026-07-20',
  '2026-08-11',
  '2026-09-21',
  '2026-09-22',
  '2026-09-23',
  '2026-10-12',
  '2026-11-03',
  '2026-11-23',
  '2026-12-23',
]);

function isHoliday(date: Date): boolean {
  const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  return JP_HOLIDAYS_2026.has(key) || date.getDay() === 0 || date.getDay() === 6;
}

// ─── シナリオ生成 ─────────────────────────────────────────────────────────────

function buildScenarios(count: number, timeframe: Timeframe, unitId: string): Scenario[] {
  const now = new Date();
  const times = ['11:00', '11:30', '13:00', '13:30', '14:00', '14:30', '13:00', '11:00'];
  const scenarios: Scenario[] = [];
  let dayOffset = 5;

  for (let i = 0; i < count * 3 && scenarios.length < count; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() - dayOffset);
    // 週末・祝日をスキップ
    while (isHoliday(date)) {
      dayOffset++;
      date.setDate(date.getDate() - 1);
    }

    const stock = STOCKS[i % STOCKS.length]!;
    const time = times[i % times.length]!;
    const pattern = ORDER_BOOK_PATTERNS[i % ORDER_BOOK_PATTERNS.length]!;

    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');

    scenarios.push({
      symbol: stock.symbol,
      name: stock.name,
      sector: stock.sector,
      endDatetime: `${yyyy}-${mm}-${dd}T${time}:00`,
      timeframe,
      orderBookPattern: pattern,
      unitId,
      difficulty: (i % 3) + 2, // 2〜4 でばらつかせる
      tags: [stock.sector, timeframe === '5m' ? '5分足' : '1分足'],
    });

    dayOffset += 1;
  }

  return scenarios;
}

// ─── 分析実行 ─────────────────────────────────────────────────────────────────

type AnalysisResult = {
  scenario: Scenario;
  status: 'ok' | 'error';
  errorMessage?: string;
  endPrice?: number;
  priceChangePct?: number;
  suggestedAnswer?: 'a' | 'b' | 'c';
  ma5Last?: number;
  ma25Last?: number;
  ma75Last?: number;
  displayCandleCount?: number;
  chartSvgDataUri?: string;
  orderBookSvgDataUri?: string;
};

async function analyzeScenario(scenario: Scenario): Promise<AnalysisResult> {
  const DISPLAY = scenario.timeframe === '5m' ? 78 : 60;
  const RESULT = scenario.timeframe === '5m' ? 6 : 30;
  const intervalMs = scenario.timeframe === '5m' ? 5 * 60 * 1000 : 60 * 1000;

  const endDatetime = new Date(scenario.endDatetime);
  const from = new Date(endDatetime.getTime() - (DISPLAY - 1) * intervalMs);
  const to = new Date(endDatetime.getTime() + RESULT * intervalMs);

  try {
    let all: Candle[];
    try {
      all = await fetchCandles(scenario.symbol, scenario.timeframe, from, to);
    } catch (fetchErr) {
      return { scenario, status: 'error', errorMessage: `取得失敗: ${String(fetchErr)}` };
    }
    const endTs = endDatetime.getTime();
    const display = all.filter((c) => c.timestamp <= endTs).slice(-DISPLAY);
    const result = all.filter((c) => c.timestamp > endTs).slice(0, RESULT);

    if (display.length < 5) {
      return { scenario, status: 'error', errorMessage: `データ不足: ${display.length}本のみ取得` };
    }

    const ma5 = calcMA(display, 5);
    const ma25 = calcMA(display, 25);
    const ma75 = calcMA(display, 75);
    const endPrice = display.at(-1)!.close;

    let priceChangePct = 0;
    let suggestedAnswer: 'a' | 'b' | 'c' = 'c';
    if (result.length > 0) {
      priceChangePct = ((result.at(-1)!.close - endPrice) / endPrice) * 100;
      if (priceChangePct >= 0.5) suggestedAnswer = 'a';
      else if (priceChangePct <= -0.5) suggestedAnswer = 'b';
    }

    const chartSvg = generateChartSvg(display, [ma5, ma25, ma75], scenario.symbol);
    const obSvg = generateOrderBookSvg(scenario.orderBookPattern, Math.round(endPrice));

    return {
      scenario,
      status: 'ok',
      endPrice,
      priceChangePct: Math.round(priceChangePct * 100) / 100,
      suggestedAnswer,
      ma5Last: ma5.values.at(-1)?.value,
      ma25Last: ma25.values.at(-1)?.value,
      ma75Last: ma75.values.at(-1)?.value,
      displayCandleCount: display.length,
      chartSvgDataUri: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(chartSvg)}`,
      orderBookSvgDataUri: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(obSvg)}`,
    };
  } catch (e) {
    return { scenario, status: 'error', errorMessage: String(e) };
  }
}

// ─── メイン ───────────────────────────────────────────────────────────────────

async function main() {
  const countArg = parseInt(process.argv[2] ?? '10', 10);
  const timeframeArg = (process.argv[3] ?? '5m') as Timeframe;
  const unitIdArg = process.argv[4] ?? DEFAULT_UNIT_ID;

  const count = Math.min(Math.max(countArg, 1), 30);
  const timeframe: Timeframe = timeframeArg === '1m' ? '1m' : '5m';

  console.error(`\n🔍 ${count}問分のシナリオを分析中... (${timeframe}足)\n`);

  const scenarios = buildScenarios(count, timeframe, unitIdArg);
  const results: AnalysisResult[] = [];

  for (const s of scenarios) {
    process.stderr.write(`  ${s.symbol} (${s.name}) ${s.endDatetime} ... `);
    const r = await analyzeScenario(s);
    process.stderr.write(
      r.status === 'ok'
        ? `✅ ${r.priceChangePct! >= 0 ? '+' : ''}${r.priceChangePct}% → ${r.suggestedAnswer === 'a' ? '買い' : r.suggestedAnswer === 'b' ? '空売り' : '見送り'}\n`
        : `❌ ${r.errorMessage}\n`,
    );
    results.push(r);
    await new Promise((r) => setTimeout(r, 500)); // rate limit
  }

  // JSON出力（標準出力）
  console.log(JSON.stringify(results, null, 2));

  const ok = results.filter((r) => r.status === 'ok').length;
  console.error(`\n✅ ${ok}/${count} 件成功\n`);
  console.error('📋 次のステップ:');
  console.error('  1. この出力（JSON）を Claude Code に貼り付けて「解説文を書いて」と依頼');
  console.error('  2. Claude Code が Supabase MCP で INSERT SQL を実行');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
