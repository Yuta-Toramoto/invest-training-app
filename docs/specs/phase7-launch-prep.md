# Spec: Phase 7 — 仕上げ（公開前）

## ステータス

- 起票日: 2026-05-13
- 状態: Approved
- 担当: Yuta-Toramoto
- 関連 Phase: Phase 7 (roadmap.md)

## 実装項目

1. 法務（免責文・利用規約・教育目的表記）
2. PWA 化（manifest + アイコン）
3. アクセシビリティ改善
4. エラーモニタリング（Sentry）

---

## 1. 法務

### 重要性

金融商品取引法（金商法）では「投資助言」に当たる行為（特定の投資行動を勧める）は登録が必要。本アプリは**教育・練習目的**であることを明示し、実際の投資判断に使わないよう注意喚起する。

### 実装内容

#### フッター免責文（全ページ共通）

```
※ このアプリは教育・学習目的のシミュレーションです。実際の投資を推奨するものではありません。
投資は自己責任で行ってください。
```

#### `/terms` ページ（利用規約 + 免責事項）

- 教育目的であること
- 実際の投資成果を保証しないこと
- 損失について責任を負わないこと
- 18歳以上対象

#### ログイン前バナー

初回ログイン時に利用規約同意を求めるモーダル（簡易版）。

---

## 2. PWA 化

### Next.js App Router の manifest.json

`app/manifest.ts` で Next.js の Metadata API を使用。

```ts
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'トレ学 — デイトレ学習アプリ',
    short_name: 'トレ学',
    description: 'ローソク足・チャートパターンを楽しく学ぶ',
    start_url: '/',
    display: 'standalone',
    background_color: '#f7f7f7',
    theme_color: '#58cc02',
    icons: [
      /* ... */
    ],
  };
}
```

### オフライン対応

Phase 7 ではオフライン UI は実装しない（サービスワーカーなし）。manifest のみで「ホーム画面に追加」を可能にする。

---

## 3. アクセシビリティ

### 対象箇所

- スキップリンク（`main` へジャンプ）を全ページに追加
- `DuoButton` に `aria-pressed` / フォーカスリング強化
- フィードバックシートに `role="alert"` 追加
- ハートアイコンに `aria-label` 追加（既実装確認）
- カラーコントラスト: `--green-500 (#58cc02)` on white → 3.0:1（WCAG AA Large テキスト OK）

---

## 4. エラーモニタリング（Sentry）

### セットアップ

- パッケージ: `@sentry/nextjs`
- Sentry プロジェクト作成（無料枠、Next.js テンプレート）
- `SENTRY_DSN` を `.env.local` と Vercel に追加
- `sentry.client.config.ts` / `sentry.server.config.ts` を追加

### 設定方針

- `tracesSampleRate: 0.1`（本番は 10% サンプリング）
- ユーザー PII は送らない（`sendDefaultPii: false`）
- ソースマップは Vercel ビルド時に自動送信

---

## 実装ファイル

```
apps/web/
├── app/
│   ├── manifest.ts           ← PWA manifest
│   ├── terms/page.tsx        ← 利用規約・免責事項
│   └── layout.tsx            ← フッター追加
├── components/
│   └── Footer.tsx            ← 免責フッター
├── sentry.client.config.ts
├── sentry.server.config.ts
└── sentry.edge.config.ts
```
