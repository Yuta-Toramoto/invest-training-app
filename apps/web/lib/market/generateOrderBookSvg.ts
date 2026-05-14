import type { MockOrderBook } from '@invest-training/core';

const W = 320;
const H = 400;
const ROW_H = 32;
const LABEL_COL = 160;
const SIZE_COL = 130;

export function generateOrderBookSvg(orderBook: MockOrderBook, basePrice: number): string {
  const rows: string[] = [];
  const maxSize = Math.max(
    ...orderBook.asks.map((a) => a.size),
    ...orderBook.bids.map((b) => b.size),
  );

  const totalRows = orderBook.asks.length + 1 + orderBook.bids.length;
  const startY = (H - totalRows * ROW_H) / 2;

  const parts: string[] = [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" style="background:#1a1a2e;font-family:monospace">`,
    // ヘッダー
    `<rect x="0" y="0" width="${W}" height="28" fill="#111130"/>`,
    `<text x="${LABEL_COL / 2}" y="18" fill="#aaa" font-size="11" text-anchor="middle">価格</text>`,
    `<text x="${LABEL_COL + SIZE_COL / 2}" y="18" fill="#aaa" font-size="11" text-anchor="middle">数量</text>`,
  ];

  // 売り板（asks）— 上から安値順（逆順で描画）
  const asksReversed = [...orderBook.asks].reverse();
  asksReversed.forEach((ask, i) => {
    const price = basePrice + ask.price;
    const y = startY + i * ROW_H;
    const barW = (ask.size / maxSize) * (W - 10);
    rows.push(
      `<rect x="0" y="${y}" width="${barW}" height="${ROW_H - 1}" fill="#ef5350" opacity="0.15"/>`,
      `<text x="${LABEL_COL - 8}" y="${y + ROW_H / 2 + 4}" fill="#ef5350" font-size="12" text-anchor="end">${price.toLocaleString()}</text>`,
      `<text x="${LABEL_COL + 8}" y="${y + ROW_H / 2 + 4}" fill="#ef5350" font-size="12">${ask.size.toLocaleString()}</text>`,
    );
  });

  // 現値
  const midY = startY + orderBook.asks.length * ROW_H;
  rows.push(
    `<rect x="0" y="${midY}" width="${W}" height="${ROW_H}" fill="#2a2a4a"/>`,
    `<text x="${W / 2}" y="${midY + ROW_H / 2 + 5}" fill="#ffc800" font-size="14" font-weight="bold" text-anchor="middle">▶ ${basePrice.toLocaleString()}</text>`,
  );

  // 買い板（bids）
  orderBook.bids.forEach((bid, i) => {
    const price = basePrice + bid.price;
    const y = midY + ROW_H + i * ROW_H;
    const barW = (bid.size / maxSize) * (W - 10);
    rows.push(
      `<rect x="0" y="${y}" width="${barW}" height="${ROW_H - 1}" fill="#26a69a" opacity="0.15"/>`,
      `<text x="${LABEL_COL - 8}" y="${y + ROW_H / 2 + 4}" fill="#26a69a" font-size="12" text-anchor="end">${price.toLocaleString()}</text>`,
      `<text x="${LABEL_COL + 8}" y="${y + ROW_H / 2 + 4}" fill="#26a69a" font-size="12">${bid.size.toLocaleString()}</text>`,
    );
  });

  // パターン名フッター
  rows.push(
    `<rect x="0" y="${H - 24}" width="${W}" height="24" fill="#111130"/>`,
    `<text x="${W / 2}" y="${H - 8}" fill="#888" font-size="10" text-anchor="middle">板パターン: ${orderBook.patternName}</text>`,
  );

  parts.push(...rows, '</svg>');
  return parts.join('');
}
