# Spec: Phase 2 — 認証 & データベース

## ステータス

- 起票日: 2026-05-13
- 状態: Implemented
- 担当: Yuta-Toramoto
- 関連 Phase: Phase 2 (roadmap.md)

## 概要

Supabase を使った認証基盤と Drizzle ORM を用いたデータベース層を構築する。
ユーザがメールアドレスまたは Google アカウントでログインし、学習進捗（XP・ストリーク・ハート）が永続化される状態を実現する。

## 動機

Phase 1 で土台（モノレポ・CI・Vercel）が整った。Phase 3（コアロジック）・Phase 4（学習 UI）に進むには、ユーザ識別と進捗永続化が前提として必要。roadmap.md Phase 2 に対応。

## 既存の関連実装

- `packages/db/src/index.ts` — プレースホルダのみ（スキーマ未定義）
- `packages/types/src/` — 共通型（未整備）
- `apps/web/app/` — Next.js App Router（認証ミドルウェア未設定）

---

## Step 2.1: Supabase プロジェクト & 認証

### Supabase プロジェクト作成

- リージョン: `ap-northeast-1`（東京）
- プラン: 無料
- プロジェクト名: `invest-training-app`

### 認証プロバイダ

| プロバイダ              | 用途               | 備考                      |
| ----------------------- | ------------------ | ------------------------- |
| Email（確認メールあり） | 主要ログイン       | Supabase Auth デフォルト  |
| Google OAuth            | ソーシャルログイン | Supabase Dashboard で設定 |

### Next.js 認証連携 (`@supabase/ssr`)

`@supabase/ssr` を使い、Cookie ベースのセッション管理を実装する（JWT トークンをクライアント `localStorage` に置かない）。

```
apps/web/
├── lib/supabase/
│   ├── server.ts        # createServerClient (Server Components / Route Handlers)
│   └── client.ts        # createBrowserClient (Client Components)
├── middleware.ts         # セッション更新 (matcher: 全ルート)
└── app/
    ├── (auth)/
    │   ├── login/page.tsx
    │   ├── signup/page.tsx
    │   └── callback/route.ts   # OAuth コールバック
    └── (protected)/     # 認証必須ルートグループ
```

### 環境変数

```bash
# apps/web/.env.local
NEXT_PUBLIC_SUPABASE_URL=https://<ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
```

サーバーサイドのみの Secret は不要（Service Role Key は使わない）。

---

## Step 2.2: Drizzle スキーマ設計

### パッケージ構成 (`packages/db`)

```
packages/db/
├── src/
│   ├── schema/
│   │   ├── profiles.ts
│   │   ├── lessons.ts
│   │   ├── units.ts
│   │   ├── questions.ts
│   │   ├── attempts.ts
│   │   └── index.ts        # re-export
│   ├── index.ts            # db client export
│   └── migrate.ts          # migration runner
├── drizzle.config.ts
└── package.json
```

### テーブル定義

#### `profiles`

```ts
export const profiles = pgTable('profiles', {
  id: uuid('id').primaryKey(), // auth.users.id と同一
  displayName: text('display_name').notNull(),
  avatarUrl: text('avatar_url'),
  xp: integer('xp').notNull().default(0),
  currentStreak: integer('current_streak').notNull().default(0),
  hearts: integer('hearts').notNull().default(5),
  lastActiveAt: timestamp('last_active_at', { withTimezone: true }),
  role: text('role', { enum: ['user', 'admin'] })
    .notNull()
    .default('user'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
```

#### `lessons`

```ts
export const lessons = pgTable('lessons', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: text('slug').notNull().unique(),
  title: text('title').notNull(),
  description: text('description'),
  order: integer('order').notNull(),
  difficulty: integer('difficulty').notNull().default(1), // 1-5
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
```

#### `units`

```ts
export const units = pgTable('units', {
  id: uuid('id').primaryKey().defaultRandom(),
  lessonId: uuid('lesson_id')
    .notNull()
    .references(() => lessons.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  order: integer('order').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
```

#### `questions`

