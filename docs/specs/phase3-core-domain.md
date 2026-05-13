# Spec: Phase 3 — コアドメイン & tRPC API

## ステータス

- 起票日: 2026-05-13
- 状態: Approved
- 担当: Yuta-Toramoto
- 関連 Phase: Phase 3 (roadmap.md)

## 概要

`packages/core` に React/Next.js 非依存の純粋 TypeScript でドメインロジック（XP・ストリーク・SRS）を実装し、tRPC ルーターで `apps/web` に公開する。Phase 4 の学習 UI と Phase 10 のモバイル移植の基盤となる。

## 動機

Phase 2 で認証・DB が整った。Phase 4（学習 UI）を作るには「回答を受け取って XP を計算し、次の問題を返す」API が必要。ロジックを `packages/core` に閉じておくことでモバイル移植時にそのまま再利用できる。

---

## 1. XP 計算ロジック (`packages/core/src/xp/`)

### 仕様

| 条件                     | XP                |
| ------------------------ | ----------------- |
| 正解（基本）             | `difficulty × 10` |
| 速さボーナス（10秒以内） | +5                |
| 速さボーナス（5秒以内）  | +10（上記と排他） |
| 不正解                   | 0                 |

difficulty は 1〜5 の整数。

### シグネチャ

```ts
// packages/core/src/xp/calculateXp.ts
export type XpInput = {
  isCorrect: boolean;
  difficulty: number; // 1-5
  timeTakenMs: number;
};

export type XpResult = {
  base: number;
  speedBonus: number;
  total: number;
};

export function calculateXp(input: XpInput): XpResult;
```

### エッジケース

- `isCorrect === false` → `{ base: 0, speedBonus: 0, total: 0 }`
- `difficulty` が 1〜5 範囲外 → エラーをスロー
- `timeTakenMs < 0` → エラーをスロー

---

## 2. ストリーク判定 (`packages/core/src/streak/`)

### 仕様

- 「前日（ユーザのローカル日付）に学習した」場合にストリークを継続
- 「今日すでに学習済み」の場合はストリークを変更しない（二重カウント防止）
- 「2日以上空いた」場合はストリークを 1 にリセット
- タイムゾーンは呼び出し元が UTC オフセット（分）として渡す

### シグネチャ

```ts
// packages/core/src/streak/updateStreak.ts
export type StreakInput = {
  currentStreak: number;
  lastActiveAt: Date | null; // UTC
  now: Date; // UTC
  tzOffsetMinutes: number; // 例: JST = -540
};

export type StreakResult = {
  newStreak: number;
  streakUpdated: boolean; // 今回のアクセスでストリークが変化したか
};

export function updateStreak(input: StreakInput): StreakResult;
```

### エッジケース

- `lastActiveAt === null`（初回）→ `newStreak = 1`
- `currentStreak < 0` → エラーをスロー

---

## 3. 簡易 SRS (`packages/core/src/srs/`)

### 仕様

不正解問題を優先して次の出題問題を選ぶ。完全な SM-2 は Phase 6 以降で導入し、今フェーズはシンプルな優先度キュー方式とする。

**優先順位:**

1. 直近で不正解だった問題（`isCorrect === false`）
2. まだ一度も回答していない問題
3. 正解済みの問題（正答率が低い順）

### シグネチャ

```ts
// packages/core/src/srs/selectNextQuestion.ts
export type QuestionStats = {
  questionId: string;
  attemptCount: number;
  correctCount: number;
  lastIsCorrect: boolean | null; // null = 未回答
};

export function selectNextQuestion(questionIds: string[], stats: QuestionStats[]): string; // 次に出題する questionId
```

### エッジケース

- `questionIds` が空 → エラーをスロー
- `questionIds` に含まれない questionId が `stats` にある → 無視する

---

## 4. tRPC ルーター (`apps/web/server/`)

### パッケージ構成

