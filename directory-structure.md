# invest-training-app — 理想のディレクトリ構成

このドキュメントは **Phase 10 完了時の最終形**を示します。
凡例:

- `[P0]` Phase 0（プロジェクト初期化）で配置 ★ **これだけでも先に作ってOK**
- `[P1]` Phase 1（モノレポ土台）
- `[P2]` Phase 2（認証・DB）
- `[P3]` Phase 3（コアドメイン・API）
- `[P4]` Phase 4（学習UI）
- `[P5]` Phase 5（管理画面）
- `[P6]` Phase 6（進捗・ゲーミフィケーション）
- `[P7]` Phase 7（仕上げ・公開準備）
- `[P8]` Phase 8（市場データ抽象化）
- `[P9]` Phase 9（仮想ペーパートレード）
- `[P10]` Phase 10（モバイルアプリ）

各 Phase の意味は `roadmap.md` を参照してください。

---

## 全体ツリー

```
invest-training-app/
│
├── .claude/                                    [P0] Claude Code 設定
│   ├── skills/                                 プロジェクト固有 skill
│   │   ├── trading-domain/
│   │   │   └── SKILL.md                        [P0] デイトレ用語・法務禁則
│   │   ├── duolingo-ui/
│   │   │   └── SKILL.md                        [P0] UI 規約・色トークン
│   │   ├── db-migration/
│   │   │   └── SKILL.md                        [P2] Drizzle 運用ルール
│   │   └── market-data/
│   │       └── SKILL.md                        [P8] 市場データ抽象化規約
│   ├── commands/                               カスタムスラッシュコマンド
│   │   ├── spec.md                             [P0] /spec で仕様書雛形生成
│   │   ├── migrate.md                          [P2] /migrate で DB マイグレ
│   │   ├── review.md                           [P0] /review で diff レビュー
│   │   └── component.md                        [P4] /component で UI 雛形
│   └── sessions/                               (gitignore) ローカルセッション
│
├── .github/
│   └── workflows/
│       ├── ci.yml                              [P1] lint/typecheck/test/build
│       ├── deploy-preview.yml                  [P1] PR ごとに Vercel プレビュー
│       └── e2e.yml                             [P4] Playwright E2E
│
├── .vscode/                                    [P0] Cursor も互換設定を読む
│   ├── settings.json                           formatOnSave, ESLint 統合
│   └── extensions.json                         推奨拡張機能
│
├── apps/
│   │
│   ├── web/                                    [P1] Next.js 15 (App Router)
│   │   ├── app/                                [P1] App Router ルート
│   │   │   │
│   │   │   ├── (marketing)/                    [P1] 未ログイン向けルートグループ
│   │   │   │   ├── page.tsx                    [P1] / ランディング
│   │   │   │   ├── about/page.tsx              [P7] 教育目的の免責文ページ
│   │   │   │   ├── terms/page.tsx              [P7] 利用規約
│   │   │   │   ├── privacy/page.tsx            [P7] プライバシーポリシー
│   │   │   │   └── layout.tsx                  [P1] マーケティング用レイアウト
│   │   │   │
│   │   │   ├── (auth)/                         [P2] 認証関連
│   │   │   │   ├── login/page.tsx              [P2] ログイン
│   │   │   │   ├── signup/page.tsx             [P2] サインアップ
│   │   │   │   ├── callback/route.ts           [P2] OAuth コールバック
│   │   │   │   └── layout.tsx                  [P2]
│   │   │   │
│   │   │   ├── (app)/                          [P4] 認証必須エリア
│   │   │   │   ├── learn/
│   │   │   │   │   ├── page.tsx                [P6] レッスンツリー（円形パスUI）
│   │   │   │   │   └── [unitId]/
│   │   │   │   │       ├── page.tsx            [P4] 学習画面（クイズ）
│   │   │   │   │       └── complete/page.tsx   [P4] ユニット完了画面
│   │   │   │   ├── profile/
│   │   │   │   │   ├── page.tsx                [P6] 自分のプロフィール
│   │   │   │   │   └── settings/page.tsx       [P6] 設定（音量・通知等）
│   │   │   │   ├── leaderboard/page.tsx        [P6] 週次リーグ
│   │   │   │   ├── practice/                   [P9] 仮想ペーパートレード
│   │   │   │   │   ├── page.tsx                [P9] ポートフォリオ概要
│   │   │   │   │   └── [symbol]/page.tsx       [P9] 個別銘柄の取引画面
│   │   │   │   └── layout.tsx                  [P4] 認証ガード + 共通HUD
│   │   │   │
│   │   │   ├── admin/                          [P5] 管理画面
│   │   │   │   ├── questions/
│   │   │   │   │   ├── page.tsx                [P5] 問題一覧・統計
│   │   │   │   │   ├── new/page.tsx            [P5] 新規問題作成
│   │   │   │   │   └── [id]/edit/page.tsx      [P5] 問題編集
│   │   │   │   ├── lessons/page.tsx            [P5] レッスン管理
│   │   │   │   ├── users/page.tsx              [P6] ユーザ管理
│   │   │   │   └── layout.tsx                  [P5] admin ロールガード
│   │   │   │
│   │   │   ├── api/
│   │   │   │   ├── trpc/[trpc]/route.ts        [P3] tRPC エンドポイント
│   │   │   │   ├── health/route.ts             [P1] ヘルスチェック
│   │   │   │   └── webhooks/                   [P9] 外部 webhook（将来）
│   │   │   │       └── stripe/route.ts         [将来] 決済webhook
│   │   │   │
│   │   │   ├── layout.tsx                      [P1] ルートレイアウト・Nunito設定
│   │   │   ├── globals.css                     [P1] Tailwind ディレクティブ
│   │   │   ├── error.tsx                       [P1] エラー境界
│   │   │   ├── not-found.tsx                   [P1] 404
│   │   │   └── opengraph-image.tsx             [P7] OGP画像（動的生成）
│   │   │
│   │   ├── components/                         [P1] web 固有コンポーネント
│   │   │   ├── learn/                          学習画面のコンポーネント
│   │   │   │   ├── QuestionView.tsx            [P4] 問題表示の親
│   │   │   │   ├── ChartImage.tsx              [P4] チャート画像（拡大対応）
│   │   │   │   ├── OrderBookTab.tsx            [P4] 板情報タブ
│   │   │   │   ├── VolumeTab.tsx               [P4] 出来高タブ
│   │   │   │   ├── ChoiceButton.tsx            [P4] 選択肢ボタン
│   │   │   │   ├── ResultSheet.tsx             [P4] 正解/不正解シート
│   │   │   │   ├── Confetti.tsx                [P4] 紙吹雪エフェクト
│   │   │   │   └── UnitCompleteCard.tsx        [P4] ユニット完了表示
│   │   │   ├── nav/
│   │   │   │   ├── TopBar.tsx                  [P4] 上部HUD（ハート/XP/×）
│   │   │   │   ├── BottomTabs.tsx              [P4] 下部ナビ
│   │   │   │   └── BackButton.tsx              [P4]
│   │   │   ├── admin/
│   │   │   │   ├── QuestionForm.tsx            [P5] 問題作成フォーム
│   │   │   │   ├── ImageUpload.tsx             [P5] D&D 画像アップロード
│   │   │   │   └── QuestionPreview.tsx         [P5] 実 UI でのプレビュー
│   │   │   ├── practice/                       [P9] ペーパートレード用
│   │   │   │   ├── TradingChart.tsx            [P9] TradingView ベース
│   │   │   │   ├── OrderForm.tsx               [P9] 発注フォーム
│   │   │   │   └── PositionsTable.tsx          [P9] 保有ポジション
│   │   │   └── shared/                         アプリ内汎用
│   │   │       ├── PageContainer.tsx           [P1]
│   │   │       └── Loader.tsx                  [P1]
│   │   │
│   │   ├── lib/                                [P1] web 固有のユーティリティ
│   │   │   ├── supabase/
│   │   │   │   ├── client.ts                   [P2] ブラウザ用クライアント
│   │   │   │   ├── server.ts                   [P2] サーバ用（cookies対応）
│   │   │   │   └── middleware.ts               [P2] middleware 用
│   │   │   ├── trpc/
│   │   │   │   ├── client.ts                   [P3] tRPC クライアント
│   │   │   │   ├── server.ts                   [P3] サーバ側ヘルパ
│   │   │   │   └── provider.tsx                [P3] React Provider
│   │   │   ├── routers/                        [P3] tRPC サブルーター
│   │   │   │   ├── _app.ts                     [P3] ルートルーター
│   │   │   │   ├── question.ts                 [P3] 出題/採点
│   │   │   │   ├── profile.ts                  [P3] プロフィール
│   │   │   │   ├── lesson.ts                   [P3] レッスン一覧
│   │   │   │   ├── admin.ts                    [P5] 管理操作
│   │   │   │   ├── leaderboard.ts              [P6] ランキング
│   │   │   │   └── paperTrade.ts               [P9] ペーパートレード
│   │   │   ├── hooks/                          クライアントフック
│   │   │   │   ├── useUser.ts                  [P2]
│   │   │   │   ├── useStreak.ts                [P6]
│   │   │   │   ├── useSound.ts                 [P4] 効果音再生
│   │   │   │   └── useHaptics.ts               [P4] 触覚フィードバック
│   │   │   ├── analytics/                      [P7]
│   │   │   │   └── posthog.ts                  [P7] 計測初期化
│   │   │   └── auth.ts                         [P2] 認可ヘルパ
│   │   │
│   │   ├── public/                             [P1] 静的ファイル
│   │   │   ├── icons/                          [P1]
│   │   │   ├── lottie/                         [P4] Lottie アニメ
│   │   │   │   ├── confetti.json
│   │   │   │   ├── streak-flame.json
│   │   │   │   └── levelup.json
│   │   │   ├── sounds/                         [P4] 効果音
│   │   │   │   ├── correct.mp3
│   │   │   │   ├── wrong.mp3
│   │   │   │   ├── levelup.mp3
│   │   │   │   └── streak.mp3
│   │   │   ├── images/                         [P1]
│   │   │   ├── manifest.json                   [P7] PWA マニフェスト
│   │   │   └── favicon.ico                     [P1]
│   │   │
│   │   ├── tests/
│   │   │   └── e2e/                            [P4] Playwright E2E
│   │   │       ├── learn-flow.spec.ts          [P4] 学習フロー
│   │   │       ├── auth.spec.ts                [P2] 認証フロー
│   │   │       └── admin.spec.ts               [P5] 管理画面
│   │   │
│   │   ├── middleware.ts                       [P2] Supabase セッション更新
│   │   ├── next.config.ts                      [P1]
│   │   ├── tailwind.config.ts                  [P1] preset 参照
│   │   ├── postcss.config.mjs                  [P1]
│   │   ├── tsconfig.json                       [P1]
│   │   ├── playwright.config.ts                [P4]
│   │   ├── vitest.config.ts                    [P1]
│   │   ├── .eslintrc.cjs                       [P1]
│   │   └── package.json                        [P1]
│   │
│   └── mobile/                                 [P10] Expo (将来)
│       ├── app/                                [P10] Expo Router
│       │   ├── (tabs)/
│       │   │   ├── learn.tsx                   [P10]
│       │   │   ├── profile.tsx                 [P10]
│       │   │   └── _layout.tsx                 [P10]
│       │   ├── (auth)/
│       │   ├── _layout.tsx                     [P10]
│       │   └── index.tsx                       [P10]
│       ├── components/                         [P10] mobile 固有
│       ├── lib/                                [P10]
│       │   ├── supabase.ts                     [P10] Expo SecureStore 対応
│       │   └── trpc.ts                         [P10]
│       ├── assets/                             [P10] アイコン・スプラッシュ
│       ├── app.json                            [P10] Expo 設定
│       ├── babel.config.js                     [P10]
│       ├── metro.config.js                     [P10]
│       ├── tsconfig.json                       [P10]
│       └── package.json                        [P10]
│
├── packages/
│   │
│   ├── core/                                   [P1] ★ ビジネスロジックの本拠地
│   │   │                                       (React/Next 非依存・純粋 TS)
│   │   ├── src/
│   │   │   ├── xp/                             [P3] 経験値計算
│   │   │   │   ├── calculate.ts                [P3]
│   │   │   │   └── calculate.test.ts           [P3]
│   │   │   ├── streak/                         [P3] ストリーク判定
│   │   │   │   ├── update.ts                   [P3]
│   │   │   │   ├── isStreakAlive.ts            [P3]
│   │   │   │   └── *.test.ts                   [P3]
│   │   │   ├── hearts/                         [P4] ハート管理
│   │   │   │   ├── regenerate.ts               [P4]
│   │   │   │   └── *.test.ts                   [P4]
│   │   │   ├── srs/                            [P3] 間隔反復出題
│   │   │   │   ├── nextInterval.ts             [P3]
│   │   │   │   ├── pickNextQuestion.ts         [P3]
│   │   │   │   └── *.test.ts                   [P3]
│   │   │   ├── question/                       [P3] 採点ロジック
│   │   │   │   ├── grade.ts                    [P3]
│   │   │   │   ├── difficulty.ts               [P3]
│   │   │   │   └── *.test.ts                   [P3]
│   │   │   ├── lesson/                         [P6] レッスン進行管理
│   │   │   │   ├── progress.ts                 [P6]
│   │   │   │   └── *.test.ts                   [P6]
│   │   │   ├── leaderboard/                    [P6] ランキング計算
│   │   │   │   ├── league.ts                   [P6]
│   │   │   │   └── *.test.ts                   [P6]
│   │   │   ├── market/                         [P8] ★ 市場データ抽象化
│   │   │   │   ├── MarketDataSource.ts         [P8] interface 定義
│   │   │   │   ├── types.ts                    [P8] Candle, Quote, OrderBook
│   │   │   │   ├── adapters/
│   │   │   │   │   ├── MockMarketSource.ts     [P8] ヒストリカル CSV
│   │   │   │   │   ├── YahooFinanceSource.ts   [P8] 無料 API
│   │   │   │   │   └── PolygonSource.ts        [将来] 有料
│   │   │   │   └── *.test.ts                   [P8]
│   │   │   ├── paper-trade/                    [P9] ペーパートレード
│   │   │   │   ├── engine.ts                   [P9] 約定エンジン
│   │   │   │   ├── pnl.ts                      [P9] 損益計算
│   │   │   │   ├── metrics.ts                  [P9] 勝率/PF/シャープ
│   │   │   │   └── *.test.ts                   [P9]
│   │   │   ├── time/                           [P3] TZ・日付ユーティリティ
│   │   │   │   ├── today.ts                    [P3]
│   │   │   │   └── *.test.ts                   [P3]
│   │   │   └── index.ts                        [P1] 公開 API
│   │   ├── vitest.config.ts                    [P1]
│   │   ├── tsconfig.json                       [P1]
│   │   └── package.json                        [P1] name: @invest-training/core
│   │
│   ├── db/                                     [P2] Drizzle スキーマ・クライアント
│   │   ├── src/
│   │   │   ├── schema/                         [P2] テーブル定義
│   │   │   │   ├── profiles.ts                 [P2]
│   │   │   │   ├── lessons.ts                  [P2]
│   │   │   │   ├── units.ts                    [P2]
│   │   │   │   ├── questions.ts                [P2]
│   │   │   │   ├── attempts.ts                 [P2]
│   │   │   │   ├── leagues.ts                  [P6]
│   │   │   │   ├── paperAccounts.ts            [P9]
│   │   │   │   ├── paperPositions.ts           [P9]
│   │   │   │   ├── paperOrders.ts              [P9]
│   │   │   │   └── index.ts                    [P2] re-export
│   │   │   ├── client.ts                       [P2] Drizzle クライアント
│   │   │   ├── seed/                           [P2] シードデータ
│   │   │   │   ├── lessons.ts                  [P2]
│   │   │   │   └── index.ts                    [P2]
│   │   │   ├── migrations/                     [P2] drizzle-kit 生成（自動）
│   │   │   │   └── *.sql
│   │   │   └── policies/                       [P2] RLS ポリシー SQL
│   │   │       ├── profiles.sql                [P2]
│   │   │       ├── attempts.sql                [P2]
│   │   │       └── questions.sql               [P2]
│   │   ├── drizzle.config.ts                   [P2]
│   │   ├── tsconfig.json                       [P2]
│   │   └── package.json                        [P2] name: @invest-training/db
│   │
│   ├── ui/                                     [P1] 共通 UI（Web/Mobile 両対応視野）
│   │   ├── src/
│   │   │   ├── DuoButton.tsx                   [P4] 3D影付きボタン
│   │   │   ├── HeartBar.tsx                    [P4]
│   │   │   ├── XpBar.tsx                       [P4]
│   │   │   ├── StreakFlame.tsx                 [P4]
│   │   │   ├── ProgressRing.tsx                [P6] 円形進捗
│   │   │   ├── LessonNode.tsx                  [P6] レッスンツリーのノード
│   │   │   ├── tokens.css                      [P1] CSS 変数定義
│   │   │   ├── animations.ts                   [P4] Framer Motion variants
│   │   │   └── index.ts                        [P1]
│   │   ├── tsconfig.json                       [P1]
│   │   └── package.json                        [P1] name: @invest-training/ui
│   │
│   ├── types/                                  [P1] 共通型
│   │   ├── src/
│   │   │   ├── domain.ts                       [P3] Lesson, Unit, Question
│   │   │   ├── api.ts                          [P3] tRPC 入出力型
│   │   │   ├── market.ts                       [P8] Candle, Quote, OrderBook
│   │   │   └── index.ts                        [P1]
│   │   ├── tsconfig.json                       [P1]
│   │   └── package.json                        [P1] name: @invest-training/types
│   │
│   └── config/                                 [P1] 共通設定
│       ├── eslint/
│       │   ├── base.js                         [P1] 共通ルール
│       │   ├── nextjs.js                       [P1] Next.js 用
│       │   └── react-library.js                [P1] ライブラリ用
│       ├── typescript/
│       │   ├── base.json                       [P1]
│       │   ├── nextjs.json                     [P1]
│       │   └── react-library.json              [P1]
│       ├── tailwind/
│       │   └── preset.ts                       [P1] 色トークン・フォント
│       └── package.json                        [P1] name: @invest-training/config
│
├── docs/                                       [P0] ドキュメント
│   ├── architecture.md                         [P0] アーキテクチャ全体像
│   ├── claude-code-setup.md                    [P0] skills/plugins/MCP 設定
│   ├── adr/                                    Architecture Decision Records
│   │   ├── 0001-monorepo.md                    [P0] モノレポ採用
│   │   ├── 0002-trpc.md                        [P3] tRPC 採用（実装時に追加）
│   │   ├── 0003-market-data-abstraction.md     [P8]
│   │   └── README.md                           [P0] ADR の書き方
│   ├── specs/                                  機能仕様書
│   │   ├── _template.md                        [P0] spec テンプレ
│   │   ├── quiz-flow.md                        [P4] 例: 学習フロー
│   │   ├── srs-algorithm.md                    [P3] 例: SRS アルゴリズム
│   │   └── ...                                 機能ごとに追加
│   ├── runbooks/                               [P7] 運用手順書
│   │   ├── deploy.md                           [P7] デプロイ手順
│   │   ├── rollback.md                         [P7] ロールバック
│   │   └── incident-response.md                [P7] 障害対応
│   └── assets/                                 ドキュメント用画像
│       └── architecture-diagram.png            [P0]
│
├── scripts/                                    [P2] 雑用スクリプト
│   ├── seed.ts                                 [P2] シード投入
│   ├── import-questions.ts                     [P5] CSV から問題インポート
│   ├── generate-types.ts                       [P2] Supabase 型生成（必要なら）
│   └── check-rls.ts                            [P2] RLS ポリシー検証
│
├── .changeset/                                 [P1 任意] バージョン管理
│   └── config.json
│
├── .env.example                                [P0] 環境変数のひな型
├── .gitignore                                  [P0]
├── .gitattributes                              [P0] 改行コード等
├── .editorconfig                               [P0] エディタ共通設定
├── .nvmrc                                      [P0] Node.js バージョン固定
├── .npmrc                                      [P0] pnpm 設定
├── .prettierrc                                 [P0] Prettier 設定
├── .prettierignore                             [P0]
├── .mcp.json                                   [P0] (gitignored) 実トークン入り
├── .mcp.json.example                           [P0] MCP サーバ設定の雛形
├── CLAUDE.md                                   [P0] ★ Claude Code 規約
├── README.md                                   [P0] プロジェクト概要
├── LICENSE                                     [P7] 公開時に決定
├── roadmap.md                                  [P0] ★ 開発ロードマップ
├── directory-structure.md                      [P0] ★ このファイル
├── package.json                                [P0] ワークスペースルート
├── pnpm-workspace.yaml                         [P0]
├── pnpm-lock.yaml                              [P1] (自動生成・コミット必須)
├── turbo.json                                  [P0]
└── tsconfig.json                               [P0] パス解決のみ
```

