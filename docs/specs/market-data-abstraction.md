# Spec: チャート問題自動生成（Phase 8）

## ステータス

- 起票日: 2026-05-14
- 状態: Approved
- 担当: Yuta-Toramoto
- 関連 Issue/PR: —

## 概要

管理画面から「銘柄・日時・時間足」を指定するだけで、  
**ローソク足 + 移動平均線（5MA/25MA/75MA）+ 出来高 + 模擬板**を含むチャート画像を自動生成し、  
「この後、株価はどうなるか？」形式のクイズを作成できるようにする。

- **チャートデータ**: Yahoo Finance 非公式 API（5分足・最大60日分・無料）
- **チャート画像生成**: Satori（Vercel 公式 WebAssembly SVG レンダラ）
- **板情報**: 教育目的の模擬板パターン（TypeScript 定数）
- **解説文**: 問題登録時に Claude API を1回呼んで生成・DB に保存（ユーザーのクイズ解答時は API 不要）
- **回答選択肢**: 「🟢 買い（ロング）/ 🔴 空売り（ショート）/ ⬜ 見送り」（既存3択・業界標準）

## 動機

`roadmap.md` Phase 8 が未チェック。

現状の問題作成フローは手動画像アップロードのみで、コンテンツ作成コストが高い。  
本機能で「銘柄と日時を選ぶだけで問題が作れる」状態にし、教材の拡充速度を上げる。

## 既存の関連実装

- `packages/core/src/` — React 非依存の純粋 TS ドメイン関数群（参考パターン）
- `packages/db/src/schema/questions.ts` — `chart_image_url`, `order_book_image_url`, `explanation` を既に保持
- `apps/web/app/admin/questions/new/actions.ts` — Supabase Storage アップロード + questions insert の既存フロー
- `apps/web/app/admin/questions/new/page.tsx` — 問題作成フォーム（拡張対象）
- `apps/web/app/learn/[unitId]/LearnClient.tsx` — `chartImageUrl` を表示（**UI 変更なし**）

## データモデル変更

**スキーマ変更なし。** 既存カラムをそのまま使用する。

| カラム                           | 用途                                                 |
| -------------------------------- | ---------------------------------------------------- |
| `questions.chart_image_url`      | ローソク足 + MA + 出来高の合成画像 URL               |
| `questions.order_book_image_url` | 模擬板画像 URL                                       |
| `questions.prompt`               | 「次の30分で株価はどうなるか？」等                   |
| `questions.choices`              | 既存の 買い/空売り/見送り                            |
| `questions.correct_choice_id`    | 実際の値動きに基づいて管理者が選択                   |
| `questions.explanation`          | Claude API で生成した解説文（登録時に1回生成・保存） |

## ドメインロジック（packages/core）

React・Node.js fs・DOM API は一切使用しない。

### `packages/core/src/market/types.ts`（新規）

```ts
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
  patternName: string; // 例: '本尊押し'
  description: string; // 解説に使う板の特徴説明
  bids: { price: number; size: number }[]; // 買い（高値順）
  asks: { price: number; size: number }[]; // 売り（安値順）
};
```

### `packages/core/src/market/calculateMA.ts`（新規）

```ts
export function calculateMA(candles: Candle[], period: number): MovingAverage;
```

単純移動平均を計算する純粋関数。`candles.length < period` の場合は計算可能な範囲のみ返す。

**テスト**: `calculateMA.test.ts`

### `packages/core/src/market/orderBookPatterns.ts`（新規）

```ts
export const ORDER_BOOK_PATTERNS: MockOrderBook[] = [
  {
    patternName: '本尊押し',
    description: '大口の売り板が厚く積まれており、上値が重い状態',
    bids: [...],
    asks: [...],
  },
  {
    patternName: '環境増し',
    description: '買い板が厚く下値をサポートしており、上昇しやすい状態',
    bids: [...],
    asks: [...],
  },
  {
    patternName: '薄板（流動性低）',
    description: '売り買いともに板が薄く、価格が飛びやすい状態',
    bids: [...],
    asks: [...],
  },
  {
    patternName: '標準',
    description: '売り買いが均衡しており、方向感が出にくい状態',
    bids: [...],
    asks: [...],
  },
];
```

