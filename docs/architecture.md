# アーキテクチャ

## 設計原則

### 1. UI と業務ロジックの分離

すべての業務ロジックは `packages/core` に集約し、React や Next.js に依存しません。
これにより:
- Web (Next.js) と Mobile (Expo) で同じロジックを共有できる
- ロジックの単体テストが UI なしで完結する
- 将来、サーバサイドジョブ等で再利用可能

### 2. データソース抽象化

市場データは `packages/core/src/market/MarketDataSource` インタフェース経由でのみアクセス。
- MVP: モック実装 / ヒストリカル CSV
- Phase 8: Yahoo Finance / Alpha Vantage（無料枠）
- 将来: Polygon / IBKR 等

UI 層・出題ロジックはデータ源を意識しない。

### 3. API ファースト

すべての画面は tRPC API を通してデータ取得・更新。
モバイルアプリも同じ tRPC クライアントで動作。
SSR/RSC でも同じプロシージャを呼ぶ。

### 4. 認証と認可

- 認証: Supabase Auth（Email + OAuth）
- 認可: Postgres の RLS で第一次防御
- アプリ層でも tRPC middleware で二重チェック
- `profiles.role = 'admin'` で管理画面アクセス可

## レイヤ図

```
┌──────────────────────────────────────────────┐
│ apps/web (Next.js)    apps/mobile (Expo・将来) │
│  - UI Components       - UI Components         │
│  - Pages/Routes        - Screens               │
└────────────┬─────────────────────┬─────────────┘
             │                     │
             ▼                     ▼
        ┌─────────────────────────────┐
        │  packages/ui (共通 UI)       │
        │  packages/types (共通型)     │
        └─────────────────────────────┘
                       │
                       ▼
        ┌─────────────────────────────┐
        │  tRPC ルーター (apps/web)    │
        └──────────────┬──────────────┘
                       │
                       ▼
        ┌─────────────────────────────┐
        │  packages/core              │
        │   - xp / streak / srs       │
        │   - question / grading      │
        │   - market (interface)      │
        │  (React 非依存・純粋 TS)     │
        └──────────────┬──────────────┘
                       │
                       ▼
        ┌─────────────────────────────┐
        │  packages/db (Drizzle)      │
        └──────────────┬──────────────┘
                       │
                       ▼
                  Supabase Postgres
                  Supabase Auth
                  Supabase Storage
```

## 技術選定の根拠

| 領域 | 選定 | 理由 |
|---|---|---|
| モノレポ | Turborepo | 学習コスト低、Vercel との相性◎、キャッシュ高速 |
| パッケージマネージャ | pnpm | workspaces 互換、ディスク効率、Node 22 で安定 |
| Web フレームワーク | Next.js 15 (App Router) | RSC でデータ取得が簡潔、Vercel 無料デプロイ |
| 言語 | TypeScript strict | 型安全、Claude Code の出力品質が上がる |
| 認証/DB | Supabase | 無料枠が広い、Auth + Postgres + Storage + Realtime が一体 |
| ORM | Drizzle | 軽量、TypeScript フレンドリー、Edge 対応 |
| API | tRPC | 型がエンドツーエンドで通る、Next.js / Expo 両対応 |
| UI フレームワーク | Tailwind + shadcn/ui | カスタマイズしやすい、AI が扱いやすい |
| アニメーション | Framer Motion | Duolingo 風の動きに必須 |
| チャート（学習用） | 画像で十分（MVP） | Phase 8 で TradingView Lightweight Charts に置換 |
| サーバ状態 | TanStack Query | tRPC と相性◎、キャッシュ・楽観更新が簡単 |
| クライアント状態 | Zustand | Redux より軽量、必要な分だけ |
| モバイル（将来） | Expo + React Native + NativeWind | Web の Tailwind 知識が活きる、ストア配信が容易 |

## 拒否した選択肢

- **Firebase** — RLS のような細かい権限制御が Postgres ほど柔軟ではない
- **REST API** — tRPC の型推論メリットを失う
- **CSS-in-JS (styled-components 等)** — RSC で扱いにくい、ランタイムコスト
- **Redux** — このスケールではオーバーキル
- **Prisma** — Drizzle に比べてバンドルサイズが大きく、Edge で扱いにくい

## 将来の拡張ポイント

- リアルタイムデータ: Supabase Realtime + 外部 WebSocket フィードのアダプタ層
- 決済（将来課金プラン）: Stripe（Supabase との連携実装あり）
- AI 自動採点: Anthropic API で解説文生成、画像から問題自動生成
- 多言語化: next-intl で i18n、日本語をベースに英語追加
