# タスク管理アプリ 技術スタック

[← 要件定義書に戻る](requirements.md)

## 文書情報

| 項目 | 内容 |
|---|---|
| 文書名 | タスク管理アプリ 技術スタック |
| 版 | 2.3 |
| 作成日 | 2026-11-03 |

## 改訂履歴

| 版 | 日付 | 内容 |
|---|---|---|
| 1.0 | 2026-11-03 | 要件定義書 v1.1 の「1.5 システム構成」「7.1 動作環境」「7.6 保守性（使う部品）」を分割して作成 |
| 2.0 | 2026-11-03 | 技術スタックを変更：フロントエンドを React ＋ Tailwind CSS、バックエンドを Java ＋ Spring Boot、データベースを PostgreSQL（Docker）にする |
| 2.1 | 2026-11-03 | 起動方法を変更：起動用のスクリプト（start.sh）で、DBの起動・バックアップ・サーバーの起動をまとめて行う |
| 2.2 | 2026-11-03 | 動作環境に、Java と Docker の開発時の版を追記 |
| 2.3 | 2026-11-09 | フロントエンドの言語を JavaScript から TypeScript に変更 |

---

## 1. システム構成

| 役割 | 使う技術 |
|---|---|
| 画面（フロントエンド） | React（TypeScript）＋ Tailwind CSS |
| サーバー（バックエンド） | Java ＋ Spring Boot |
| データベース | PostgreSQL（Docker で動かす） |

```
ブラウザ（React）       ⇄  サーバー（Spring Boot）  ⇄  データベース（PostgreSQL）
  画面の表示・操作           データの受け渡し             データの保存
  http://localhost:5173      http://localhost:8080
```

- Next.js（React 用のフレームワーク）は使わない

## 2. フレームワーク

| 場所 | フレームワーク | 役割 |
|---|---|---|
| バックエンド | Spring Boot 4 | Java でサーバーを作るためのフレームワーク。API の受け付け、DB との接続、入力のチェックなどをまとめて用意してくれる |
| フロントエンド | React | 画面を部品（コンポーネント）に分けて作る。言語は TypeScript を使い、型でまちがいを早く見つける |
| スタイリング | Tailwind CSS v4 | 見た目を作るための CSS フレームワーク。`className` に直接スタイルを書く |

## 3. 使う道具・部品

**フロントエンド**

| 種類 | 技術 | 役割 |
|---|---|---|
| 開発の道具 | Vite | React の開発用サーバーを動かし、完成版のファイルを作る |
| 開発の道具 | TypeScript | 型のチェックをする（`npm run typecheck`）。ブラウザ用のファイルへの変換は Vite が行う |
| 部品 | @tailwindcss/vite | Vite と Tailwind CSS をつなぐ |
| 部品 | dnd-kit | リストやカードのドラッグ＆ドロップを作る |
| テストの道具 | Vitest | React のプログラムが正しく動くかを確かめる |

**バックエンド**

| 種類 | 技術 | 役割 |
|---|---|---|
| 開発の道具 | Maven | Java のプロジェクトを組み立て、部品を取ってくる |
| 部品（Spring Boot の仲間） | Spring Data JPA | SQL をあまり書かずに、DB へのデータの保存・取得をする |
| 部品（Spring Boot の仲間） | Spring Boot Validation | 「1〜30文字」などの入力のルールを、サーバー側でチェックする |
| 部品 | Flyway | テーブルを作る・変える SQL をファイルで管理する |
| テストの道具 | JUnit 5 | Java のプログラムが正しく動くかを確かめる |

**データベース**

| 種類 | 技術 | 役割 |
|---|---|---|
| データベース | PostgreSQL | データを保存する |
| 開発の道具 | Docker（Docker Desktop） | PostgreSQL を Mac に直接入れずに、箱（コンテナ）の中で動かす |

- 有料の部品・サービスは使わない（[非機能要件](non-functional-requirements.md) の「保守性」を参照）
- Docker Desktop は、個人の学習目的なら無料で使える

## 4. 動作環境

| 項目 | 内容 |
|---|---|
| OS | macOS |
| ブラウザ | Google Chrome、Safari、Microsoft Edge、Firefox の最新版 |
| Java | Java 25（LTS版＝長期サポート版）。配布元は Eclipse Temurin（無料）。開発時の版：25.0.5 |
| Node.js | LTS版（長期サポート版）。開発時の版：v26.13.0。React の開発に使う |
| Docker | Docker Desktop の最新版。開発時の版：29.9.2 |
| 画面の大きさ | 横幅1280ピクセル以上 |

## 5. 起動方法

Docker Desktop を起動してから、ターミナルで次の順番に実行する。

| 順番 | やること | コマンドの例 |
|---|---|---|
| 1 | 起動用のスクリプトを実行する。次の3つを自動で順番に行う：①データベース（PostgreSQL）を起動 ②バックアップを書き出す ③サーバー（Spring Boot）を起動 | `./start.sh` |
| 2 | 別のターミナルで、画面（React）を起動する | `npm run dev`（`frontend` フォルダで実行） |
| 3 | ブラウザで画面を開く | `http://localhost:5173` |

- バックアップの詳しい内容は [非機能要件](non-functional-requirements.md) の「2. 信頼性」を参照
- フォルダの分け方やコマンドの細かい内容は、作り始めるときに決める
