---
name: start-servers
description: このアプリのデータベース（5432）・サーバー（Spring Boot、8080）・画面（Vite、5173）を、決められたポートで起動する手順。動作確認・画面の確認・「サーバーを起動して」「画面を開けるようにして」と言われたとき、またはサーバーや画面を起動・再起動する前に必ず使う。ポートが使われていたら、そのプロセスを止めて同じポートで起動する（別のポートでは起動しない）。
---

# サーバーの起動（決められたポートで起動する）

## 決められたポート

| 役割 | ポート | 起動のコマンド | 実行する場所 |
|---|---|---|---|
| データベース（PostgreSQL） | 5432 | `docker compose up -d` | ルート |
| サーバー（Spring Boot） | 8080 | `./gradlew bootRun --args='--spring.profiles.active=dev'` | `backend` |
| 画面（Vite） | 5173 | `npm run dev` | `frontend` |

**別のポートでは、一時的にでも起動しない。**
サーバーの CORS で許可しているのは 5173 だけで、画面が呼ぶ API の URL も `http://localhost:8080/api` に決めている。
別のポートで起動すると、画面がデータを取れず、正しく動かない。

## 起動の手順

ユーザーは初心者なので、各コマンドを実行する前に、何をするかを短く日本語で説明する。

### 1. データベース（5432）

```
lsof -nP -iTCP:5432 -sTCP:LISTEN
docker compose ps
```

- `taskmanagement-db-1` が `Up` なら、もう動いているので何もしない。
- 何も動いていなければ、ルートで `docker compose up -d` を実行する。
- **5432 を Docker 以外のプロセスが使っていたら、止めずにユーザーに相談する**（パソコンに入っている別の PostgreSQL などの可能性があり、勝手に止めると困ることがあるため）。
- `docker` が見つからないときは、Docker Desktop が起動しているか確かめる。PATH は SessionStart フックが足している（`~/.docker/bin`）。

### 2. サーバー（8080）

`backend` フォルダで、**バックグラウンド**で起動する（`run_in_background: true`）。

```
./gradlew bootRun --args='--spring.profiles.active=dev'
```

- ポートを指定するオプション（`--server.port=…`、`SERVER_PORT=…`）は付けない。
- 8080 が使われていたら、PreToolUse フック（`.claude/hooks/guard-ports.py`）が、使っているプロセスを起動の直前に自動で止める。止めたプロセスの名前と番号が表示されるので、ユーザーに伝える。

### 3. 画面（5173）

`frontend` フォルダで、**バックグラウンド**で起動する。

```
npm run dev
```

- `--port` は付けない。`vite.config.ts` で `port: 5173` と `strictPort: true` にしてあるので、5173 が使えないときは別の番号に逃げずに止まる。
- 5173 が使われていたら、8080 と同じく、フックが自動で止める。

### 4. 起動の確認

サーバーは起動に数十秒かかるので、つながるまで待ってから確かめる。

```
for i in $(seq 1 60); do curl -s -o /dev/null localhost:8080/api/board && break; sleep 2; done
curl -s -o /dev/null -w "API %{http_code}\n" localhost:8080/api/board
curl -s -o /dev/null -w "画面 %{http_code}\n" http://127.0.0.1:5173/
```

- 両方 `200` なら、ユーザーに http://localhost:5173 を開いてもらう。
- 失敗したら、バックグラウンドの出力ファイルを読んで原因を伝える。別のポートで起動し直すことはしない。

## ポートが使われていたときに、自分で止める場合

フックが止められなかったときや、起動する前に止めておきたいときは、次の順で行う。

```
lsof -nP -iTCP:8080 -sTCP:LISTEN     # 何が使っているか確かめる（5173 も同じ）
kill <PID>                           # 普通に止める
kill -9 <PID>                        # 数秒たっても残っていたら、強制的に止める
```

止めたら、**同じポートで**起動し直す。止めたプロセスの名前と番号は、ユーザーに伝える。

## やってはいけないこと

- `npm run dev -- --port 5174` のように、別のポートで起動すること
- `--server.port=8081` や `SERVER_PORT=9090` を付けて起動すること
- `vite.config.ts` の `port`・`strictPort` や、サーバーの CORS の設定を変えて、別のポートに合わせること
- 5432 を使っている Docker 以外のプロセスを、相談せずに止めること
