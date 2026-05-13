# Spec: Phase 4 — Duolingo 風 学習 UI

## ステータス

- 起票日: 2026-05-13
- 状態: Draft
- 担当: Yuta-Toramoto
- 関連 Phase: Phase 4 (roadmap.md)

## 概要

Duolingo を直接想起させる学習 UI を実装する。スマホで指 1 本で 1 ユニット（5〜10問）を完走できる体験が目標。ゲーミフィケーション（ハート・XP・紙吹雪）で「もう一問やろう」という気にさせる。

## 美的方向性（frontend-design スキル準拠）

**トーン:** Playful / Toy-like — 丸みのある角、大胆な影、跳ね感のある遷移
**記憶に残る一点:** 3D 押し込みボタン（押すと 4px 沈み込み、影が縮む）
**フォント:** Nunito（既設定）— 丸みがあり学習アプリに最適
**カラー:** ブランドカラーをそのまま使用。背景は `#f7f7f7`（既設定）

---

## Step 4.1: デザインシステム (`packages/ui`)

### `<DuoButton>`

```tsx
// props
type DuoButtonProps = {
  variant: 'green' | 'red' | 'blue' | 'gray';
  size?: 'sm' | 'md' | 'lg';
  selected?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
};
```

**スタイル仕様:**

- 背景: variant カラー
- 下辺シャドウ: `box-shadow: 0 4px 0 <darker-variant>` （3D 効果）
- クリック時: `translateY(4px)` + shadow を `0 0 0` に縮小
- border-radius: `rounded-xl` (12px)
- フォント: Nunito bold

### `<HeartBar>`

ハートを 5 個並べて表示。残りハート数に応じて色が変わる（赤 → グレー）。
ハート減少時に Framer Motion でシェイクアニメーション。

### `<XpBar>`

現在 XP / 次レベルまでの XP をプログレスバーで表示。
XP 獲得時にバーがアニメーションで伸びる。

### `<ProgressBar>`

1ユニット内の進捗（例: 3/8問）。緑のバーが左から伸びる。

---

## Step 4.2: 学習画面 (`/learn/[unitId]`)

### レイアウト（モバイルファースト、375px 基準）

```
┌─────────────────────────────┐
│ [×]  ████████░░░░  ❤❤❤❤❤   │  ← HUD (高さ 56px)
├─────────────────────────────┤
│                             │
│  チャート画像               │  ← メインカード
│  （タップで拡大）           │     (flex-grow)
│                             │
│  [チャート] [板] [出来高]   │  ← タブ切替
│                             │
│  「この場面、あなたなら？」  │  ← prompt テキスト
│                             │
├─────────────────────────────┤
│  [🟢 買い]                  │
│  [🔴 空売り]                │  ← 3択ボタン
│  [⬜ 見送り]                │
└─────────────────────────────┘
```

### 状態遷移

```
idle（問題表示）
  ↓ ボタンタップ
answering（選択済み、送信中）
  ↓ API レスポンス
correct（正解フィードバック）または incorrect（不正解フィードバック）
  ↓ 「次へ」タップ
idle（次の問題）または unitComplete（全問終了）
```

### フィードバックシート（画面下から slide-up）

**正解:**

- 背景: `--green-500`
- テキスト: 「すばらしい！」
- XP 獲得数表示
- 紙吹雪（canvas-confetti）
- 効果音（Web Audio API、小さな正解音）

**不正解:**

- 背景: `--red-500`
- テキスト: 「残念！」
- 正解と解説を表示
- ハート -1（シェイクアニメーション）

### ユニット完了画面

```
┌─────────────────────────────┐
│        🎉 ユニット完了！     │
│                             │
│   獲得 XP: +120             │
│   正答率: 80%               │
│   所要時間: 3:24            │
│                             │
│   [ホームに戻る]            │
└─────────────────────────────┘
```

---

## 追加パッケージ（承認必要）

| パッケージ        | 用途                               | 備考        |
| ----------------- | ---------------------------------- | ----------- |
| `framer-motion`   | 遷移・フィードバックアニメーション | 必須        |
| `canvas-confetti` | 正解時の紙吹雪                     | 軽量（8KB） |

---

## 実装ファイル一覧

```
packages/ui/src/
├── DuoButton.tsx
├── HeartBar.tsx
├── XpBar.tsx
├── ProgressBar.tsx
└── index.ts （re-export）

apps/web/app/
├── learn/
│   └── [unitId]/
│       ├── page.tsx           ← Server Component（問題取得）
│       └── LearnClient.tsx    ← Client Component（UI 制御）
└── (protected)/               ← middleware で保護済み
```

---

## テスト計画（手動）

- スマホブラウザ（Chrome Mobile シミュレータ）で 1 ユニット完走
- ハートが 0 になったとき UI が止まらないことを確認
- XP バーが正しく伸びることを確認

---

## オープンクエスチョン

- [ ] ハートが 0 になったとき：ユニット強制終了か、そのまま継続か（Phase 4 では継続で OK）
- [ ] 効果音：実装するか（Web Audio API は手軽だが音源が必要）
- [ ] チャート画像：テスト用プレースホルダー画像を用意するか

## 不採用案

- **Lottie アニメーション**: ファイルサイズと依存が重い。canvas-confetti で代替。
- **CSS keyframes だけで 3D ボタン**: Framer Motion の方が押し込みと解放がスムーズ。
