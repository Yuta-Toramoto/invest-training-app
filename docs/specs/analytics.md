# Spec: アナリティクス（PostHog）

## ステータス

- 起票日: 2026-05-14
- 状態: Approved
- 担当: Yuta-Toramoto
- 関連 Issue/PR: —

## 概要

PostHog の無料枠（月 100 万イベントまで）を使い、ページビューと主要ユーザーアクションを計測する。  
「どの問題で離脱しているか」「週間目標の達成率はどのくらいか」を把握し、コンテンツ改善に活かす。

Sentry がエラー監視（What went wrong）を担うのに対し、  
PostHog はユーザー行動の可視化（How users learn）を担う。

## 動機

`roadmap.md` Phase 7 に「アナリティクス（PostHog or Plausible 無料枠）」が未チェックとして残っている。  
現状では学習セッション数・離脱率・目標達成率が一切見えておらず、コンテンツ改善の根拠が得られない。

Plausible ではなく PostHog を採用する理由:

- 無料枠の制限が大きい（1M イベント/月 vs Plausible は有料のみ）
- ユーザー識別（`distinct_id`）でログインユーザーの行動を追える
- カスタムイベントのプロパティを自由に設計できる
- Next.js App Router 向け公式ガイドが充実している

## 既存の関連実装

- `apps/web/components/providers/TrpcProvider.tsx` — `'use client'` Provider パターンの参考
- `apps/web/app/layout.tsx` — Provider を追加する場所
- `apps/web/app/learn/[unitId]/LearnClient.tsx` — `question_answered` / `unit_completed` を発火する場所
- `apps/web/components/GoalSettingModal.tsx` — `goal_setting_changed` を発火する場所
- `apps/web/sentry.client.config.ts` — 環境変数（`NEXT_PUBLIC_*`）パターンの参考
- `apps/web/next.config.ts` — `withSentryConfig` ラッパーパターンの参考（PostHog はラッパー不要）
- `docs/specs/daily-weekly-goal.md` — 計測候補イベントを列挙済み

## データモデル変更

なし。PostHog はクラウドで完結し、自前 DB への書き込みは不要。

## ドメインロジック

なし。`packages/core` への変更は不要。イベント定義は `apps/web` 内で完結する。

## API 変更 (tRPC)

なし。

## 実装内容

### 1. パッケージ追加

```
posthog-js  # クライアントサイド SDK（Next.js App Router 対応）
```

`posthog-node` はサーバーサイドでの識別に使うが、  
今回はクライアントサイドのみで計測するため導入しない（将来の拡張余地あり）。

### 2. 環境変数

```
NEXT_PUBLIC_POSTHOG_KEY=phc_xxxx   # PostHog プロジェクト API キー（Public Key）
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com  # またはリージョンに応じて eu.i.posthog.com
```

`.env.local` と Vercel 環境変数の両方に追加。

### 3. PostHogProvider（新規）

```ts
// apps/web/components/providers/PostHogProvider.tsx
'use client';
```

`posthog-js` を初期化し、ページビューを自動計測するための Provider。  
`TrpcProvider` の外側（または内側）に並列で配置する。

`posthog.init()` のオプション:

- `api_host`: `NEXT_PUBLIC_POSTHOG_HOST`
- `capture_pageview: false` — Next.js App Router では手動で計測（後述）
- `person_profiles: 'identified_only'` — ログインユーザーのみプロファイルを作成（無名ユーザーのイベントはカウントしない）

### 4. ページビュー計測

Next.js App Router では `usePathname` + `useSearchParams` を使って  
ルート変更を検知し `posthog.capture('$pageview')` を手動で呼ぶ。

```ts
// PostHogProvider 内の useEffect で実装
```

### 5. ユーザー識別

Supabase セッションの `user.id`（UUID）を `distinct_id` として `posthog.identify()` を呼ぶ。  
**メールアドレス・表示名などの PII はプロパティに含めない。**