```
apps/web/
├── server/
│   ├── trpc.ts          # initTRPC, context
│   ├── router.ts        # appRouter (root)
│   └── routers/
│       ├── profile.ts   # profile.me
│       ├── lesson.ts    # lesson.list
│       └── question.ts  # question.getNext, question.submit
└── app/api/trpc/[trpc]/route.ts   # Next.js App Router ハンドラ
```

### 追加パッケージ

| パッケージ              | 用途                  |
| ----------------------- | --------------------- |
| `@trpc/server`          | tRPC サーバー         |
| `@trpc/client`          | tRPC クライアント     |
| `@trpc/react-query`     | React Query 連携      |
| `@tanstack/react-query` | データフェッチ        |
| `zod`                   | 入力バリデーション    |
| `superjson`             | Date 等のシリアライズ |

### プロシージャ一覧

#### `profile.me` — 自分のプロフィール取得

```ts
// input: なし（auth から uid 取得）
// output:
type ProfileOutput = {
  id: string;
  displayName: string;
  xp: number;
  currentStreak: number;
  hearts: number;
};
```

#### `lesson.list` — レッスン一覧

```ts
// input: なし
// output: Lesson[]
type Lesson = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  order: number;
  difficulty: number;
};
```

#### `question.getNext` — 次の問題取得

```ts
// input:
type GetNextInput = { unitId: string };
// output:
type QuestionOutput = {
  id: string;
  type: 'chart' | 'order_book' | 'volume';
  chartImageUrl: string | null;
  prompt: string;
  choices: { id: string; label: string }[];
  difficulty: number;
  // correctChoiceId は返さない（クライアントに漏らさない）
};
```

SRS ロジック（`selectNextQuestion`）で次問を決定。

#### `question.submit` — 回答送信

```ts
// input:
type SubmitInput = {
  questionId: string;
  selectedChoiceId: string;
  timeTakenMs: number;
};
// output:
type SubmitOutput = {
  isCorrect: boolean;
  correctChoiceId: string;
  explanation: string;
  xpGained: number; // calculateXp の結果
  newTotalXp: number;
  streakResult: { newStreak: number; streakUpdated: boolean };
};
```

回答送信時に:

1. `attempts` に INSERT
2. `calculateXp` で XP 計算
3. `updateStreak` でストリーク更新
4. `profiles` の xp・currentStreak・hearts・lastActiveAt を UPDATE

### 認可ルール

- 全プロシージャ: `protectedProcedure`（未認証は 401）
- `question.getNext` / `question.submit`: unitId が存在するかチェック

---

## テスト計画

- [ ] `calculateXp`: 全ケース（正解/不正解、速さボーナス、エッジケース）
- [ ] `updateStreak`: 初回・継続・リセット・二重カウント・TZ 考慮
- [ ] `selectNextQuestion`: 未回答優先・不正解優先・正解済み順序

tRPC プロシージャのテストは Phase 4 以降（Supabase ローカルエミュレータ環境が整ってから）。

---

## 実装順序

1. `packages/core/src/xp/calculateXp.ts` + テスト
2. `packages/core/src/streak/updateStreak.ts` + テスト
3. `packages/core/src/srs/selectNextQuestion.ts` + テスト
4. tRPC パッケージを `apps/web` に追加
5. `apps/web/server/` に trpc.ts / router.ts / routers/\* 実装
6. `apps/web/app/api/trpc/[trpc]/route.ts` 実装
7. `DATABASE_URL` を `.env.local` と Vercel に追加

---

## オープンクエスチョン

- [ ] XP の速さボーナス閾値（5秒・10秒）はこれでよいか
- [ ] ハートの減少（不正解時 -1）は `question.submit` で行うか

## 不採用案

- **REST API**: CLAUDE.md で tRPC 採用済み。型安全・自動補完の観点から tRPC 一択。
- **SM-2 完全実装**: 今フェーズでは過剰。優先度キュー方式で MVP を優先。
