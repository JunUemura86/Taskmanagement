# タスク管理アプリ API 設計書

[← 要件定義書に戻る](requirements.md)

## 文書情報

| 項目 | 内容 |
|---|---|
| 文書名 | タスク管理アプリ API 設計書 |
| 版 | 0.3 |
| 作成日 | 2026-11-05 |

## 改訂履歴

| 版 | 日付 | 内容 |
|---|---|---|
| 0.1 | 2026-11-05 | 読み取りの API（ボード・カード・ラベル）を追加 |
| 0.2 | 2026-11-09 | 共通のルールに CORS（画面からの呼び出しの許可）を追加 |
| 0.3 | 2026-11-09 | カードの追加の API（A-04）を追加 |

---

## 1. 共通のルール

| 項目 | ルール |
|---|---|
| URL の始まり | `http://localhost:8080/api` |
| やり取りする形 | JSON（文字コードは UTF-8） |
| 項目名 | キャメルケース（例：`dueDate`、`colorCode`） |
| 日付 | `YYYY-MM-DD` の形（例：`2026-11-10`）。ないときは `null` |
| 並び順 | リスト・カード・ラベルとも、`position` の小さい順に返す |
| CORS（画面からの呼び出しの許可） | 画面の `http://localhost:5173` と `http://127.0.0.1:5173` からの呼び出しだけを許可する。メソッドは GET・POST・PUT・PATCH・DELETE。ほかの場所からの呼び出しは 403 Forbidden になる（設定：`backend/src/main/java/com/example/taskmanagement/config/WebConfig.java`） |

## 2. API の一覧

| No. | メソッド | URL | 内容 | 対応する機能 |
|---|---|---|---|---|
| A-01 | GET | `/api/board` | リストと、その中のカードをまとめて返す | F-01 |
| A-02 | GET | `/api/cards/{id}` | カードを1枚返す | F-05 |
| A-03 | GET | `/api/labels` | ラベルの一覧を返す | F-05 |
| A-04 | POST | `/api/cards` | カードをリストの一番下に追加する | F-04 |

## 3. API の詳細

### A-01 ボードの取得 `GET /api/board`

**返す内容（200 OK）**

```json
[
  {
    "id": 1,
    "name": "未着手",
    "position": 0,
    "isDone": false,
    "cards": [
      {
        "id": 1,
        "listId": 1,
        "labelId": 1,
        "title": "買い物に行く",
        "priority": 1,
        "dueDate": "2026-11-10",
        "position": 0
      }
    ]
  }
]
```

| 項目 | 内容 |
|---|---|
| `id` / `name` / `position` | リストの ID・名前・並び順 |
| `isDone` | 完了用リストなら `true` |
| `cards` | そのリストのカード。カードがないときは空（`[]`） |

### A-02 カードの取得 `GET /api/cards/{id}`

**返す内容（200 OK）**

```json
{
  "id": 1,
  "listId": 1,
  "labelId": 1,
  "title": "買い物に行く",
  "priority": 1,
  "dueDate": "2026-11-10",
  "position": 0
}
```

| 項目 | 内容 |
|---|---|
| `labelId` | ラベルなしのときは `null` |
| `priority` | 1（高）・2（中）・3（低） |

**エラー**

| 状態 | ステータス |
|---|---|
| その ID のカードがない | 404 Not Found |

### A-03 ラベルの取得 `GET /api/labels`

**返す内容（200 OK）**

```json
[
  { "id": 1, "name": "赤", "colorCode": "#E5484D", "position": 0 }
]
```

### A-04 カードの追加 `POST /api/cards`

**送る内容**

```json
{ "listId": 1, "title": "買い物に行く" }
```

| 項目 | 必須 | ルール |
|---|---|---|
| `listId` | 必須 | カードを入れるリストの ID |
| `title` | 必須 | 1〜100文字。改行は入れられない。前後の空白は取り除いて保存する |

- 登録時はタイトルだけを送る（UC-02）。優先度は 2（中）、期限・ラベルは `null` で保存する
- リストの一番下に追加する（`position` は、そのリストで一番大きい値＋1。カードがなければ 0）

**返す内容（201 Created）**：作ったカード（A-02 と同じ形）

```json
{
  "id": 7,
  "listId": 1,
  "labelId": null,
  "title": "買い物に行く",
  "priority": 2,
  "dueDate": null,
  "position": 3
}
```

**エラー**

| 状態 | ステータス | 画面のメッセージ |
|---|---|---|
| タイトルが空・101文字以上・改行入り、`listId` がない | 400 Bad Request | M-05（空のときは画面で先に止める） |
| その ID のリストがない | 404 Not Found | M-08 |
| リストにカードがすでに100枚ある | 409 Conflict | M-07 |

## 4. 開発用のテストデータ

- dev プロファイルで起動すると、リストが1件もないときだけ、テストデータ（リスト3つ・カード6枚）を入れる
- 起動：`./gradlew bootRun --args='--spring.profiles.active=dev'`（`backend` フォルダで実行）
- テストデータの SQL：`backend/src/main/resources/db/testdata/afterMigrate.sql`