識別のタイミング: TrpcProvider でセッション確立後 → `profile.me` で user.id が取得できた時点。  
ただし実装を簡潔にするため、今回は PostHogProvider 内で `@supabase/ssr` のブラウザクライアントからセッションを取得する方式を採用する。

ログアウト時: `posthog.reset()` を呼んでセッションを切る（将来対応）。

### 6. `useAnalytics` フック（新規）

```ts
// apps/web/lib/hooks/useAnalytics.ts
'use client';

type AnalyticsEvent =
  | {
      name: 'question_answered';
      props: { is_correct: boolean; difficulty: number; xp_gained: number };
    }
  | {
      name: 'unit_completed';
      props: { accuracy_pct: number; elapsed_sec: number; question_count: number };
    }
  | { name: 'weekly_goal_achieved'; props: { goal_xp: number; weekly_xp: number } }
  | { name: 'goal_setting_changed'; props: { from_xp: number; to_xp: number } }
  | { name: 'heart_recovery_started'; props: { hearts_before: number } }
  | { name: 'review_correct'; props: Record<string, never> };

export function useAnalytics() {
  const capture = useCallback((event: AnalyticsEvent) => {
    posthog.capture(event.name, event.props);
  }, []);
  return { capture };
}
```

型安全なイベント名・プロパティの強制により、タイポや欠損プロパティを防ぐ。

### 7. イベント発火箇所

| イベント                 | 発火場所                       | タイミング                                      |
| ------------------------ | ------------------------------ | ----------------------------------------------- |
| `question_answered`      | `LearnClient.tsx`              | `handleSubmit` 完了後                           |
| `unit_completed`         | `LearnClient.tsx`              | `phase === 'complete'` 遷移時                   |
| `weekly_goal_achieved`   | `LearnClient.tsx`              | `res.goalAchievedThisWeek === true`             |
| `goal_setting_changed`   | `GoalSettingModal.tsx`         | `setGoal` mutation 成功後                       |
| `heart_recovery_started` | `apps/web/app/review/page.tsx` | ページロード時（hearts_before を props に渡す） |

## UI 変更

PostHogProvider はユーザーに見えない透過的な Provider。  
Cookie 同意バナーは不要（PostHog は `persistence: 'memory'` または cookieless モードで GDPR 準拠できるが、  
本アプリは日本向けで個人情報保護法の範囲内に収まるため、今回は標準設定で対応する）。

## アクセシビリティ

なし（UI 変更がないため）。

## テスト計画

- [ ] ユニット: `useAnalytics` — 型が正しくコンパイルされること（型テスト）
- [ ] 手動確認: PostHog Dashboard でイベントが届いていることを確認
  - ページビュー (`$pageview`)
  - `question_answered`
  - `unit_completed`
  - `goal_setting_changed`

自動テストでサードパーティ SDK をモックするコストより、ダッシュボードでの手動確認の方が確実なため、  
E2E テストは今回スコープ外とする。

## ロールアウト

- フィーチャフラグ: 不要
- 段階リリース: 不要（透過的な変更）
- `person_profiles: 'identified_only'` 設定により、未ログインユーザーのデータは蓄積されない

## オープンクエスチョン（解決済み）

- [x] **OQ1**: データリージョンは **US**（`https://us.i.posthog.com`）に決定
- [x] **OQ2**: Cookie 同意バナーは**不要**（日本向けプライバシーポリシーで対応）

## 不採用案

**Plausible を使う案**  
シンプルで GDPR 準拠が容易。しかし 30 日トライアル後は有料（$9/月〜）。  
カスタムイベントの設計自由度も PostHog より低い。→ PostHog を採用。

**Google Analytics (GA4) を使う案**  
業界標準だが、日本の個人情報保護法・GDPR の観点でリスクがある。  
Sentry + PostHog の組み合わせで代替できる。→ 不採用。

**`posthog-node` でサーバーサイドも計測する案**  
tRPC の `question.submit` などでサーバーサイドからイベントを送れば、クライアント JS のブロック（広告ブロッカー等）を回避できる。  
しかし実装コストが高く、現時点のユーザー規模では不要。→ 将来の拡張として残す。
