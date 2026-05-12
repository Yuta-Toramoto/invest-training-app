# ADR-0001: モノレポ構成と Turborepo の採用

- 日付: YYYY-MM-DD
- 状態: Accepted

## コンテキスト

本プロジェクトは Web アプリから開始し、将来モバイルアプリ（Expo）を追加する予定。
UI コンポーネント・ドメインロジック・型定義・DB スキーマを Web と Mobile で共有したい。

## 検討した選択肢

1. **マルチリポ（web リポと mobile リポを分離）**
   - 利点: 独立性が高い、CI が単純
   - 欠点: 共通コードのバージョン同期が苦痛、リファクタが2倍

2. **Turborepo モノレポ**
   - 利点: 共通パッケージを簡単に共有、ビルドキャッシュ、Vercel と相性◎
   - 欠点: 初期セットアップがやや複雑

3. **Nx モノレポ**
   - 利点: 高機能、生成器が強力
   - 欠点: 学習コスト高、Turbo より重い

## 決定

**Turborepo + pnpm workspaces** を採用する。

理由:
- 共通ロジック（XP 計算、SRS、市場データ抽象化）を Web/Mobile で再利用する設計が前提
- Vercel デプロイがゼロ設定で動く
- pnpm の workspaces はディスク効率が良くインストール高速
- Nx は機能過剰、学習コストが ROI に見合わない

## 結果

- `apps/web` と将来の `apps/mobile` を同一リポで管理
- `packages/{core,db,ui,types,config}` を共有
- ビルドは `turbo run build`、キャッシュは Vercel Remote Cache を利用

## ロールバック条件

このアーキテクチャを再評価すべきタイミング:
- モバイルチームが独立し、Web/Mobile のリリースサイクルが完全に分離した場合
- モノレポのビルド時間が 10 分を超えるようになった場合
