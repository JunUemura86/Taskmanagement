# CLAUDE.md

このファイルは、このリポジトリで作業する Claude Code が必ず守るルールを定めたものです。

## Git / GitHub 運用ルール（厳守）

### 基本の流れ

すべての変更は、次の順番で行います。例外はありません。

1. **Issue を作る**：作業を始める前に、GitHub に Issue を登録します（`gh issue create`）。
   - 対応する Issue がすでにあれば、それを使います。
   - Issue の本文には「目的」「やること」「完了条件」を書きます。
2. **ブランチを作る**：最新の main から作業ブランチを切ります。
   ```
   git switch main && git pull
   git switch -c <種類>/<Issue番号>-<内容>
   ```
3. **コミットする**：作業ブランチの上でだけコミットします。
4. **push して PR を作る**：`git push -u origin <ブランチ名>` で push し、`gh pr create` で PR を作ります。
   - PR の本文に `Closes #<Issue番号>` と書きます（マージすると Issue が自動で閉じます）。
5. **マージする**：**スカッシュマージ**で main に入れ、ブランチを削除します。
   ```
   gh pr merge <PR番号> --squash --delete-branch
   ```
   - マージはユーザーの確認を取ってから行います。
6. **後片付け**：`git switch main && git pull` で、手元の main を最新にします。

### ブランチ名

形式は `<種類>/<Issue番号>-<内容>` です。内容は、英小文字・数字・ハイフンで書きます。

| 種類 | 使う場面 | 例 |
|---|---|---|
| `feature` | 新しい機能 | `feature/12-add-login` |
| `fix` | バグの修正 | `fix/15-card-drag-bug` |
| `docs` | ドキュメントだけの変更 | `docs/18-update-readme` |
| `chore` | 設定・依存関係・ビルドなど | `chore/20-update-gradle` |
| `refactor` | 動きを変えないコード整理 | `refactor/22-split-service` |
| `test` | テストの追加・修正 | `test/25-card-api-test` |

### 禁止事項

- main ブランチへの直接コミット・直接 push
- Issue のない作業、Issue 番号のないブランチ名
- 強制 push（`git push --force`）を main に対して行うこと
- 1つのブランチに、関係のない複数の作業を混ぜること（1 Issue = 1 ブランチ = 1 PR）

### コミットメッセージ

- 日本語で、何をしたかを1行目に簡潔に書きます（これまでの履歴に合わせる）。
- 必要なら、2行目を空けて、3行目以降に理由や補足を書きます。

### 仕組みによる強制

このルールは、次の2つの仕組みでも守られています。

- **Claude Code のフック**（[.claude/hooks/guard-git.py](.claude/hooks/guard-git.py)）：main 上での commit と push、main 宛ての push、命名ルールに合わないブランチの作成を、実行前に止めます。
- **GitHub のルールセット**（main ブランチ）：PR を経ない変更、強制 push、ブランチの削除を、GitHub 側で拒否します。
