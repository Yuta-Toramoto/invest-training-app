# Spec: Phase 5 — 管理画面（コンテンツ投入）

## ステータス

- 起票日: 2026-05-13
- 状態: Draft
- 担当: Yuta-Toramoto
- 関連 Phase: Phase 5 (roadmap.md)

## 概要

`role = 'admin'` のユーザだけがアクセスできる管理画面を実装する。チャート画像のアップロードと問題の作成・一覧・統計表示が目的。これがないと自分が「教材作成者」になれない。

## 認可設計

### 二重防御

1. **middleware**: `/admin/*` へのアクセス時に Supabase から profile.role を取得し、`admin` 以外は `/` にリダイレクト
2. **RLS**: questions テーブルの INSERT/UPDATE/DELETE は `role = 'admin'` のみ（Phase 2 で設定済み）

### 自分を admin にする方法

Supabase Dashboard → Table Editor → profiles → 自分の row の `role` カラムを `admin` に更新。

---

## 画面構成

```
/admin
└── /admin/questions
    ├── 一覧（正答率・回答数付き）
    └── /admin/questions/new    ← 問題作成
    └── /admin/questions/[id]   ← 編集（Phase 5 では省略可）
```

---

## Step 5.1: Supabase Storage セットアップ

- バケット名: `chart-images`
- アクセス: 認証ユーザ全員が読み取り可、admin のみ書き込み可
- ポリシー:
  - SELECT: `authenticated`
  - INSERT: `role = 'admin'`

---

## Step 5.2: 問題作成フォーム (`/admin/questions/new`)

### フォーム項目

| フィールド      | 型                     | 説明                                |
| --------------- | ---------------------- | ----------------------------------- |
| lesson          | select                 | レッスン選択                        |
| unit            | select                 | ユニット選択（lesson 連動）         |
| type            | select                 | chart / order_book / volume         |
| chartImageUrl   | file upload            | Supabase Storage に直接アップロード |
| prompt          | textarea               | 問題文                              |
| choices         | 動的リスト             | 選択肢（id + label）最大4件         |
| correctChoiceId | radio                  | 正解を選ぶ                          |
| explanation     | textarea               | 解説文                              |
| tags            | text (comma-separated) | タグ                                |
| difficulty      | 1〜5 スライダー        | 難易度                              |

### 画像アップロード

- Supabase JS Client (`createBrowserClient`) で直接 Storage にアップロード
- `chart-images/<uuid>.<ext>` の形式で保存
- アップロード後に公開 URL を `chart_image_url` に設定

---

## Step 5.3: 問題一覧 (`/admin/questions`)

### 表示項目

| カラム               | データソース             |
| -------------------- | ------------------------ |
| 問題文（先頭50文字） | questions.prompt         |
| ユニット名           | units.title              |
| 難易度               | questions.difficulty     |
| 回答数               | COUNT(attempts)          |
| 正答率               | AVG(attempts.is_correct) |

Server Component で Supabase から JOIN して取得。

---

## 実装ファイル

```
apps/web/
├── middleware.ts               ← /admin/* の role チェックを追加
└── app/
    └── admin/
        ├── layout.tsx          ← admin 専用レイアウト
        └── questions/
            ├── page.tsx        ← 問題一覧（Server Component）
            └── new/
                ├── page.tsx    ← フォームページ
                └── actions.ts  ← Server Actions（DB INSERT）
```

---

## テスト計画（手動）

- [ ] 非 admin ユーザでアクセス → `/` にリダイレクトされる
- [ ] admin ユーザで問題作成 → 問題一覧に表示される
- [ ] 作成した問題が `/learn/[unitId]` で出題される

---

## オープンクエスチョン

- [ ] 問題の編集・削除は今フェーズで実装するか（最低限 new のみで十分か）
- [ ] 選択肢は固定3択（買い/空売り/見送り）のテンプレートを用意するか、自由入力か
- [ ] 画像プレビューはアップロード前に表示するか

## 不採用案

- **tRPC mutation で問題作成**: フォームファイルアップロードは Server Action の方がシンプル。
- **外部 CMS (Contentful 等)**: コスト・複雑性が過剰。Supabase で完結する。