---

## Phase 0 で実際に配置するファイル（最小セット）

zip で配布したものに加え、これらを追加してから git init してください。

```
invest-training-app/
├── .claude/
│   ├── skills/
│   │   ├── trading-domain/SKILL.md         ✅ 提供済み
│   │   └── duolingo-ui/SKILL.md            ✅ 提供済み
│   └── commands/
│       ├── spec.md                         ✅ 提供済み
│       ├── migrate.md                      ✅ 提供済み
│       └── review.md                       ✅ 提供済み
├── .vscode/
│   ├── settings.json                       ⬜ 追加推奨（下記テンプレ参照）
│   └── extensions.json                     ⬜ 追加推奨
├── docs/
│   ├── architecture.md                     ✅ 提供済み
│   ├── claude-code-setup.md                ✅ 提供済み
│   ├── adr/0001-monorepo.md                ✅ 提供済み
│   └── specs/_template.md                  ✅ 提供済み
├── .editorconfig                           ⬜ 追加推奨
├── .env.example                            ✅ 提供済み
├── .gitignore                              ✅ 提供済み
├── .mcp.json.example                       ✅ 提供済み
├── .npmrc                                  ⬜ 追加推奨
├── .nvmrc                                  ⬜ 追加推奨
├── .prettierrc                             ⬜ 追加推奨
├── CLAUDE.md                               ✅ 提供済み
├── README.md                               ✅ 提供済み
├── directory-structure.md                  ✅ このファイル
├── package.json                            ✅ 提供済み
├── pnpm-workspace.yaml                     ✅ 提供済み
├── roadmap.md                              ✅ 提供済み
├── tsconfig.json                           ✅ 提供済み
└── turbo.json                              ✅ 提供済み
```

