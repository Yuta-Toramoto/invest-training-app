---
description: docs/specs/ に新機能の spec ファイル雛形を作る。引数は機能名（kebab-case）。
---

引数: $ARGUMENTS

`docs/specs/_template.md` をベースに、`docs/specs/$ARGUMENTS.md` を作成してください。

その際に:

1. CLAUDE.md と roadmap.md を読み、このプロジェクトの現在のフェーズと既存パターンを把握する
2. `packages/core` と `packages/db/src/schema` を確認し、既存の関連実装を spec の「既存の関連実装」セクションに列挙
3. 「データモデル変更」「ドメインロジック」「API 変更」「UI 変更」を、このプロジェクトの規約に沿って具体的に記述
4. 不明な箇所は "TBD: <質問>" として明記し、実装には進まない

**重要**: spec が承認されるまで実装コードは書かないでください。spec をレビューしてもらう前提です。
