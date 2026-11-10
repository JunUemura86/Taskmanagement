# タスク管理アプリ

自分のタスクを、カードとリストで分かりやすく管理する個人用の Web アプリです（スクールの課題）。
カンバン方式のボードで、「未着手 → 進行中 → 完了」のようにカードをドラッグ＆ドロップで動かして、作業の進み具合を管理します。

## 主な機能

- ボードの表示（リストとカードをデータベースから読み込む）
- カードの追加・編集（タイトル・優先度・期限・ラベル）・削除
- ドラッグ＆ドロップでのカードの移動・並べ替え
- リストの追加・名前の変更・削除
- チェックボックスで選んだカードのまとめて削除
- 完了用リストの指定
- 期限の色分け（期限切れは赤、今日・明日は黄色）と、優先度のバッジ表示

機能の全体は [機能一覧](docs/feature-list.md)（F-01〜F-17）を参照してください。

## 目次

- [技術スタック](#技術スタック)
- [システム構成](#システム構成)
- [前提条件](#前提条件)
- [セットアップと起動](#セットアップと起動)
- [ポートのルール](#ポートのルール)
- [設定](#設定)
- [よく使うコマンド](#よく使うコマンド)
- [テスト](#テスト)
- [API の一覧](#api-の一覧)
- [ディレクトリ構成](#ディレクトリ構成)
- [開発の進め方](#開発の進め方)
- [トラブルシューティング](#トラブルシューティング)
- [ドキュメント](#ドキュメント)

## 技術スタック

### フロントエンド（画面）

| 種類 | 技術 | 版 |
|---|---|---|
| 言語 | TypeScript | 7.0.2 |
| ライブラリ | React / React DOM | 19.3.1 |
| ビルド・開発サーバー | Vite | 8.3.6 |
| Vite のプラグイン | @vitejs/plugin-react | 6.2.1 |
| スタイリング | Tailwind CSS | 4.3.5 |
| Vite と Tailwind をつなぐ | @tailwindcss/vite | 4.3.5 |
| ドラッグ＆ドロップ | @dnd-kit/core / @dnd-kit/sortable / @dnd-kit/utilities | 6.3.1 / 10.0.0 / 3.2.2 |
| テスト | Vitest | 5.1.0 |
| 書き方のチェック（Lint） | oxlint | 1.92.0 |

### バックエンド（サーバー）

| 種類 | 技術 | 版 |
|---|---|---|
| 言語 | Java（Eclipse Temurin） | 25（LTS） |
| フレームワーク | Spring Boot | 4.1.2 |
| フレームワークの土台 | Spring Framework | 7.0.10 |
| Web サーバー（組み込み） | Apache Tomcat | 11.0.27 |
| DB の読み書き（JPA） | Spring Data JPA / Hibernate ORM | Spring Boot 4.1.2 に付属 / 7.4.13.Final |
| 入力のチェック | Spring Boot Validation | Spring Boot 4.1.2 に付属 |
| テーブルの管理（マイグレーション） | Flyway | 12.4.0 |
| DB への接続（JDBC ドライバー） | PostgreSQL JDBC Driver | 42.7.14 |
| ビルド | Gradle（Gradle Wrapper） | 9.8.2 |
| 依存関係の版の管理 | io.spring.dependency-management | 1.1.7 |
| テスト | JUnit Jupiter | 6.0.3 |

### データベース

| 種類 | 技術 | 版 |
|---|---|---|
| データベース | PostgreSQL（Docker イメージ `postgres:18`） | 18.6 |

### 開発環境（開発時に使っている版）

| 種類 | 技術 | 版 |
|---|---|---|
| OS | macOS | 14（Sonoma） |
| Java の実行環境 | Eclipse Temurin | 25.0.5 |
| Node.js / npm | Node.js / npm | v26.13.0 / 11.20.0 |
| コンテナ | Docker Desktop（Docker Engine / Docker Compose） | 29.9.2 / v5.6.1 |

> **版の正しい情報は、設定ファイルにあります。** フロントエンドは [frontend/package.json](frontend/package.json)（実際に入る版は package-lock.json）、
> バックエンドは [backend/build.gradle](backend/build.gradle) と [gradle-wrapper.properties](backend/gradle/wrapper/gradle-wrapper.properties)、
> データベースは [docker-compose.yml](docker-compose.yml) です。版を上げたときは、この表も一緒に直してください。
> Spring Boot に付属する部品（Spring Framework・Hibernate・Flyway など）の版は、Spring Boot の版で決まります。

## システム構成

```
ブラウザ（React）          ⇄   サーバー（Spring Boot）    ⇄   データベース（PostgreSQL）
  画面の表示・操作              API（JSON）の受け付け          データの保存
  http://localhost:5173         http://localhost:8080/api      localhost:5432（Docker）
```

- 画面は、サーバーの API（`http://localhost:8080/api`）を呼んでデータを読み書きします
- テーブルは、サーバーの起動時に Flyway が自動で作ります（SQL は `backend/src/main/resources/db/migration`）
- データベースは、自分のパソコン（127.0.0.1）からだけつながるようにしています

## 前提条件

次のソフトを入れておきます。

| ソフト | 必要な版 | 確かめるコマンド |
|---|---|---|
| Java（Eclipse Temurin） | 25 | `java -version` |
| Node.js | v26 以上（npm 11 以上） | `node -v` / `npm -v` |
| Docker Desktop | 最新版（Docker Compose v2 以上） | `docker --version` / `docker compose version` |
| Git | 最新版 | `git --version` |

- Gradle は入れなくてかまいません。`backend` フォルダの `./gradlew`（Gradle Wrapper）が、決められた版（9.8.2）を自動で取ってきます
- 使えるブラウザ：Google Chrome・Safari・Microsoft Edge・Firefox の最新版（画面の横幅は 1280 ピクセル以上）

## セットアップと起動

### 1. 最初に1回だけ行うこと

```bash
git clone https://github.com/JunUemura86/Taskmanagement.git
cd Taskmanagement

# 画面で使う部品を取ってくる
cd frontend
npm install
cd ..
```

### 2. 起動する（毎回）

Docker Desktop を起動してから、次の順番で実行します。サーバーと画面は、それぞれ別のターミナルで動かします。

| 順番 | やること | コマンド | 実行する場所 |
|---|---|---|---|
| 1 | データベースを起動する | `docker compose up -d` | ルート |
| 2 | サーバーを起動する（開発用の設定） | `./gradlew bootRun --args='--spring.profiles.active=dev'` | `backend` |
| 3 | 画面を起動する | `npm run dev` | `frontend` |
| 4 | ブラウザで開く | http://localhost:5173 | － |

- サーバーの起動には数十秒かかります。ログに `Started BackendApplication` と出たら起動完了です
- 起動できたかは、次のコマンドでも確かめられます（`200` と出れば OK）

  ```bash
  curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8080/api/board
  ```

### 3. 停止する

| 止めるもの | 方法 |
|---|---|
| 画面・サーバー | それぞれのターミナルで `Ctrl + C` |
| データベース | ルートで `docker compose down`（データは残ります） |

> データベースのデータを**すべて消して**最初からやり直したいときは、`docker compose down -v` を使います（元に戻せないので注意）。

> 起動用のスクリプト（`start.sh`：データベースの起動・バックアップ・サーバーの起動をまとめて行う）は、今後作る予定です。

## ポートのルール

使うポートは、次のとおり**決まっています**。別のポートでは起動しないでください。

| 役割 | ポート |
|---|---|
| 画面（Vite） | 5173 |
| サーバー（Spring Boot） | 8080 |
| データベース（PostgreSQL） | 5432 |

- サーバーが画面からの呼び出しを許可（CORS）しているのは 5173 だけで、画面が呼ぶ API の URL も 8080 に決めているためです。別のポートでは正しく動きません
- 画面（Vite）は `strictPort: true` にしてあるので、5173 が使われていると、別の番号に逃げずに止まります
- ポートが使われていたときの対応は、[トラブルシューティング](#トラブルシューティング) を参照してください

## 設定

### プロファイル（設定の切り替え）

| プロファイル | 設定ファイル | 内容 |
|---|---|---|
| （指定なし） | `backend/src/main/resources/application.properties` | 基本の設定（DB への接続、JPA の設定） |
| `dev` | `backend/src/main/resources/application-dev.properties` | 開発用。基本の設定に加えて、リストが1件もないときだけテストデータ（リスト3つ・カード6枚）を入れる |

- 開発中は `dev` で起動します（`--spring.profiles.active=dev`）
- テストデータの SQL：`backend/src/main/resources/db/testdata/afterMigrate.sql`

### データベースの接続情報

| 項目 | 値 |
|---|---|
| ホスト / ポート | `localhost` / `5432` |
| データベース名 | `taskmanagement` |
| ユーザー名 / パスワード | `taskuser` / `taskpass` |

> この接続情報は、自分のパソコンの中だけで使う**開発用の値**です。インターネットに公開する環境では、同じ値を使わないでください。

## よく使うコマンド

### 画面（`frontend` フォルダで実行）

| コマンド | 内容 |
|---|---|
| `npm install` | 必要な部品を取ってくる（最初に1回、package.json が変わったとき） |
| `npm run dev` | 開発用サーバーを起動する（http://localhost:5173） |
| `npm run build` | 型をチェックしてから、完成版のファイルを `dist` フォルダに作る |
| `npm run preview` | `npm run build` で作った完成版を表示して確かめる |
| `npm run typecheck` | 型のチェックだけをする |
| `npm test` | テスト（Vitest）を実行する |
| `npm run lint` | 書き方をチェックする（oxlint） |

### サーバー（`backend` フォルダで実行）

| コマンド | 内容 |
|---|---|
| `./gradlew bootRun --args='--spring.profiles.active=dev'` | 開発用の設定でサーバーを起動する |
| `./gradlew test` | テスト（JUnit）を実行する |
| `./gradlew build` | テストをしてから、実行用のファイル（`build/libs/*.jar`）を作る |
| `./gradlew clean` | 作ったファイル（`build` フォルダ）を消す |

### データベース（ルートで実行）

| コマンド | 内容 |
|---|---|
| `docker compose up -d` | 起動する |
| `docker compose ps` | 動いているか確かめる |
| `docker compose logs db` | ログを見る |
| `docker compose exec db psql -U taskuser -d taskmanagement` | データベースに入って SQL を実行する（`\q` で抜ける） |
| `docker compose down` | 停止する（データは残る） |

## テスト

| 対象 | コマンド | テストの場所 |
|---|---|---|
| 画面 | `npm test`（`frontend` で実行） | `frontend/src/utils/*.test.ts` |
| サーバー | `./gradlew test`（`backend` で実行） | `backend/src/test/java/...` |

- サーバーのテストの中には、データベースにつなぐものがあります。先に `docker compose up -d` でデータベースを起動しておいてください
- PR を出す前に、`npm run typecheck`・`npm run lint`・`npm test`・`./gradlew test` がすべて通ることを確かめます
- 完成の確認項目（手で確かめる項目）は [テスト項目](docs/test-checklist.md)（T-01〜T-23）にあります

## API の一覧

URL の始まりは `http://localhost:8080/api` で、JSON でやり取りします。

| No. | メソッド | URL | 内容 |
|---|---|---|---|
| A-01 | GET | `/api/board` | リストと、その中のカードをまとめて返す |
| A-02 | GET | `/api/cards/{id}` | カードを1枚返す |
| A-03 | GET | `/api/labels` | ラベルの一覧を返す |
| A-04 | POST | `/api/cards` | カードをリストの一番下に追加する |
| A-05 | POST | `/api/lists` | リストを一番右に追加する |
| A-06 | PUT | `/api/cards/{id}` | カードのタイトル・優先度・期限・ラベルを変更する |
| A-07 | DELETE | `/api/cards/{id}` | カードを1枚削除する |
| A-08 | PATCH | `/api/cards/{id}/position` | カードを別のリスト・別の位置へ動かす |
| A-09 | PATCH | `/api/lists/{id}` | リスト名を変更する |
| A-10 | DELETE | `/api/lists/{id}` | リストと中のカードを削除する |
| A-11 | POST | `/api/cards/bulk-delete` | 選んだカードをまとめて削除する |
| A-12 | PATCH | `/api/lists/{id}/done` | 完了用リストを指定・解除する |

送る内容・返す内容・エラーの詳細は [API 設計書](docs/api-design.md) を参照してください。

## ディレクトリ構成

```
Taskmanagement/
├── backend/                          サーバー（Spring Boot）
│   ├── build.gradle                  依存関係とビルドの設定
│   └── src/
│       ├── main/java/com/example/taskmanagement/
│       │   ├── controller/           API の受け付け（URL とメソッドの対応）
│       │   ├── service/              処理のルール（上限のチェック・並び順など）
│       │   ├── repository/           データベースの読み書き
│       │   ├── entity/               テーブルに対応するクラス
│       │   ├── dto/                  API で送る・返すデータの形
│       │   └── config/               設定（CORS など）
│       ├── main/resources/
│       │   ├── application*.properties   設定ファイル
│       │   ├── db/migration/         テーブルを作る SQL（Flyway）
│       │   └── db/testdata/          開発用のテストデータ（dev プロファイルだけ）
│       └── test/                     サーバーのテスト
├── frontend/                         画面（React ＋ TypeScript）
│   ├── package.json                  依存関係とコマンドの設定
│   ├── vite.config.ts                Vite の設定（ポート 5173 に固定）
│   └── src/
│       ├── components/               画面の部品（ボード・リスト・カード・ダイアログなど）
│       ├── utils/                    計算の処理とそのテスト（期限・優先度・並べ替えなど）
│       ├── api.ts                    サーバーの API を呼ぶ処理
│       └── types.ts                  データの型
├── docs/                             設計書（要件定義・画面・API・DB など）
├── prototype/                        最初に作った試作品（HTML・JavaScript）
├── docker-compose.yml                データベース（PostgreSQL）の設定
├── CLAUDE.md                         Claude Code 用の作業ルール
└── README.md                         このファイル
```

## 開発の進め方

すべての変更は、次の流れで行います（main ブランチへの直接のコミット・push はできません）。

1. **Issue を作る**：「目的」「やること」「完了条件」を書く
2. **ブランチを作る**：最新の main から `<種類>/<Issue番号>-<内容>` の名前で作る
   - 種類：`feature`（新しい機能）・`fix`（バグの修正）・`docs`（ドキュメント）・`chore`（設定・依存関係）・`refactor`（コード整理）・`test`（テスト）
   - 例：`feature/12-add-login`、`fix/15-card-drag-bug`
3. **コミットする**：日本語で、1行目に何をしたかを簡潔に書く
4. **PR を作る**：本文に `Closes #<Issue番号>` と書く（マージすると Issue が自動で閉じる）
5. **スカッシュマージ**で main に入れ、ブランチを削除する
6. 手元の main を最新にする（`git switch main && git pull`）

- 1つの Issue につき、ブランチと PR を1つずつにします（関係のない作業を混ぜない）
- main ブランチは GitHub のルールセットで守られていて、PR を経ない変更・強制 push・ブランチの削除はできません
- 詳しいルールは [CLAUDE.md](CLAUDE.md) を参照してください

## トラブルシューティング

| 困っていること | 原因と対応 |
|---|---|
| 画面やサーバーが「ポートが使われている」と言って起動しない | 前に起動したものが残っています。`lsof -nP -iTCP:8080 -sTCP:LISTEN`（5173 も同じ）で使っているプロセスを確かめ、`kill <PID>` で止めてから、**同じポートで**起動し直します |
| `docker` のコマンドが見つからない・つながらない | Docker Desktop が起動していません。起動してから、もう一度実行します |
| サーバーの起動時に、データベースにつながらないエラーが出る | データベースが動いていません。`docker compose ps` で確かめ、止まっていれば `docker compose up -d` を実行します |
| 5432 がほかのソフト（パソコンに入れた PostgreSQL など）に使われている | そのソフトを止めるか、相談してから対応します（Docker のデータベースが起動できません） |
| 画面に「サーバーに接続できませんでした。」と出る | サーバー（8080）が動いていないか、起動の途中です。サーバーのターミナルを確かめ、起動が終わってから画面を再読み込みします |
| 画面は開くがデータが出ない（ブラウザに CORS のエラー） | 画面を 5173 以外のポートで開いています。決められたポートで起動し直します |
| `./gradlew` が「Permission denied」で動かない | `chmod +x gradlew` で実行できるようにします（`backend` で実行） |

## ドキュメント

まずは [要件定義書](docs/requirements.md) を読んでください。全体の概要と、各ドキュメントへのリンクがあります。

| ドキュメント | 内容 |
|---|---|
| [要件定義書](docs/requirements.md) | 概要・関連ドキュメントへのリンク・対象外・開発の進め方 |
| [機能一覧](docs/feature-list.md) | アプリの機能（F-01〜F-17） |
| [機能要件](docs/functional-requirements.md) | ユースケースと機能のルール |
| [画面設計書](docs/screen-design.md) | 画面の構成・移り変わり・メッセージ |
| [API 設計書](docs/api-design.md) | API の一覧・送る内容と返す内容・エラー |
| [ER図](docs/er-diagram.md) | データのまとまりとつながり |
| [データベース設計書](docs/database-design.md) | テーブル定義 |
| [非機能要件](docs/non-functional-requirements.md) | 性能・信頼性・セキュリティなど |
| [技術スタック](docs/tech-stack.md) | システム構成・フレームワーク・動作環境 |
| [テスト項目](docs/test-checklist.md) | 完成の確認項目（T-01〜T-23） |
| [画面（frontend）の README](frontend/README.md) | 画面のコマンドの一覧 |