### `packages/core/src/market/MarketDataSource.ts`（新規・インタフェース）

```ts
export interface MarketDataSource {
  getCandles(symbol: string, timeframe: Timeframe, from: number, to: number): Promise<Candle[]>;
}
```

Phase 8 では `getCandles` のみ。Phase 9（ペーパートレード）で拡張予定。

---

## データ取得（apps/web 内・Server Action）

### Yahoo Finance 非公式 API

`packages/core` 外の `apps/web/lib/market/fetchCandles.ts` に実装する。

```ts
// apps/web/lib/market/fetchCandles.ts
export async function fetchYahooFinanceCandles(
  symbol: string, // 例: '7203.T'（トヨタ）
  timeframe: '5m' | '1m',
  from: Date,
  to: Date,
): Promise<Candle[]>;
```

**エンドポイント:**

```
GET https://query1.finance.yahoo.com/v8/finance/chart/{symbol}
  ?interval=5m
  &period1={unix_from}
  &period2={unix_to}
```

認証不要。制限:

- 1分足: 最大7日分
- 5分足: 最大60日分

**推奨シナリオ設定（5分足）:**

- 表示ローソク足本数: **78本**（1取引日分 = 9:00〜15:30 の 6.5h × 60min ÷ 5min）
- 正解の根拠となる「その後の値動き」: 表示終点から **30分後**（6本先）の価格変化で判定
- 例: 10:00 を終点に表示 → 10:30 の終値で「+0.5%以上なら買い正解、-0.5%以下なら空売り正解、それ以外は見送り正解」

---

## 画像生成（apps/web 内・Server Action）

### チャート画像: `apps/web/lib/market/generateChartSvg.ts`

Satori（`@vercel/og`）を使って SVG を生成し、`@resvg/resvg-wasm` で PNG に変換する。

```
生成物のレイアウト（640 × 520px）:
┌────────────────────────────┐
│  メインチャート（640×400）  │
│  ローソク足                 │
│  5MA（青）/ 25MA（赤）      │
│  75MA（緑）                │
├────────────────────────────┤
│  出来高棒グラフ（640×120）  │
└────────────────────────────┘
```

### 板画像: `apps/web/lib/market/generateOrderBookSvg.ts`

```
生成物のレイアウト（320 × 400px）:
┌──────────┬──────────┐
│ 売り(ask)│  数量    │ ← 赤
│  1,850   │  2,000   │
│  1,849   │  5,000   │
├──────────┼──────────┤
│  現値    │  1,848   │
├──────────┼──────────┤
│ 買い(bid)│  数量    │ ← 青
│  1,847   │  3,000   │
│  1,846   │  8,000   │
└──────────┴──────────┘
```

---

## 解説文の自動生成（Claude API）

**呼び出しタイミング: 問題登録時に1回のみ。ユーザーのクイズ解答時は呼ばない。**

```ts
// apps/web/app/admin/questions/new/actions.ts 内で呼び出す
const explanation = await generateExplanation({
  candles, // 表示した OHLCV データ
  ma5,
  ma25,
  ma75, // 各 MA の最終値
  orderBook, // 選択した板パターン
  correctAnswer, // 'a'(買い) | 'b'(空売り) | 'c'(見送り)
  resultCandles, // 表示終点から30分後までのローソク足
});

// 生成した文字列を questions.explanation に保存
```

**プロンプト方針:**

- 入力: チャートの数値データ・正解・実際の値動き
- 出力: 2〜3文の日本語解説（教育目的・断定的な投資助言にならない表現）
- 例: 「25MAが75MAを下回るデッドクロスが発生しており、売り圧力が強い状態でした。その後30分で-0.8%下落したため、空売りが正解でした。」

