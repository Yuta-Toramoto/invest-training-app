# Architecture Decision Records (ADR)

設計上の重要な決定を時系列で記録します。

## ADR とは

> An Architecture Decision Record is a document that captures an important architectural decision made along with its context and consequences.

「なぜこうしたか」を残しておくと、半年後の自分・新メンバー・Claude Code が同じ議論を繰り返さずに済みます。

## いつ書くか

- 技術スタックを選定したとき
- ライブラリを採用 / 不採用にしたとき
- 大きな設計判断（DB スキーマの大変更、認証方式変更など）
- トレードオフのある決定をしたとき

## 書き方

1. `0001-monorepo.md` を参考に、`000N-<短い名前>.md` の連番で作成
2. テンプレ:

```markdown
# ADR-000N: <タイトル>

- 日付: YYYY-MM-DD
- 状態: Proposed | Accepted | Deprecated | Superseded by ADR-XXXX

## コンテキスト
なぜこの決定が必要になったか。背景。

## 検討した選択肢
- 案1: 利点 / 欠点
- 案2: 利点 / 欠点
- 案3: 利点 / 欠点

## 決定
何を選んだか。

## 結果
この決定によってどう動くか。具体的な行動指針。

## ロールバック条件
この決定を見直すべきタイミング。
```

3. PR と一緒にマージ
4. 後で覆す場合は元の ADR を `Deprecated` にし、新規 ADR で `Superseded by ADR-XXXX` と明記

## 一覧

- [ADR-0001](./0001-monorepo.md) — モノレポ構成と Turborepo の採用
