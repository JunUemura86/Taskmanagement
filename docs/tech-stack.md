# タスク管理アプリ 技術スタック

[← 要件定義書に戻る](requirements.md)

## 文書情報

| 項目 | 内容 |
|---|---|
| 文書名 | タスク管理アプリ 技術スタック |
| 版 | 2.6 |
| 作成日 | 2026-11-03 |

## 改訂履歴

| 版 | 日付 | 内容 |
|---|---|---|
| 1.0 | 2026-11-03 | 要件定義書 v1.1 の「1.5 システム構成」「7.1 動作環境」「7.6 保守性（使う部品）」を分割して作成 |
| 2.0 | 2026-11-03 | 技術スタックを変更：フロントエンドを React ＋ Tailwind CSS、バックエンドを Java ＋ Spring Boot、データベースを PostgreSQL（Docker）にする |
| 2.1 | 2026-11-03 | 起動方法を変更：起動用のスクリプト（start.sh）で、DBの起動・バックアップ・サーバーの起動をまとめて行う |
| 2.2 | 2026-11-03 | 動作環境に、Java と Docker の開発時の版を追記 |
| 2.3 | 2026-11-09 | フロントエンドの言語を JavaScript から TypeScript に変更 |
| 2.4 | 2026-11-09 | dnd-kit の版（@dnd-kit/core 6.3.1・@dnd-kit/sortable 10.0.0・@dnd-kit/utilities 3.2.2）を追記 |
| 2.5 | 2026-11-11 | 実際の構成に合わせた：ビルドの道具を Maven から Gradle（Wrapper 9.8.2）に変更、各ライブラリの版と oxlint・PostgreSQL 18 を追記、起動方法を今動く手順（start.sh はまだない）に変更 |
| 2.6 | 2026-11-11 | oxlint で見るルールを追記（React・TypeScript・アクセシビリティ・import・テストの書き方。警告も残さない） |

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

| 場所 | フレームワーク | 版 | 役割 |
|---|---|---|---|
| バックエンド | Spring Boot | 4.1.2（土台の Spring Framework は 7.0.10） | Java でサーバーを作るためのフレームワーク。API の受け付け、DB との接続、入力のチェックなどをまとめて用意してくれる |
| フロントエンド | React / React DOM | 19.3.1 | 画面を部品（コンポーネント）に分けて作る。言語は TypeScript を使い、型でまちがいを早く見つける |
| スタイリング | Tailwind CSS | 4.3.5 | 見た目を作るための CSS フレームワーク。`className` に直接スタイルを書く |

## 3. 使う道具・部品

版は、開発時に入っている版（`frontend/package.json`・`backend/build.gradle`・`docker-compose.yml` で決めている）。

**フロントエンド**（`frontend/package.json`）

| 種類 | 技術 | 版 | 役割 |
|---|---|---|---|
| 開発の道具 | Vite | 8.3.6 | React の開発用サーバーを動かし、完成版のファイルを作る |
| 開発の道具 | @vitejs/plugin-react | 6.2.1 | Vite で React を使えるようにする |
| 開発の道具 | TypeScript | 7.0.2 | 型のチェックをする（`npm run typecheck`）。ブラウザ用のファイルへの変換は Vite が行う |
| 部品 | @tailwindcss/vite | 4.3.5 | Vite と Tailwind CSS をつなぐ |
| 部品 | dnd-kit（@dnd-kit/core・@dnd-kit/sortable・@dnd-kit/utilities） | 6.3.1・10.0.0・3.2.2 | リストやカードのドラッグ＆ドロップを作る。core が土台、sortable がドラッグ中にまわりのカードやリストをずらす並べ替え、utilities がずらす量の計算 |
| テストの道具 | Vitest | 5.1.0 | 画面のプログラムが正しく動くかを確かめる（`npm test`） |
| 書き方のチェック | oxlint | 1.92.0 | プログラムの書き方のまちがいを見つける（`npm run lint`）。React（フックの使い方・useEffect の依存の書き忘れ）・TypeScript・アクセシビリティ（読み上げ・キーボード操作）・import・テストの書き方のルールを見る。まちがいの可能性が高いものはエラー、怪しいものは警告で、警告が1つでもあれば失敗にする。設定は `frontend/.oxlintrc.json` |

**バックエンド**（`backend/build.gradle`）

| 種類 | 技術 | 版 | 役割 |
|---|---|---|---|
| 開発の道具 | Gradle（Gradle Wrapper） | 9.8.2 | Java のプロジェクトを組み立て、部品を取ってくる。`backend` フォルダの `./gradlew` で動かす（Gradle をパソコンに入れなくてよい） |
| 開発の道具 | io.spring.dependency-management | 1.1.7 | 部品の版を、Spring Boot に合うものにそろえる |
| 部品（Spring Boot の仲間） | Spring Web MVC（組み込みの Apache Tomcat） | Spring Boot 4.1.2 に付属（Tomcat 11.0.27） | API（URL）を受け付ける |
| 部品（Spring Boot の仲間） | Spring Data JPA（Hibernate ORM） | Spring Boot 4.1.2 に付属（Hibernate 7.4.13.Final） | SQL をあまり書かずに、DB へのデータの保存・取得をする |
| 部品（Spring Boot の仲間） | Spring Boot Validation | Spring Boot 4.1.2 に付属 | 「1〜30文字」などの入力のルールを、サーバー側でチェックする |
| 部品 | Flyway | 12.4.0 | テーブルを作る・変える SQL をファイルで管理する |
| 部品 | PostgreSQL JDBC Driver | 42.7.14 | Java から PostgreSQL につなぐ |
| テストの道具 | JUnit Jupiter | 6.0.3 | Java のプログラムが正しく動くかを確かめる（`./gradlew test`） |

**データベース**（`docker-compose.yml`）

| 種類 | 技術 | 版 | 役割 |
|---|---|---|---|
| データベース | PostgreSQL | 18（Docker のイメージ `postgres:18`） | データを保存する |
| 開発の道具 | Docker（Docker Desktop） | 29.9.2 | PostgreSQL を Mac に直接入れずに、箱（コンテナ）の中で動かす |

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

Docker Desktop を起動してから、次の順番に実行する。サーバーと画面は、それぞれ別のターミナルで動かす。

| 順番 | やること | コマンド | 実行する場所 |
|---|---|---|---|
| 1 | データベース（PostgreSQL）を起動する | `docker compose up -d` | ルート |
| 2 | サーバー（Spring Boot）を、開発用の設定で起動する | `./gradlew bootRun --args='--spring.profiles.active=dev'` | `backend` |
| 3 | 画面（React）を起動する | `npm run dev` | `frontend` |
| 4 | ブラウザで画面を開く | `http://localhost:5173` | － |

- ポートは、画面 5173・サーバー 8080・データベース 5432 に決めている。別のポートでは起動しない（画面が呼ぶ API の URL と、サーバーが許可する画面の場所を、このポートに決めているため）
- 初めて動かすときの準備（`npm install` など）は [README](../README.md) の「セットアップと起動」を参照
- 起動用のスクリプト（`start.sh`：データベースの起動・バックアップ・サーバーの起動をまとめて行う）は、まだない。作るかどうかは別に決める。それまでは、バックアップ（[非機能要件](non-functional-requirements.md) の「2. 信頼性」）は自動では行われない
