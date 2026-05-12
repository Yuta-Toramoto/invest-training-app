# invest-training-app — Claude Code 規約

このファイルは Claude Code が毎セッション読み込みます。**必ず遵守してください。**

## プロジェクト概要

デイトレード学習用 Web アプリ。Duolingo 風 UI、無料、将来モバイル対応・リアルタイム仮想取引を実装予定。
現在のフェーズは `roadmap.md` を参照。

## アーキテクチャ

- **モノレポ**: Turborepo + pnpm workspaces
- **構成**:
  - `apps/web` — Next.js 15 (App Router) + TypeScript strict
  - `apps/mobile` — Expo (将来追加)
  - `packages/core` — **React/Next 非依存の純粋 TS**。ドメインロジックの本拠地
  - `packages/db` — Drizzle スキーマ + クライアント
  - `packages/ui` — Web/Mobile 共通 UI（NativeWind 互換を意識）
  - `packages/types` — 共通型
  - `packages/config` — ESLint / TS / Tailwind の共通設定

## パッケージスコープ

ワークスペース内のパッケージは `@invest-training/*` スコープを使う:
- `@invest-training/core`
- `@invest-training/db`
- `@invest-training/ui`
- `@invest-training/types`
- `@invest-training/config`

例: `pnpm --filter @invest-training/db drizzle-kit migrate`

## 鉄則（破ったら差し戻し）

1. **ビジネスロジックは `packages/core` 以外に書かない。** UI から直接 DB を叩かない。
2. **`packages/core` に React / Next / DOM API を import しない。** モバイル移植時に死ぬ。
3. **DB アクセスは `packages/db` 経由のみ。** API ルートから直接 Supabase クライアントを叩かない。
4. **API は tRPC を使う。** REST を新規追加しない。
5. **市場データは `packages/core/src/market/MarketDataSource` インタフェース経由のみ。**
6. **TypeScript strict。`any` 禁止。** `unknown` を narrowing で使う。
7. **1 ファイル 300 行を超えそうなら分割。**
8. **Server Component 優先。** `"use client"` は本当に必要な時だけ。

## ファイル/ディレクトリ規約

- React コンポーネント: `PascalCase.tsx`、1 ファイル 1 コンポーネント
- フック: `useXxx.ts`、`apps/web/lib/hooks/` に集約
- ドメイン関数: `packages/core/src/<domain>/<verb>.ts` + 同階層に `<verb>.test.ts`
- Drizzle スキーマ: `packages/db/src/schema/<table>.ts`、`index.ts` で re-export

## スタイル

- **Tailwind のみ**。インライン `style` / CSS Modules 禁止
- 色は CSS 変数経由（`var(--green-500)` 等）。Tailwind のデフォルトカラーを直接使わない
- フォント: Nunito（`apps/web/app/layout.tsx` で設定済み）
- アニメーション: Framer Motion。CSS keyframes は最小限
- アイコン: lucide-react

## テスト

- `packages/core` の関数は Vitest で **必ず**ユニットテスト
- 重要フローは Playwright で E2E（Playwright MCP 経由で Claude が書ける）
- 新機能は **型 → テスト → 実装** の順
- 既存テストを壊した場合、勝手に削除せず原因を報告

## Git / PR

- ブランチ: `feat/<scope>-<short-desc>`, `fix/...`, `chore/...`, `docs/...`
- コミット: Conventional Commits（`feat:`, `fix:`, `chore:` 等）
- PR は 1 機能 1 PR、500 行以内が目安
- マージ前に CI 緑必須（lint / typecheck / test / build）

## ドメイン用語（必ずこの用語を使う）

| 用語 | 意味 |
|---|---|
| Lesson | 章（例: 「ローソク足の基本」） |
| Unit | 章内の単元（例: 「ピンバー」） |
| Question | 1 問の出題 |
| Attempt | ユーザの 1 回の回答 |
| XP | 経験値 |
| Streak | 連続学習日数 |
| Heart | ライフ（不正解で減る） |
| SRS | 間隔反復出題ロジック |

## 作業フロー

1. **必ず spec から書く。** 機能名を聞いたら `docs/specs/<feature>.md` を作って合意してから実装
2. **既存パターンを優先。** 似た機能が既にあれば、そのパターンを踏襲（一貫性を最優先）
3. **不明点は質問する。** 曖昧なまま実装しない。「これでいい？」と確認
4. **完了時の出力**:
   - 変更ファイル一覧
   - 実行したコマンドと結果（test/build/lint）
   - 動作確認手順
   - 残課題があれば明記

## やってはいけないこと

- 勝手にライブラリを追加（必ず理由を述べて承認をもらう）
- `packages/core` に UI / Framework コードを混入
- `.env` をコミット
- マイグレーションファイルを手で編集（Drizzle Kit 経由のみ）
- 「テストが落ちてるけど無視で」と判断
- 大量のリファクタを依頼外で実行（聞いてから）

## 参考ドキュメント

- ロードマップ: `roadmap.md`
- アーキテクチャ詳細: `docs/architecture.md`
- Claude Code セットアップ: `docs/claude-code-setup.md`
- 各機能 spec: `docs/specs/`
- ADR: `docs/adr/`
