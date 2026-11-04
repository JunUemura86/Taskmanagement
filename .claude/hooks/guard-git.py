#!/usr/bin/env python3
"""Claude Code PreToolUse フック: git 運用ルールを強制する。

- main ブランチ上での git commit / git push を禁止
- main 宛ての push（例: git push origin main, HEAD:main）を禁止
- ブランチ名は <種類>/<Issue番号>-<内容> のみ許可
  種類: feature / fix / docs / chore / refactor / test
  例: feature/12-add-login

ルール違反のときは exit 2 で止め、理由を stderr に出す（Claude に伝わる）。
"""
import json
import re
import shlex
import subprocess
import sys

BRANCH_RULE = re.compile(r"^(feature|fix|docs|chore|refactor|test)/[0-9]+-[a-z0-9]+(-[a-z0-9]+)*$")
PROTECTED = "main"


def block(msg):
    print(msg + "\n詳しくは CLAUDE.md の「Git / GitHub 運用ルール」を参照してください。", file=sys.stderr)
    sys.exit(2)


def current_branch(cwd):
    try:
        out = subprocess.run(
            ["git", "rev-parse", "--abbrev-ref", "HEAD"],
            cwd=cwd, capture_output=True, text=True, timeout=5,
        )
        return out.stdout.strip()
    except Exception:
        return ""


def git_args(segment):
    """'git ...' で始まる部分なら、git 自身のオプションを除いた引数リストを返す。"""
    try:
        tokens = shlex.split(segment)
    except ValueError:
        tokens = segment.split()
    # 先頭の環境変数代入（FOO=bar git ...）を飛ばす
    while tokens and re.match(r"^[A-Za-z_][A-Za-z0-9_]*=", tokens[0]):
        tokens.pop(0)
    if not tokens or tokens[0] != "git":
        return None
    args = tokens[1:]
    # git -C <path> / -c <k=v> などのグローバルオプションを飛ばす
    while args and args[0].startswith("-"):
        opt = args.pop(0)
        if opt in ("-C", "-c", "--git-dir", "--work-tree") and args:
            args.pop(0)
    return args


def main():
    data = json.load(sys.stdin)
    cmd = data.get("tool_input", {}).get("command", "") or ""
    cwd = data.get("cwd") or None

    for segment in re.split(r"&&|\|\||;|\||\n", cmd):
        args = git_args(segment.strip())
        if not args:
            continue
        sub, rest = args[0], args[1:]

        if sub == "commit":
            if current_branch(cwd) == PROTECTED:
                block("main ブランチへの直接コミットは禁止です。Issue を作成し、作業ブランチを切ってからコミットしてください。")

        elif sub == "push":
            if current_branch(cwd) == PROTECTED:
                block("main ブランチからの push は禁止です。作業ブランチから push し、PR を作成してください。")
            for a in rest:
                if a.startswith("-"):
                    continue
                target = a.split(":", 1)[1] if ":" in a else a
                if target.lstrip("+") in (PROTECTED, "refs/heads/" + PROTECTED):
                    block("main への push は禁止です。PR 経由でマージしてください。")

        elif sub in ("checkout", "switch", "branch"):
            create_flags = {"checkout": ("-b", "-B"), "switch": ("-c", "-C", "--create")}.get(sub)
            name = None
            if create_flags:
                for i, a in enumerate(rest):
                    if a in create_flags and i + 1 < len(rest):
                        name = rest[i + 1]
                        break
            else:  # git branch <name>（一覧表示・削除・リネームなどは対象外）
                positional = [a for a in rest if not a.startswith("-")]
                if positional and not any(a.startswith("-") for a in rest):
                    name = positional[0]
            if name and not BRANCH_RULE.match(name):
                block(
                    f"ブランチ名 '{name}' はルール違反です。"
                    " <種類>/<Issue番号>-<内容> の形式にしてください（例: feature/12-add-login）。"
                    " 種類は feature / fix / docs / chore / refactor / test のいずれかです。"
                )

    sys.exit(0)


if __name__ == "__main__":
    main()
