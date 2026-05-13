# invest-training-app 開発ロードマップ

> Duolingo風UIでデイトレードを学べる無料Webアプリ。
> 将来的にリアルタイム仮想取引・モバイルアプリへ拡張。

各ステップは **目的 → タスク → 受け入れ条件 → Claude Code 用プロンプト** の順で記載しています。
完了したら `- [ ]` を `- [x]` に変えて、必ずデプロイ・動作確認してから次へ進みます。

---

## Phase 0: 開発環境とAIツールの整備

### Step 0.1: 前提ツールのインストール

- [x] Node.js 22 LTS、pnpm、Git をインストール
- [x] Cursor をインストール、Claude Code CLI (`npm i -g @anthropic-ai/claude-code`) を導入
- [x] GitHub アカウント、Supabase アカウント、Vercel アカウントを作成
- [x] リポジトリ作成（private で OK）

### Step 0.2: Claude Code の skills / plugins / MCP を調査して採用

このプロジェクトに直接効くものだけを厳選して入れる。**入れすぎは context window を圧迫して逆効果。**

採用候補（2026年時点で実績あり）:

**MCP サーバ（必須級）**

- [x] **Context7** — Next.js / Supabase / Drizzle の最新ドキュメントをセッションに注入。バージョン乖離を防げる。
- [x] **Supabase MCP** — スキーマ確認、SQL 実行、認証ユーザ管理を Claude Code から直接。
- [ ] **Playwright MCP** — E2E テスト・UI 検証を Claude Code が実ブラウザで行える。
- [ ] **GitHub MCP** — PR / Issue 管理をエージェントから。

**Plugins / Skills**

- [x] `anthropics/claude-plugins-official` — Anthropic 公式の基準パック
- [x] `frontend-design` skill — UI を「AI っぽい平凡な見た目」から脱却させる（Duolingo風には必須）
- [ ] `skill-creator` — プロジェクト固有 skill（後述）を作るためのメタ skill

**最終ステップ: プロジェクト固有 skill を作る**

- [x] `.claude/skills/trading-domain/SKILL.md` を作成（用語・ドメインルール・出題設計の前提を集約）
- [x] `.claude/skills/duolingo-ui/SKILL.md` を作成（色・アニメーション・コンポーネント規約）

### Step 0.3: 設定ファイルの配置

- [x] `.mcp.json` をリポジトリに追加（このリポジトリの `.mcp.json.example` をコピー）
- [x] `CLAUDE.md` をルートに配置（このリポジトリのテンプレ参照）
- [x] `.claude/commands/` に頻用するスラッシュコマンドを定義（`/spec`, `/review`, `/migrate` など）

**受け入れ条件:** `claude` 起動 → `/mcp` で Context7・Supabase・Playwright が緑表示。Claude が `frontend-design` skill を自動起動して UI 設計を提案できる。

---

## Phase 1: モノレポと土台

### Step 1.1: Turborepo セットアップ

- [x] `pnpm create turbo@latest` でモノレポ作成
- [x] `apps/web` (Next.js 15 App Router), `packages/{core,db,ui,types,config}` を作成
- [x] ESLint / Prettier / Vitest / husky を共通化（`packages/config`）
- [x] GitHub Actions で lint → typecheck → test → build の CI
- [x] Vercel に `apps/web` をデプロイ（Hello World で OK）

**受け入れ条件:** `pnpm dev` で localhost:3000 が起動、`pnpm test` が緑、Vercel に main ブランチが自動デプロイされる。

**プロンプト例:**

```
Turborepo モノレポを作って、apps/web (Next.js 15 App Router + TypeScript strict + Tailwind + shadcn/ui),
packages/{core,db,ui,types,config} を配置してください。CLAUDE.md と .mcp.json は既存のものを使ってください。
完了後、変更ファイル一覧と pnpm dev / pnpm test の結果を出してください。
```

---

## Phase 2: 認証 & データベース

### Step 2.1: Supabase プロジェクト

- [x] 無料プランで Supabase プロジェクト作成
- [x] `@supabase/ssr` で Next.js の Auth 連携（Email + Google OAuth）
- [x] `packages/db` に Drizzle 設定、`drizzle-kit` で migration 管理

### Step 2.2: スキーマ設計

最初に必要なテーブル:

- [x] `profiles` (id, display_name, avatar_url, xp, current_streak, hearts, last_active_at, role)
- [x] `lessons` (id, slug, title, description, order, difficulty)
- [x] `units` (id, lesson_id, title, order)
- [x] `questions` (id, unit_id, type, chart_image_url, order_book_image_url, volume_image_url, prompt, choices jsonb, correct_choice_id, explanation, tags text[], difficulty)
- [x] `attempts` (id, user_id, question_id, selected_choice_id, is_correct, time_taken_ms, answered_at)
- [x] RLS ポリシー: profiles は本人のみ更新、attempts は本人のみ閲覧・作成、admin role のみ questions を編集

**受け入れ条件:** Supabase ダッシュボードで全テーブル確認可、ログインしたユーザの profile が自動作成される、RLS が有効。

---

## Phase 3: コアドメインと API

- [x] `packages/core/src/xp/` に XP 計算ロジック（正解の難易度 × 速さボーナス）
- [x] `packages/core/src/streak/` にストリーク判定（前日アクセス基準、TZ 考慮）
- [x] `packages/core/src/srs/` に簡易 SRS（間隔反復）— 不正解問題を優先出題
- [x] tRPC ルーター: `question.getNext`, `question.submit`, `profile.me`, `lesson.list`
- [x] **ロジックは全て core に置き UI に書かない**（モバイル移植時に再利用するため）
- [x] Vitest でドメインロジック網羅テスト

