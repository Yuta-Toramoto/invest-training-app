# Claude Code セットアップガイド

このドキュメントは、本プロジェクトで採用する Claude Code の skills / plugins / MCP サーバの選定理由とセットアップ手順をまとめます。

## 方針

> **入れすぎない。** 各 skill / plugin は context window を消費します。Anthropic 公式の推奨は 1 skill 2000 トークン以下、合計でも 2〜3 個に絞るのが理想。
> MCP サーバも同様で、Playwright などは 1 ページ 100K トークン消費することがあるため、必要な時だけ起動します。

## 推奨インストール（優先度順）

### 必須: MCP サーバ

#### 1. Context7 — ドキュメントの自動注入

Next.js / Supabase / Drizzle / Tailwind など、頻繁にバージョンが変わるライブラリの **最新ドキュメントをセッションに注入**します。Claude の訓練データが古いことに起因するハルシネーションを劇的に減らせます。

```bash
# .mcp.json に追記（このリポジトリの .mcp.json.example 参照）
```

**いつ使うか**: 新しいライブラリを使う前に `use context7` で当該ライブラリのドキュメントを取得させてから実装させる。

#### 2. Supabase MCP — DB/認証の直接操作

Claude がスキーマ確認、SQL 実行、RLS ポリシー検証、認証ユーザ作成を直接できます。マイグレーション後の確認やシード投入で頻繁に使います。

**セキュリティ**: 本番プロジェクトには **service_role キーを渡さない**。開発用プロジェクトを別途用意し、そちらの API キーのみ渡す。

#### 3. Playwright MCP — 実ブラウザでの UI 検証

Claude が実際にブラウザを開き、ボタンをクリックし、スクリーンショットを撮って UI を検証します。Duolingo 風 UI の挙動確認、E2E テスト作成で必須。

**注意**: トークン消費が大きい。普段は無効、UI 検証時のみ有効にする運用を推奨。

#### 4. GitHub MCP — PR/Issue 管理（任意）

PR 作成、レビューコメント、Issue 管理をエージェントから。チーム開発になったら有効化。

### 推奨: Skills / Plugins

#### `frontend-design` skill

「AI っぽい平凡な見た目」を回避し、Duolingo 風のポップな UI 設計をガイドします。本プロジェクトの UI 品質を左右します。

```bash
# Anthropic 公式マーケットプレイス経由
claude /plugin marketplace add anthropics/claude-plugins-official
claude /plugin install frontend-design@claude-plugins-official
```

#### `skill-creator` skill

プロジェクト固有 skill（後述）を作成するためのメタ skill。最初のセットアップ時のみ使い、不要になったらアンインストール可。

### プロジェクト固有 skill（自作）

このリポジトリの `.claude/skills/` 配下に作成します。プロジェクトをクローンした人全員が自動で恩恵を受けます。

#### `.claude/skills/trading-domain/SKILL.md`

- デイトレード用語の定義（買い / 空売り / 損切り / 利確 / 板 / 出来高 等）
- 出題で扱うチャートパターン（ピンバー、包み足、ダブルトップ等）の正式呼称
- 法務上の禁則表現リスト（「絶対儲かる」「推奨」等を含めない）

#### `.claude/skills/duolingo-ui/SKILL.md`

- 色トークン定義（CSS 変数の正式名）
- 主要コンポーネント API（`<DuoButton>`, `<HeartBar>` 等）
- アニメーション規約（Framer Motion の variants 命名）
- 効果音/Lottie アセットのパス規約

#### `.claude/skills/db-migration/SKILL.md`

- Drizzle Kit のコマンド手順
- マイグレーション命名規則
- RLS ポリシー追加時のチェックリスト

## カスタムスラッシュコマンド

`.claude/commands/` に配置すると、`/コマンド名` で起動できます。

| コマンド | 用途 | ファイル |
|---|---|---|
| `/spec <機能名>` | docs/specs/ にスペック雛形を作成 | `spec.md` |
| `/migrate` | Drizzle マイグレーション生成 → 適用 → 検証 | `migrate.md` |
| `/review` | 直近の diff をレビューしリスクをリストアップ | `review.md` |
| `/component <名前>` | `packages/ui` にコンポーネント雛形作成 | `component.md` |

例（`.claude/commands/spec.md`）:

```markdown
---
description: docs/specs/ に新機能の spec ファイル雛形を作る。引数は機能名。
---

引数: $ARGUMENTS

以下を含む docs/specs/$ARGUMENTS.md を作成してください:

1. 概要（1-2 段落）
2. 関連する既存機能・ファイル
3. データモデル変更（必要なら）
4. API 変更（tRPC ルーター）
5. UI 変更（画面と状態遷移）
6. テスト計画
7. リスクとオープンクエスチョン

実装はまだしないでください。spec のレビュー後に着手します。
```

## 段階的な導入順

最初から全部入れない。実際に困ってから入れる。

| タイミング | 入れるもの |
|---|---|
| Phase 0 | Context7 MCP、frontend-design skill、CLAUDE.md |
| Phase 1 | プロジェクト固有 skill 2 つ作成 |
| Phase 2 | Supabase MCP（DB ができてから） |
| Phase 4 | Playwright MCP（UI が動き始めてから） |
| チーム化時 | GitHub MCP |

## セキュリティチェックリスト

- [ ] MCP サーバを入れる前に GitHub Star 数・最終更新日・発行元を確認
- [ ] API キーは `.env.local` のみ（コミットしない、`.gitignore` 確認）
- [ ] Supabase は **開発用プロジェクト** の API キーのみを Claude に渡す
- [ ] 不明な plugin を「とりあえず試す」前に SKILL.md / plugin.json の中身を必ず読む
- [ ] 新しい MCP サーバ追加時は `/mcp` で接続確認、`/usage` でトークン消費を観察

## 公式参考リンク

- Claude Code Skills: https://docs.claude.com/en/docs/claude-code/skills
- 公式 Plugin マーケット: https://github.com/anthropics/claude-plugins-official
- MCP プロトコル仕様: https://modelcontextprotocol.io
- Context7: https://github.com/upstash/context7
- Supabase MCP: https://supabase.com/docs/guides/getting-started/mcp
- Playwright MCP: https://github.com/microsoft/playwright-mcp
