# タスク管理アプリ API 設計書

[← 要件定義書に戻る](requirements.md)

## 文書情報

| 項目 | 内容 |
|---|---|
| 文書名 | タスク管理アプリ API 設計書 |
| 版 | 0.1 |
| 作成日 | 2026-11-05 |

## 改訂履歴

| 版 | 日付 | 内容 |
|---|---|---|
| 0.1 | 2026-11-05 | 読み取りの API（ボード・カード・ラベル）を追加 |

---

## 1. 共通のルール

| 項目 | ルール |
|---|---|
| URL の始まり | `http://localhost:8080/api` |
| やり取りする形 | JSON（文字コードは UTF-8） |
| 項目名 | キャメルケース（例：`dueDate`、`colorCode`） |
| 日付 | `YYYY-MM-DD` の形（例：`2026-11-10`）。ないときは `null` |
| 並び順 | リスト・カード・ラベルとも、`position` の小さい順に返す |

## 2. API の一覧

| No. | メソッド | URL | 内容 | 対応する機能 |
|---|---|---|---|---|
| A-01 | GET | `/api/board` | リストと、その中のカードをまとめて返す | F-01 |
| A-02 | GET | `/api/cards/{id}` | カードを1枚返す | F-05 |
| A-03 | GET | `/api/labels` | ラベルの一覧を返す | F-05 |

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

## 4. 開発用のテストデータ

- dev プロファイルで起動すると、リストが1件もないときだけ、テストデータ（リスト3つ・カード6枚）を入れる
- 起動：`./gradlew bootRun --args='--spring.profiles.active=dev'`（`backend` フォルダで実行）
- テストデータの SQL：`backend/src/main/resources/db/testdata/afterMigrate.sql`