**プロンプト例:**

```
docs/specs/srs.md にある仕様に従って packages/core/src/srs/ を実装してください。
React や Next.js に依存しない純粋な TypeScript。テストを先に書いて、
全ケース緑になってから tRPC ルーターに繋いでください。
```

---

## Phase 4: Duolingo 風 学習 UI（MVP のヤマ場）

### Step 4.1: コンポーネント設計

- [x] `frontend-design` skill を起動した上で、`packages/ui` にデザインシステム構築
- [x] カラートークン: `--green-500: #58CC02`, `--red-500: #FF4B4B`, `--blue-500: #1CB0F6`, `--yellow-500: #FFC800`
- [x] フォント: Nunito (Google Fonts) ベース
- [x] `<DuoButton>` — 3D影付きボタン、押下で下方向 2px、影縮小
- [x] `<HeartBar>`, `<ProgressBar>`
- [x] Framer Motion で出題遷移・正解/不正解シート

### Step 4.2: 学習画面

- [x] `/learn/[unitId]` ページ
- [x] 上部 HUD（ハート / プログレスバー / ×ボタン）
- [x] 中央: チャート画像（プレースホルダー対応）
- [x] 下部: 3 択ボタン（DuoButton）
- [x] 正解時: 緑シート + 紙吹雪（canvas-confetti）
- [x] 不正解時: 赤シート + 解説 + ハート -1
- [x] ユニット完了画面（獲得 XP、所要時間、正答率）

**受け入れ条件:** スマホブラウザで指 1 本で 1 ユニット完走できる。デザインは生成 AI 感がなく、Duolingo を見たことのある人に「あれ系だ」と即伝わる。

---

## Phase 5: 管理画面（コンテンツ投入）

- [x] `/admin/questions` — Supabase Storage に画像アップロード
- [x] 問題作成フォーム（prompt、固定3択テンプレート、正解、解説、タグ、難易度）
- [x] 一覧で正答率・回答数の統計表示
- [x] `role = 'admin'` のみアクセス可（RLS とミドルウェアの二重防御）

これがないと自分が「教材作成者」になれない。早めに作る。

---

## Phase 6: 進捗・ゲーミフィケーション

- [ ] レッスン / ユニットのツリー表示（Duolingo のあの円形パス UI）
- [ ] ハート回復（時間経過 or 動画視聴の代わりに復習問題正解）
- [ ] デイリーゴール、週間目標
- [ ] フレンド機能の前段としての公開プロフィールページ
- [ ] リーダーボード（週次リーグ、Bronze → Silver → Gold）

---

## Phase 7: 仕上げ（公開前）

- [ ] アクセシビリティ（キーボード操作、スクリーンリーダー、コントラスト）
- [ ] PWA 化（ホーム画面追加、オフライン時の「ネットなし」UI）
- [ ] アナリティクス（PostHog or Plausible 無料枠）
- [ ] エラーモニタリング（Sentry 無料枠）
- [ ] **法務確認**: 金商法の助言行為に当たらないよう免責文・利用規約・教育目的表記を整備
- [ ] プライバシーポリシー、Cookie 通知（必要に応じ）

公開！🚀

---

## Phase 8: リアルタイム市場データ抽象化

ここから先は MVP 公開後でよい。

- [ ] `packages/core/src/market/` に `MarketDataSource` インタフェース定義
  - `getCandles(symbol, timeframe, range)`, `subscribeQuote(symbol)`, `getOrderBook(symbol)`
- [ ] 実装1: `MockMarketSource`（収録済みヒストリカル CSV）
- [ ] 実装2: `YahooFinanceSource` / `AlphaVantageSource`（無料枠）
- [ ] 実装3: `PolygonSource`（将来の有料化を視野に）
- [ ] **どの実装でも UI 層は変えずに動く**ことをテストで担保

---

## Phase 9: 仮想ペーパートレード

- [ ] `paper_accounts` (user_id, cash, equity, opened_at)
- [ ] `paper_positions` (account_id, symbol, side, qty, avg_price, opened_at)
- [ ] `paper_orders` (account_id, symbol, side, qty, type, status, filled_at)
- [ ] 約定エンジン: market order は即時、limit は次のティックで判定
- [ ] TradingView Lightweight Charts でリアルタイム描画
- [ ] パフォーマンス分析（勝率、PF、最大DD、シャープレシオ）

---

## Phase 10: モバイルアプリ

ここまで来れば 50% は既に完成している（packages/core 流用）。

- [ ] `apps/mobile` に Expo (React Native + NativeWind) 追加
- [ ] `packages/ui` のコンポーネントを NativeWind 対応に切替
- [ ] tRPC クライアントを Expo に流用
- [ ] 認証は Supabase Auth の Expo SDK
- [ ] プッシュ通知でストリーク維持を促す
- [ ] App Store / Google Play 配信

---

## 進め方の原則

1. **一度に 1 ステップ。** 受け入れ条件をクリアするまで次へ行かない。
2. **必ず先に spec を書く。** `docs/specs/<機能名>.md` に Claude と一緒に書いてから実装に入る。
3. **小さく PR、こまめにデプロイ。** main へのマージ＝デプロイで実機確認。
4. **テストが緑** & **lint / typecheck 緑** でないとマージしない（CI で強制）。
5. **packages/core は React 非依存**を死守。これがモバイル展開の生命線。
6. 困ったら `roadmap.md` と `CLAUDE.md` を Claude に読み直させる。
