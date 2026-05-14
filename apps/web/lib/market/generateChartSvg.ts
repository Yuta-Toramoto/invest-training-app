import type { Candle, MovingAverage } from '@invest-training/core';

const W = 640;
const H = 480;
const PADDING_LEFT = 60;
const PADDING_RIGHT = 12;
const PADDING_TOP = 12;
const CHART_H = 340;
const VOLUME_TOP = CHART_H + PADDING_TOP + 16;
const VOLUME_H = 88;
const CANDLE_W = 5;

function scaleY(value: number, min: number, max: number, top: number, height: number): number {
  if (max === min) return top + height / 2;
  return top + ((max - value) / (max - min)) * height;
}

function scaleX(i: number, total: number): number {
  const slotW = (W - PADDING_LEFT - PADDING_RIGHT) / total;
  return PADDING_LEFT + i * slotW + slotW / 2;
}

export function generateChartSvg(candles: Candle[], mas: MovingAverage[], symbol: string): string {
  if (candles.length === 0)
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}"><text x="320" y="240" text-anchor="middle" fill="#888">データなし</text></svg>`;

  const prices = candles.flatMap((c) => [c.high, c.low]);
  const priceMin = Math.min(...prices);
  const priceMax = Math.max(...prices);
  const pricePad = (priceMax - priceMin) * 0.05;
  const pMin = priceMin - pricePad;
  const pMax = priceMax + pricePad;

  const maxVol = Math.max(...candles.map((c) => c.volume));

  const parts: string[] = [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" style="background:#1a1a2e;font-family:monospace">`,
    // 背景グリッド線
    ...[0, 0.25, 0.5, 0.75, 1].map((t) => {
      const y = Math.round(PADDING_TOP + t * CHART_H);
      const price = pMax - t * (pMax - pMin);
      return `<line x1="${PADDING_LEFT}" y1="${y}" x2="${W - PADDING_RIGHT}" y2="${y}" stroke="#2a2a4a" stroke-width="1"/>
<text x="${PADDING_LEFT - 4}" y="${y + 4}" fill="#888" font-size="10" text-anchor="end">${price.toFixed(0)}</text>`;
    }),
    // シンボル表示
    `<text x="${PADDING_LEFT}" y="10" fill="#aaa" font-size="11">${symbol}</text>`,
    // ローソク足
    ...candles.map((c, i) => {
      const x = scaleX(i, candles.length);
      const yOpen = scaleY(c.open, pMin, pMax, PADDING_TOP, CHART_H);
      const yClose = scaleY(c.close, pMin, pMax, PADDING_TOP, CHART_H);
      const yHigh = scaleY(c.high, pMin, pMax, PADDING_TOP, CHART_H);
      const yLow = scaleY(c.low, pMin, pMax, PADDING_TOP, CHART_H);
      const isBull = c.close >= c.open;
      const color = isBull ? '#26a69a' : '#ef5350';
      const bodyTop = Math.min(yOpen, yClose);
      const bodyH = Math.max(Math.abs(yClose - yOpen), 1);
      return [
        `<line x1="${x}" y1="${yHigh}" x2="${x}" y2="${yLow}" stroke="${color}" stroke-width="1"/>`,
        `<rect x="${x - CANDLE_W / 2}" y="${bodyTop}" width="${CANDLE_W}" height="${bodyH}" fill="${color}"/>`,
      ].join('');
    }),
    // 移動平均線
    ...mas.map((ma) => {
      if (ma.values.length < 2) return '';
      const colors: Record<number, string> = { 5: '#ffc800', 25: '#1cb0f6', 75: '#ff9600' };
      const color = colors[ma.period] ?? '#ffffff';
      const offset = candles.length - ma.values.length;
      const points = ma.values
        .map((v, idx) => {
          const x = scaleX(offset + idx, candles.length);
          const y = scaleY(v.value, pMin, pMax, PADDING_TOP, CHART_H);
          return `${x},${y}`;
        })
        .join(' ');
      return `<polyline points="${points}" fill="none" stroke="${color}" stroke-width="1.5" opacity="0.9"/>
<text x="${W - PADDING_RIGHT - 2}" y="${scaleY(ma.values.at(-1)!.value, pMin, pMax, PADDING_TOP, CHART_H)}" fill="${color}" font-size="9" text-anchor="end">${ma.period}MA</text>`;
    }),
    // 出来高エリア区切り線
    `<line x1="${PADDING_LEFT}" y1="${VOLUME_TOP - 4}" x2="${W - PADDING_RIGHT}" y2="${VOLUME_TOP - 4}" stroke="#2a2a4a" stroke-width="1"/>`,
    `<text x="${PADDING_LEFT - 4}" y="${VOLUME_TOP + 10}" fill="#666" font-size="9" text-anchor="end">出来高</text>`,
    // 出来高棒グラフ
    ...candles.map((c, i) => {
      const x = scaleX(i, candles.length);
      const barH = maxVol > 0 ? (c.volume / maxVol) * VOLUME_H : 0;
      const color = c.close >= c.open ? '#26a69a' : '#ef5350';
      return `<rect x="${x - CANDLE_W / 2}" y="${VOLUME_TOP + VOLUME_H - barH}" width="${CANDLE_W}" height="${barH}" fill="${color}" opacity="0.7"/>`;
    }),
    '</svg>',
  ];

  return parts.join('');
}
