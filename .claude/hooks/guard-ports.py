#!/usr/bin/env python3
"""Claude Code PreToolUse フック: サーバーを決められたポートでだけ起動させる。

- 画面（Vite）は 5173、サーバー（Spring Boot）は 8080 で起動する
- それ以外のポートを指定した起動（例: npm run dev -- --port 5174、
  ./gradlew bootRun --args='--server.port=8081'）は exit 2 で止める
- 起動の直前に、そのポートを使っているプロセスがあれば停止してから起動させる

別のポートで起動すると、CORS の許可（5173 だけ）や API の URL（8080）と合わず、
画面が正しく動かないため。詳しくは CLAUDE.md の「サーバーの起動とポートのルール」を参照。
"""
import json
import os
import re
import shlex
import signal
import subprocess
import sys
import time

FRONTEND_PORT = 5173
BACKEND_PORT = 8080

# 「別のポートを指定している」書き方
FRONTEND_PORT_OPTION = re.compile(r"--port(?:=|\s+)['\"]?(\d+)")
BACKEND_PORT_OPTION = re.compile(r"(?:server\.port|SERVER_PORT)(?:=|\s+)['\"]?(\d+)")


def block(msg):
    print(msg + "\n詳しくは CLAUDE.md の「サーバーの起動とポートのルール」を参照してください。", file=sys.stderr)
    sys.exit(2)


def tokenize(segment):
    try:
        tokens = shlex.split(segment)
    except ValueError:
        tokens = segment.split()
    # 先頭の環境変数代入（FOO=bar npm run dev）を飛ばす
    while tokens and re.match(r"^[A-Za-z_][A-Za-z0-9_]*=", tokens[0]):
        tokens.pop(0)
    return tokens


def server_kind(tokens):
    """画面のサーバーを起動するなら 'frontend'、サーバーなら 'backend'、どちらでもなければ None。

    コマンドが先頭にあるときだけ判定する（PR の本文や文書の中に書かれた例には反応しないため）。
    """
    # nohup や exec などの「前につけるだけのコマンド」を飛ばす
    while tokens and tokens[0] in ("nohup", "exec", "time", "command"):
        tokens = tokens[1:]
    if not tokens:
        return None
    names = [os.path.basename(t) for t in tokens]
    first = names[0]

    # ./gradlew bootRun、mvn spring-boot:run、java -jar xxx.jar
    if first == "gradlew" and "bootRun" in tokens:
        return "backend"
    if first in ("mvn", "mvnw") and "spring-boot:run" in tokens:
        return "backend"
    if first == "java" and "-jar" in tokens:
        return "backend"

    # npm run dev（npm --prefix frontend run dev なども含む）、pnpm dev、yarn dev
    if first == "npm" and "run" in tokens and "dev" in tokens:
        return "frontend"
    if first in ("pnpm", "yarn") and "dev" in tokens:
        return "frontend"
    # vite / npx vite / vite dev / vite serve（build・preview は対象外）
    i = 0 if first == "vite" else 1 if first in ("npx", "pnpm", "yarn") and len(names) > 1 and names[1] == "vite" else None
    if i is not None:
        if i + 1 >= len(tokens) or tokens[i + 1] in ("dev", "serve") or tokens[i + 1].startswith("-"):
            return "frontend"
    return None


def listening_pids(port):
    try:
        out = subprocess.run(
            ["lsof", "-nP", "-t", f"-iTCP:{port}", "-sTCP:LISTEN"],
            capture_output=True, text=True, timeout=5,
        )
    except Exception:
        return []
    return sorted({int(p) for p in out.stdout.split() if p.isdigit()})


def process_name(pid):
    try:
        out = subprocess.run(["ps", "-o", "comm=", "-p", str(pid)], capture_output=True, text=True, timeout=5)
        return os.path.basename(out.stdout.strip()) or "不明"
    except Exception:
        return "不明"


def free_port(port):
    """ポートを使っているプロセスを停止する。停止したものの説明を返す。"""
    pids = [p for p in listening_pids(port) if p != os.getpid()]
    if not pids:
        return None
    described = ", ".join(f"{process_name(p)}（PID {p}）" for p in pids)

    for pid in pids:
        try:
            os.kill(pid, signal.SIGTERM)  # まずは普通に止める
        except ProcessLookupError:
            pass
    for _ in range(20):  # 最大 5 秒待つ
        if not listening_pids(port):
            break
        time.sleep(0.25)
    for pid in listening_pids(port):  # まだ残っていれば強制的に止める
        try:
            os.kill(pid, signal.SIGKILL)
        except ProcessLookupError:
            pass
    time.sleep(0.5)

    if listening_pids(port):
        block(f"ポート {port} を使っているプロセス {described} を停止できませんでした。手動で停止してから起動してください。")
    return f"ポート {port} を使っていた {described} を停止しました。"


def main():
    data = json.load(sys.stdin)
    cmd = data.get("tool_input", {}).get("command", "") or ""

    freed = []
    for segment in re.split(r"&&|\|\||;|\||\n", cmd):
        segment = segment.strip()
        kind = server_kind(tokenize(segment))
        if kind is None:
            continue

        if kind == "frontend":
            port, pattern, where = FRONTEND_PORT, FRONTEND_PORT_OPTION, "画面（Vite）"
        else:
            port, pattern, where = BACKEND_PORT, BACKEND_PORT_OPTION, "サーバー（Spring Boot）"

        for m in pattern.finditer(segment):
            if int(m.group(1)) != port:
                block(
                    f"{where}はポート {port} 以外では起動できません（指定されたポート：{m.group(1)}）。"
                    f" ポートの指定を外して、{port} で起動してください。"
                    f" {port} が使われているときは、このフックが自動で停止します。"
                )

        message = free_port(port)
        if message:
            freed.append(message)

    if freed:
        text = " ".join(freed)
        print(json.dumps({
            "systemMessage": text,
            "hookSpecificOutput": {"hookEventName": "PreToolUse", "additionalContext": text},
        }, ensure_ascii=False))
    sys.exit(0)


if __name__ == "__main__":
    main()
