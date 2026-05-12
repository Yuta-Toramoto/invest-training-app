---
name: duolingo-ui
description: Duolingo 風のポップな UI を作るための色トークン、コンポーネント規約、アニメーションパターン、効果音アセットの規約を定義。学習画面・正解/不正解演出・ボタン・進捗表示など UI コンポーネントの実装タスクで自動起動する。
---

# Duolingo 風 UI 規約

## カラートークン（CSS 変数）

`packages/ui/src/tokens.css` で定義。Tailwind から `bg-[var(--green-500)]` 等で参照。

```css
:root {
  /* Primary */
  --green-500: #58CC02;  /* 正解、進行 */
  --green-600: #46A302;  /* hover */
  --green-shadow: #4FB300; /* 3D 影 */

  --red-500: #FF4B4B;    /* 不正解、ハート */
  --red-600: #E63E3E;
  --red-shadow: #CC3838;

  --blue-500: #1CB0F6;   /* 情報、リンク */
  --blue-600: #1899D6;
  --blue-shadow: #1583BC;

  --yellow-500: #FFC800; /* XP、ストリーク */
  --yellow-600: #E6B400;

  /* Neutral */
  --gray-50: #F7F7F7;
  --gray-100: #E5E5E5;
  --gray-300: #AFAFAF;
  --gray-500: #777777;
  --gray-900: #3C3C3C;

  /* Surface */
  --bg: #FFFFFF;
  --bg-elevated: #F7F7F7;
  --border: #E5E5E5;
}
```

**禁止**: Tailwind デフォルトの `bg-green-500` 等を直接使用。必ず CSS 変数経由。

## タイポグラフィ

- フォント: **Nunito** (Google Fonts, weight 400/700/800)
- 見出し: `font-extrabold`（800）
- 本文: `font-bold`（700）が基本（Duolingo は本文も太い）
- 数字（XP、スコア）: tabular-nums で揃える

## 主要コンポーネント

### `<DuoButton>`

3D 影付きボタン。**全ての主要 CTA でこれを使う**。

```tsx
<DuoButton variant="primary" size="lg" onPress={...}>
  続ける
</DuoButton>
```

- `variant`: `primary` (緑) / `danger` (赤) / `secondary` (白+灰枠) / `info` (青)
- 静止時: 下に 4px の影
- hover: 影が 5px に
- active (押下): `translate-y-[2px]`、影が 2px に縮む（押し込まれる感）
- disabled: グレー、影なし

```tsx
className="
  font-extrabold uppercase tracking-wide
  rounded-2xl px-6 py-3
  bg-[var(--green-500)] text-white
  border-b-4 border-[var(--green-shadow)]
  active:translate-y-[2px] active:border-b-2
  transition-all
"
```

### `<ChoiceButton>` (問題の選択肢)

`<DuoButton variant="secondary">` をベースに、選択時に青枠、正解判定後に緑/赤に変化。

### `<HeartBar>`

最大 5 ハート。失った分はグレーアウト。アイコン: `lucide-react` の `Heart` を fill 切替。

### `<XpBar>`

緑のグラデーション、満タンで光るエフェクト。レベルアップ時 Framer Motion でスケール+回転。

### `<StreakFlame>`

オレンジ〜赤のグラデーション炎アイコン、日数を中央に大きく表示。0 日の時はグレー。

## アニメーション規約

Framer Motion を使用。**variants 名は以下に統一**:

| variant | 用途 |
|---|---|
| `fadeInUp` | カード・シートの出現 |
| `pop` | XP 加算時のスケール（scale: 0 → 1.2 → 1） |
| `shake` | 不正解時のヘッダ揺れ |
| `slideUpSheet` | 画面下から結果シート出現 |
| `confettiBurst` | 正解時の紙吹雪（canvas-confetti or Lottie） |

```ts
// packages/ui/src/animations.ts
export const variants = {
  fadeInUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.3, ease: "easeOut" },
  },
  pop: { ... },
  // ...
}
```

## 効果音

`apps/web/public/sounds/` に配置:

| ファイル | 用途 |
|---|---|
| `correct.mp3` | 正解（明るい "ピンポーン"） |
| `wrong.mp3` | 不正解（柔らかい "ブッ"） |
| `levelup.mp3` | レベルアップ |
| `streak.mp3` | ストリーク継続 |

**音量制御**: ユーザ設定で OFF にできるようにする（デフォルト OFF が望ましい、初回起動時に「音を有効にする？」ダイアログ）。

## Lottie アセット

`apps/web/public/lottie/`:
- `confetti.json` — 正解時の紙吹雪
- `streak-flame.json` — ストリーク継続アニメ
- `levelup.json` — レベルアップ

ライセンス: Lottiefiles の Free ライセンスのもののみ。出典コメントを公開ページに記載。

## レイアウト原則

- **モバイルファースト**。デザインは 375px (iPhone SE) から組む
- セーフエリア対応（`pb-[env(safe-area-inset-bottom)]`）
- 学習画面は **常に縦スクロールなし**で 1 画面に収める
- 主要 CTA は画面下部固定
- 配色は **背景が白、アクセントが緑**を基本に（暗くしすぎると Duolingo らしさが消える）

## アクセシビリティ

- すべての button に `aria-label`
- カラーだけで状態を伝えない（正解/不正解はアイコンも併用）
- フォーカスリングを潰さない（`focus-visible:ring-4 ring-[var(--blue-500)]`）
- 触覚フィードバック（モバイル）: `navigator.vibrate?.(...)` を正解/不正解で

## やってはいけないこと

- ダークモードを最初から作らない（MVP 後）
- 角を尖らせない（`rounded-2xl` か `rounded-3xl` が基本）
- 影を CSS の `box-shadow` でぼかして付けない（Duolingo は **下に単色の硬い影**）
- グラデーションを多用しない（ボタンは単色、影で立体感）
- セリフ体・細フォント禁止