**使用モデル**: `claude-haiku-4-5-20251001`（コスト最小・解説生成に十分）

**環境変数:**

```
ANTHROPIC_API_KEY=sk-ant-...
```

---

## UI 変更（管理画面のみ）

### `/admin/questions/new` を拡張

既存の「手動アップロード」タブはそのまま残し、「チャートから自動生成」タブを追加。

```
┌───────────────────────────────────────────┐
│ [手動アップロード] [チャートから自動生成]   │
├───────────────────────────────────────────┤
│ 銘柄コード（東証）  [7203      ]           │
│ 時間足             [5分足 ▼]              │
│ 表示終点日時       [2025-03-14 10:00]     │
│ 板パターン         [本尊押し  ▼]           │
│                                           │
│         [プレビュー生成]                   │
│                                           │
│ ┌────────────┐  ┌──────┐                 │
│ │チャートプレビュ│  │板プレビ│                 │
│ └────────────┘  └──────┘                 │
│                                           │
│ 正解  ○ 買い  ○ 空売り  ○ 見送り          │
│ 難易度 [● 3 ]                             │
│ タグ  [デッドクロス, 下落トレンド ]         │
│                                           │
│ ※ 解説は登録時に AI が自動生成します      │
│                                           │
│           [問題を登録する]                 │
└───────────────────────────────────────────┘
```

**新規コンポーネント:**

- `apps/web/app/admin/questions/new/ChartGeneratorTab.tsx`（Client Component）

**問題登録フロー:**

1. プレビュー生成 → Server Action がチャート・板 SVG を生成・Supabase Storage に一時保存
2. 「問題を登録する」押下 → Server Action が Claude API で解説生成 → questions に insert

## アクセシビリティ

- チャートプレビュー画像に `alt="生成されたチャートプレビュー"` を付与
- 板プレビュー画像に `alt="模擬板: {patternName}"` を付与

## テスト計画

- [ ] ユニット: `calculateMA` — 正常計算、`period > length` の境界値、空配列
- [ ] ユニット: `MockMarketSource.getCandles` — range フィルタリング、存在しない symbol で `RangeError`
- [ ] ユニット: `orderBookPatterns` — bids 高値順・asks 安値順の整合性確認
- [ ] 手動確認: 管理画面でチャート生成 → Storage に画像保存 → 解説が自動生成される → 問題一覧に表示される

## ロールアウト

- フィーチャフラグ: 不要（管理者のみアクセス可能）
- 既存の手動アップロードは引き続き動作（後方互換あり）
- 段階: core 関数 → 画像生成 → 解説生成 → 管理 UI

## オープンクエスチョン（解決済み）

- [x] **OQ1**: J-Quants は無料枠だと日足のみ → **Yahoo Finance 非公式 API**（5分足・60日分）を使用
- [x] **OQ2**: 移動平均線は **5MA・25MA・75MA** の3本
- [x] **OQ3**: 5分足・**78本**（1取引日分）を基本とする
- [x] **OQ4**: 回答選択肢は既存の**買い/空売り/見送り**（業界標準のアクションベース）を維持
- [x] **OQ5**: 解説は **問題登録時に Claude API で1回生成・DB 保存**（クイズ解答時は API 不要）

## 不採用案

**クイズ解答のたびに Claude API で解説生成する案**  
ユーザー体験に遅延が発生し、API コストも問題数 × ユーザー数で増加する。  
問題は事前作成済みなので登録時に1回生成して保存すれば十分。→ 不採用。

**TradingView のスクリーンショット自動取得案**  
利用規約違反リスクと、サイト構造変更による壊れやすさ。→ 不採用。

**`canvas` npm パッケージで描画する案**  
ネイティブバイナリが必要なため Vercel で動作しない。→ Satori を採用。

**J-Quants API を使う案**  
無料枠は日足データのみ。デイトレード（5分足・1分足）には有料プランが必要。→ 不採用。