```ts
export const questions = pgTable('questions', {
  id: uuid('id').primaryKey().defaultRandom(),
  unitId: uuid('unit_id')
    .notNull()
    .references(() => units.id, { onDelete: 'cascade' }),
  type: text('type', { enum: ['chart', 'order_book', 'volume'] })
    .notNull()
    .default('chart'),
  chartImageUrl: text('chart_image_url'),
  orderBookImageUrl: text('order_book_image_url'),
  volumeImageUrl: text('volume_image_url'),
  prompt: text('prompt').notNull(),
  choices: jsonb('choices').notNull(), // { id, label }[]
  correctChoiceId: text('correct_choice_id').notNull(),
  explanation: text('explanation').notNull(),
  tags: text('tags').array().notNull().default([]),
  difficulty: integer('difficulty').notNull().default(1), // 1-5
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
```

#### `attempts`

```ts
export const attempts = pgTable('attempts', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(), // auth.users.id 参照
  questionId: uuid('question_id')
    .notNull()
    .references(() => questions.id, { onDelete: 'cascade' }),
  selectedChoiceId: text('selected_choice_id').notNull(),
  isCorrect: boolean('is_correct').notNull(),
  timeTakenMs: integer('time_taken_ms'),
  answeredAt: timestamp('answered_at', { withTimezone: true }).defaultNow().notNull(),
});
```

### インデックス

```sql
CREATE INDEX ON attempts(user_id, answered_at DESC);
CREATE INDEX ON attempts(question_id);
CREATE INDEX ON units(lesson_id);
CREATE INDEX ON questions(unit_id);
```

### RLS ポリシー

| テーブル    | 操作                 | 許可条件                              |
| ----------- | -------------------- | ------------------------------------- |
| `profiles`  | SELECT               | `auth.uid() = id`                     |
| `profiles`  | UPDATE               | `auth.uid() = id`                     |
| `profiles`  | INSERT               | `auth.uid() = id`（trigger 経由のみ） |
| `lessons`   | SELECT               | 全認証ユーザ                          |
| `units`     | SELECT               | 全認証ユーザ                          |
| `questions` | SELECT               | 全認証ユーザ                          |
| `questions` | INSERT/UPDATE/DELETE | `role = 'admin'`                      |
| `attempts`  | SELECT               | `auth.uid() = user_id`                |
| `attempts`  | INSERT               | `auth.uid() = user_id`                |

### `profiles` 自動作成トリガー

新規ユーザ登録時に `auth.users` → `profiles` を自動 INSERT する Postgres Trigger。

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

---

## ドメインロジック（Phase 3 の前段）

今フェーズでは `packages/core` への追加はなし。DB クライアントを `packages/db` で完結させる。

---

## UI 変更

```
/login     ← メール + Google ログイン
/signup    ← メール新規登録
/          ← (protected) ログイン済みのみ表示
```

認証ページはシンプルなフォームのみ（Duolingo 風 UI は Phase 4 で整備）。

---

## テスト計画

- [ ] ユニット: スキーマ定義の型チェック（Vitest + drizzle-zod）
- [ ] 統合: Supabase ローカルエミュレータでの RLS 動作確認（Phase 4 以降）
- [ ] 手動: ログイン → profile 自動作成の動作確認

---

## 実装順序

1. Supabase プロジェクト作成（MCP 経由）
2. `packages/db` に Drizzle + drizzle-kit 設定
3. スキーマファイル作成 → `drizzle-kit generate` → Supabase に apply
4. RLS ポリシーとトリガー適用
5. `apps/web` に `@supabase/ssr` 設定・middleware
6. ログイン/サインアップページ実装
7. 環境変数を Vercel に設定

---

## オープンクエスチョン

- [ ] Google OAuth のクライアント ID/Secret は今すぐ設定するか、Email のみ先行か
- [ ] Drizzle migration は `drizzle-kit push`（直接 apply）か `drizzle-kit generate` + SQL ファイル管理か

## 不採用案

- **Prisma**: Drizzle の方が Edge Runtime 対応・型安全性で優位。CLAUDE.md で Drizzle 採用済み。
- **NextAuth.js**: Supabase Auth で完結できるため不要。tRPC との連携もシンプルになる。
