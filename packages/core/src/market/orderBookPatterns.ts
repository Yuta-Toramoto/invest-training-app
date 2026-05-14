import type { MockOrderBook } from './types';

export const ORDER_BOOK_PATTERNS: MockOrderBook[] = [
  {
    patternName: '標準',
    description: '売り買いが均衡しており、方向感が出にくい状態です。',
    asks: [
      { price: 5, size: 3000 },
      { price: 4, size: 2000 },
      { price: 3, size: 1500 },
      { price: 2, size: 2500 },
      { price: 1, size: 1800 },
    ],
    bids: [
      { price: -1, size: 2000 },
      { price: -2, size: 1500 },
      { price: -3, size: 3000 },
      { price: -4, size: 2200 },
      { price: -5, size: 1800 },
    ],
  },
  {
    patternName: '本尊押し',
    description: '大口の売り板が厚く積まれており、上値が重い状態です。上昇しにくい局面です。',
    asks: [
      { price: 5, size: 15000 },
      { price: 4, size: 12000 },
      { price: 3, size: 8000 },
      { price: 2, size: 5000 },
      { price: 1, size: 3000 },
    ],
    bids: [
      { price: -1, size: 1500 },
      { price: -2, size: 1200 },
      { price: -3, size: 1000 },
      { price: -4, size: 800 },
      { price: -5, size: 600 },
    ],
  },
  {
    patternName: '環境増し',
    description: '買い板が厚く下値をサポートしており、上昇しやすい状態です。',
    asks: [
      { price: 5, size: 1200 },
      { price: 4, size: 900 },
      { price: 3, size: 800 },
      { price: 2, size: 700 },
      { price: 1, size: 600 },
    ],
    bids: [
      { price: -1, size: 8000 },
      { price: -2, size: 12000 },
      { price: -3, size: 15000 },
      { price: -4, size: 10000 },
      { price: -5, size: 7000 },
    ],
  },
  {
    patternName: '薄板（流動性低）',
    description: '売り買いともに板が薄く、価格が飛びやすい状態です。急騰・急落に注意が必要です。',
    asks: [
      { price: 5, size: 300 },
      { price: 4, size: 200 },
      { price: 3, size: 150 },
      { price: 2, size: 200 },
      { price: 1, size: 100 },
    ],
    bids: [
      { price: -1, size: 200 },
      { price: -2, size: 150 },
      { price: -3, size: 300 },
      { price: -4, size: 100 },
      { price: -5, size: 200 },
    ],
  },
];
