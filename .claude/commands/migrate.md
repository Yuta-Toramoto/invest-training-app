---
description: Drizzle のマイグレーション生成・適用・検証を一気通貫で行う。
---

以下を順番に実行してください:

1. `packages/db/src/schema/` の最新スキーマを確認
2. `pnpm --filter @invest-training/db drizzle-kit generate` でマイグレーションファイル生成
3. 生成された SQL を `packages/db/src/migrations/` から読み、**破壊的変更（DROP / 型変更 / NOT NULL 追加など）が含まれていないか確認**
4. 破壊的変更がある場合、影響範囲とロールバック手順をまとめて報告し、ユーザの確認を待つ
5. 問題なければ `pnpm --filter @invest-training/db drizzle-kit migrate` で適用
6. Supabase MCP が利用可能なら、適用後のスキーマを `mcp__supabase__list_tables` 等で確認
7. RLS ポリシーが必要なテーブルに付与されているか確認（profiles, attempts, questions など）
8. 変更内容を `docs/adr/` に新規 ADR として記録するか、ユーザに確認

完了後、適用結果と次に必要な作業（RLS 更新・型生成等）を報告してください。
