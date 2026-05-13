# Spec: Phase 6 — 進捗・ゲーミフィケーション

## ステータス

- 起票日: 2026-05-13
- 状態: Approved
- 担当: Yuta-Toramoto
- 関連 Phase: Phase 6 (roadmap.md)

## 実装機能

1. **ホーム画面 — レッスン/ユニットツリー**
2. **公開プロフィールページ**
3. **ハート回復（復習問題正解で +1）**
4. **週次リーダーボード**

---

## 1. ホーム画面 (`/`)

### 現状

`/` は空のページ。ログイン後のランディングがない。

### デザイン（Duolingo 風ジグザグパス）

```
  [🏠 ホーム]  XP: 230  🔥 3  ❤️ 5

     (  🌱  )   ← レッスン見出しノード
        |
     [★] 基本パターンを見極める    ← ユニットボタン（完了: 緑）
        |
     [★] ピンバーを使いこなす      ← ユニットボタン（未完了: グレー）
        |
        ↓ (次のレッスンへ続く)
```

- ユニット完了判定: そのユニットの全問題に 1 回以上回答済み
- 未完了ユニットはタップ可能（学習開始）
- ロック機能は今フェーズでは実装しない（全ユニット自由に選択可）

### tRPC 追加

```ts
lesson.listWithProgress: protectedProcedure → LessonWithProgress[]
```

```ts
type UnitProgress = {
  unitId: string;
  title: string;
  order: number;
  totalQuestions: number;
  answeredQuestions: number; // ユーザの回答済み問題数
  completed: boolean; // answeredQuestions >= totalQuestions
};

type LessonWithProgress = {
  id: string;
  title: string;
  order: number;
  difficulty: number;
  units: UnitProgress[];
};
```

---

## 2. 公開プロフィールページ (`/profile`)

自分のプロフィールのみ（Phase 6 では `/profile` = 自分）。

### 表示内容

- アバター（initials で代替）
- 表示名 / XP / ストリーク
- 正答率（全 attempts の平均）
- 回答済み問題数
- 最近の学習履歴（直近 7 日の日別正解数）

### tRPC 追加

```ts
profile.stats: protectedProcedure → ProfileStats
```

---

## 3. ハート回復

### 仕様

- ハートが 5 未満のとき、ホーム画面に「ハートを回復する」バナーを表示
- タップすると `/review` ページへ遷移
- `/review`: 過去に不正解だった問題を 1 問出題
- 正解 → ハート +1（上限 5）
- 不正解 → ハートは変わらない（回答の記録は残る）
- question.submit の既存ロジックを流用

### tRPC 追加

```ts
question.getReview: protectedProcedure → QuestionOutput | null
// 過去に lastIsCorrect=false の問題をランダムに 1 問返す
// なければ null（回復不要）
```

### DB 変更なし

既存の `attempts` テーブルで対応。

---

## 4. 週次リーダーボード (`/leaderboard`)

### 仕様

- 当週（月曜 00:00 JST 〜 日曜 23:59 JST）の獲得 XP ランキング
- 上位 20 名を表示
- 自分の順位をハイライト
- リーグ表示: 1〜3位 Gold、4〜10位 Silver、それ以外 Bronze（アイコンのみ）
- XP は `attempts.answered_at` の週次集計で算出（profiles.xp とは別）

### SQL クエリ（Supabase view or RPC）

```sql
-- 週次 XP を attempts から集計
SELECT
  p.id,
  p.display_name,
  COUNT(CASE WHEN a.is_correct THEN 1 END) * 10 AS weekly_xp
FROM profiles p
LEFT JOIN attempts a ON a.user_id = p.id
  AND a.answered_at >= date_trunc('week', NOW() AT TIME ZONE 'Asia/Tokyo')
GROUP BY p.id, p.display_name
ORDER BY weekly_xp DESC
LIMIT 20;
```

Supabase の `execute_sql` または RPC function として実装。

### tRPC 追加

```ts
profile.leaderboard: protectedProcedure → LeaderboardEntry[]
```

---

## 実装ファイル

```
apps/web/
├── app/
│   ├── page.tsx                  ← ホーム（ツリー）
│   ├── profile/page.tsx          ← プロフィール
│   ├── review/page.tsx           ← ハート回復
│   └── leaderboard/page.tsx      ← リーダーボード
└── server/routers/
    ├── lesson.ts                 ← listWithProgress 追加
    ├── profile.ts                ← stats, leaderboard 追加
    └── question.ts               ← getReview 追加
```
