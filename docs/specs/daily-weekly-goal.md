# Spec: 週間目標

## ステータス

- 起票日: 2026-05-14
- 状態: Approved
- 担当: Yuta-Toramoto
- 関連 Issue/PR: —

## 概要

ユーザが「1週間に稼ぐ XP の目標値（週間目標）」を設定し、  
ホーム画面と プロフィール画面でリアルタイムに達成率を確認できる機能。

目標に初めて到達した瞬間にお祝い演出を出すことで、週単位で継続するモチベーションを高める。  
週の起算は月曜日。

## 動機

`roadmap.md` Phase 6 に「デイリーゴール、週間目標」が未チェックとして残っている。  
Phase 7 までの実装ではユーザが「どれくらい学べばいいか」の指針がなく、  
自律的な継続が難しい。本機能で1週間の学習の「終わり」を明確にする。

## 既存の関連実装

- `packages/core/src/xp/calculateXp.ts` — XP 計算（`isCorrect`, `difficulty`, `timeTakenMs` → `XpResult`）
- `packages/core/src/streak/updateStreak.ts` — TZ 考慮のローカル日付変換パターンの参考
- `packages/db/src/schema/profiles.ts` — `xp`, `current_streak`, `hearts` を保持
- `packages/db/src/schema/attempts.ts` — `is_correct`, `time_taken_ms`, `answered_at` を保持（xp_earned は未保存）
- `apps/web/server/routers/question.ts` — `question.submit` で `calculateXp` を呼び `profiles.xp` を更新
- `apps/web/server/routers/profile.ts` — `profile.me`, `profile.stats`, `profile.leaderboard`
- `apps/web/app/page.tsx` — ホーム画面（ヘッダに XP・Streak・HeartBar 表示済み）
- `apps/web/app/profile/page.tsx` — プロフィール画面（7日グラフ表示済み）
- `docs/specs/phase6-gamification.md` — 同 Phase の gamification spec

## データモデル変更

### profiles テーブルに 1 カラム追加

```ts
// packages/db/src/schema/profiles.ts（追加分のみ）
weeklyGoalXp: integer('weekly_goal_xp').notNull().default(100),
```

**選択肢**（UI でラジオ提示）: 50 / 100 / 250 XP

### attempts テーブルに 1 カラム追加

週間 XP をクエリするために Attempt ごとの獲得 XP を永続化する。  
（`calculateXp` を attempts × questions JOIN で再計算する方法もあるが、  
difficulty が変更された場合に過去 XP が変化してしまうため xp_earned を保存する方式を採用）

```ts
// packages/db/src/schema/attempts.ts（追加分のみ）
xpEarned: integer('xp_earned').notNull().default(0),
```

`question.submit` mutation 内で `calculateXp` の戻り値 `.total` をここに格納する。

**破壊的変更なし**。既存 attempts 行は `xp_earned = 0` のまま残る。  
ロールバック: `ALTER TABLE attempts DROP COLUMN xp_earned;` で安全に戻せる。

### RLS 変更

なし。既存ポリシーで `profiles` の本人更新、`attempts` の本人閲覧・作成が担保済み。

## ドメインロジック

### `packages/core/src/goal/checkGoalProgress.ts`（新規）

```ts
export type GoalProgressInput = {
  earnedXp: number; // 今週に獲得した XP
  goalXp: number; // 目標 XP
};

export type GoalProgressResult = {
  progressPercent: number; // 0〜100（超過しても 100 に clamp）
  isAchieved: boolean; // earnedXp >= goalXp
};

export function checkGoalProgress(input: GoalProgressInput): GoalProgressResult;
```

**エッジケース**:

- `goalXp <= 0` → `RangeError`
- `earnedXp < 0` → `RangeError`
- `earnedXp >= goalXp` → `progressPercent = 100`, `isAchieved = true`

**テストファイル**: `packages/core/src/goal/checkGoalProgress.test.ts`

### `packages/core/src/goal/getWeeklyXp.ts`（新規）

```ts
export type WeeklyXpInput = {
  attempts: { xpEarned: number; answeredAt: Date }[];
  now: Date;
  tzOffsetMinutes: number; // updateStreak と同じシグネチャ規約
};

export function getWeeklyXp(input: WeeklyXpInput): number;
```

現在の週（月曜〜日曜）に `answered_at` が含まれる attempt の `xp_earned` 合計を返す。  
週起算: 月曜日（固定）。TZ 変換は `updateStreak.ts` と同じ `toLocalDateStr` パターンを使う。

**エッジケース**:

- attempts が空 → 0 を返す
- 月曜日当日 → その日の attempts を含む
- 週をまたぐ attempts → 今週分のみカウント

**テストファイル**: `packages/core/src/goal/getWeeklyXp.test.ts`

## API 変更 (tRPC)

### `profile.me` を拡張

戻り値に `weeklyGoalXp` と `weeklyXp` を追加。

```ts
me: protectedProcedure.query(async ({ ctx }) => {
  // 既存: profiles から id, display_name, xp, current_streak, hearts を取得
  // 追加: weekly_goal_xp を取得

  // 追加: 今週の attempts を取得して xp_earned を集計
  // getWeeklyXp({ attempts, now, tzOffsetMinutes: -540 }) を呼ぶ

  return {
    // ...既存フィールド
    weeklyGoalXp: profile.weekly_goal_xp,
    weeklyXp: number,
  };
});
```

### `profile.setGoal`（新規 mutation）

```ts
setGoal: protectedProcedure
  .input(
    z.object({
      weeklyGoalXp: z.union([z.literal(50), z.literal(100), z.literal(250)]),
    }),
  )
  .mutation(async ({ ctx, input }) => {
    await ctx.supabase
      .from('profiles')
      .update({ weekly_goal_xp: input.weeklyGoalXp })
      .eq('id', ctx.user.id);
  });
```

