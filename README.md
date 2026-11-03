# タスク管理アプリ

自分のタスクを、カードとリストで分かりやすく管理する個人用アプリです（スクールの課題）。

## 技術

| 役割 | 使う技術 |
|---|---|
| 画面（フロントエンド） | React（JavaScript）＋ Vite ＋ Tailwind CSS |
| サーバー（バックエンド） | Java ＋ Spring Boot |
| データベース | PostgreSQL（Docker で動かす） |

詳しくは [技術スタック](docs/tech-stack.md) を参照してください。

## 起動方法

> 開発中です。完成後は次の手順で起動します。

1. Docker Desktop を起動する
2. ターミナルで起動用のスクリプトを実行する（データベースの起動・バックアップ・サーバーの起動をまとめて行います）

   ```
   ./start.sh
   ```

3. 別のターミナルで、画面を起動する

   ```
   cd frontend
   npm run dev
   ```

4. ブラウザで `http://localhost:5173` を開く

## ドキュメント

まずは [要件定義書](docs/requirements.md) を読んでください。全体の概要と、各ドキュメントへのリンクがあります。

| ドキュメント | 内容 |
|---|---|
| [要件定義書](docs/requirements.md) | 概要・関連ドキュメントへのリンク・対象外・開発の進め方 |
| [機能一覧](docs/feature-list.md) | アプリの機能（F-01〜F-15） |
| [機能要件](docs/functional-requirements.md) | ユースケース（UC-01〜UC-11）と機能のルール |
| [画面設計書](docs/screen-design.md) | 画面の構成・移り変わり・メッセージ |
| [ER図](docs/er-diagram.md) | データのまとまりとつながり |
| [データベース設計書](docs/database-design.md) | テーブル定義 |
| [非機能要件](docs/non-functional-requirements.md) | 性能・信頼性・セキュリティなど |
| [技術スタック](docs/tech-stack.md) | システム構成・フレームワーク・動作環境・起動方法 |
| [テスト項目](docs/test-checklist.md) | 完成の確認項目（T-01〜T-21） |