`apps/` と `packages/` 配下は **Phase 1 で Claude Code が turbo generator で生成**するので、Phase 0 では空のままで構いません（`.gitkeep` も不要）。

---

## ファイル命名の決定原則

| 種類 | 命名 | 例 |
|---|---|---|
| ディレクトリ | kebab-case | `paper-trade/`, `claude-code-setup.md` |
| React コンポーネント | PascalCase | `DuoButton.tsx`, `QuestionView.tsx` |
| ユーティリティ・フック | camelCase | `useStreak.ts`, `calculate.ts` |
| 型定義のみのファイル | camelCase | `domain.ts`, `api.ts` |
| テスト | 対象 + `.test.ts` | `calculate.test.ts` |
| Next.js 特殊ファイル | 規約に従う | `page.tsx`, `layout.tsx`, `route.ts` |
| ルートグループ | `(name)` | `(app)/`, `(auth)/` |
| 動的ルート | `[name]` | `[unitId]/`, `[symbol]/` |

---

## 配置ルール（迷ったらこれを見る）

| 「これってどこに置くべき？」 | 答え |
|---|---|
| ロジックを 1 関数書きたい | `packages/core/src/<domain>/<verb>.ts` |
| React コンポーネントを 1 つ書きたい（Webだけ） | `apps/web/components/<feature>/` |
| 複数のアプリで共有したい UI | `packages/ui/src/` |
| 型を 1 つ定義したい | 使う場所が 1 つなら同ファイル内、複数なら `packages/types/src/` |
| DB スキーマを 1 つ追加 | `packages/db/src/schema/<table>.ts` + index.ts に re-export |
| tRPC のエンドポイント | `apps/web/lib/routers/<domain>.ts` |
| ページを 1 つ追加 | `apps/web/app/<routeGroup>/<path>/page.tsx` |
| 1 回しか使わないスクリプト | `scripts/<name>.ts` |
| 設計判断 | `docs/adr/000N-<topic>.md` を新規追加 |
| 機能のスペック | `docs/specs/<feature>.md`（`/spec` コマンドで生成） |

---

## アンチパターン（やってはいけない配置）

❌ `apps/web/lib/business-logic/` を作る → `packages/core` を使う
❌ `apps/web/db/` を作る → `packages/db` を使う
❌ `packages/core/src/components/` を作る → `packages/ui` を使う（core は React 非依存）
❌ ルート直下にコンポーネントや関数ファイルを置く → 必ず `apps/` or `packages/` 配下に
❌ `packages/utils/` を作る → 何を入れるか曖昧で必ず肥大化。ドメインで分割する
❌ DB スキーマを `apps/web/` から import → 必ず `packages/db` 経由