認可: `protectedProcedure`。レート制限: 不要。

### `question.submit` を修正

attempts insert 時に `xp_earned: xpResult.total` を追加。  
戻り値に `goalAchievedThisWeek: boolean` を追加（今週初達成判定）。

```ts
// 今週 XP の変化を判定
const weeklyXpBefore = getWeeklyXp({ attempts: thisWeekAttempts, now, tzOffsetMinutes: -540 });
const weeklyXpAfter = weeklyXpBefore + xpResult.total;
const goalAchievedThisWeek =
  weeklyXpBefore < profile.weekly_goal_xp && weeklyXpAfter >= profile.weekly_goal_xp;

return {
  // ...既存フィールド
  goalAchievedThisWeek,
};
```

## UI 変更

### ホーム画面 (`apps/web/app/page.tsx`)

ヘッダ直下（ハート回復バナーの上）に週間目標進捗バーを追加。

```
┌──────────────────────────────┐
│ 📈 トレ学   🔥3  ⚡120XP ♥♥♥ │  ← 既存ヘッダ
├──────────────────────────────┤
│ 今週の目標  80 / 100 XP      │  ← 新規（達成時はグリーン背景）
│ ████████████████░░░░  80%   │
├──────────────────────────────┤
│ ❤️‍🩹 ハートを回復しよう       │  ← 既存（hearts < 5 の場合のみ）
└──────────────────────────────┘
```

**状態**:

- 未達成: グレー背景、緑プログレスバー（`ProgressBar` コンポーネント再利用）
- 達成済み: 緑背景、「今週の目標達成！🎉」テキスト

ホーム画面は Server Component のため `weeklyXp` と `weeklyGoalXp` は Server 側で計算して渡す。  
達成演出（confetti）は LearnClient.tsx 側で `goalAchievedThisWeek === true` 時に発火。

### プロフィール画面 (`apps/web/app/profile/page.tsx`)

7日グラフの上に週間目標の進捗カードを追加。「目標変更」ボタンもここに配置。

```
┌──────────────────────────────┐
│ 今週の目標                   │
│ 80 / 100 XP   ████████░░░   │
│                  [目標を変更] │
└──────────────────────────────┘
```

### 目標設定モーダル (`apps/web/components/GoalSettingModal.tsx`)（新規・Client Component）

プロフィール画面の「目標を変更」ボタンから開く。  
`'use client'` で `profile.setGoal` mutation を呼ぶ。

```
┌──────────────────────────────┐
│      週間目標を設定する       │
│                              │
│ ○ 50 XP  ● 100 XP ○ 250 XP │
│                              │
│        [保存する]             │
└──────────────────────────────┘
```

配置: `apps/web/components/GoalSettingModal.tsx`（モバイル流用予定なし）

## アクセシビリティ

- プログレスバーに `role="progressbar"`, `aria-valuenow`, `aria-valuemax` を付与
- モーダルは `role="dialog"`, `aria-modal="true"`, `aria-labelledby` を付与
- フォーカストラップ: Tab キーでモーダル内をループ
- キーボード: Escape でモーダルを閉じる
- カラーコントラスト: 達成済みテキストは `#3fa800`（AA 基準を満たす）

## アナリティクス

TBD: アナリティクス実装後に追記。

計測候補:

- `weekly_goal_achieved` { goalXp, weeklyXp }
- `goal_setting_changed` { from: number, to: number }

## テスト計画

- [ ] ユニット: `checkGoalProgress` — 0%, 50%, 100%, 超過(100%), 境界値, RangeError
- [ ] ユニット: `getWeeklyXp` — 今週分のみ加算, 先週以前を除外, 月曜起算, 空配列
- [ ] 統合: `profile.me` — `weeklyXp`, `weeklyGoalXp` が正しく返る
- [ ] 統合: `question.submit` — `xp_earned` が attempts に保存される, `goalAchievedThisWeek` の true/false
- [ ] 統合: `profile.setGoal` — 不正値（例: 30 XP）は Zod でリジェクト
- [ ] E2E (Playwright): ユニット完走 → ホーム画面で週間進捗が更新される

## ロールアウト

- フィーチャフラグ: 不要
- 既存 attempts の `xp_earned` は `0` のまま残るが、目標進捗は「今週から」計測されるため実害なし
- 段階リリース: 不要
- 監視: Sentry でモーダル保存エラーを監視

## オープンクエスチョン（解決済み）

- [x] **OQ1**: 週起算は**月曜**に決定
- [x] **OQ2**: 週間 XP は `attempts` から独自集計（`get_weekly_leaderboard` RPC とは別）
- [x] **OQ3**: 達成演出は「今週初達成時のみ」（`goalAchievedThisWeek` フラグ方式）
- [x] **OQ4**: 「目標変更」ボタンは**プロフィール画面のみ**
- [x] **OQ5**: デイリーゴールは実装しない（週間目標のみ）

## 不採用案

**デイリーゴールと週間目標を両方実装する案**  
当初 spec に含まれていたが、ユーザ判断でウィークリーのみに絞った。  
週単位のほうが学習ペースに柔軟性が生まれるため。

**attempts に xp_earned を持たず JOIN で再計算する案**  
`calculateXp` を attempts × questions JOIN で再計算すれば schema 変更不要。  
しかし difficulty が将来変わった場合に過去 XP が変化し履歴が崩れる。→ 永続化方式を採用。

**`profiles` に `weekly_xp` カラムを持つ案**  
月曜にリセットするクーロンジョブが必要で複雑度が上がる。  
→ attempts から都度集計する方針を採用。
