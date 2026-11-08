// サーバー（Spring Boot）の API を呼ぶ処理をまとめたファイル。
// API の詳しい内容は docs/api-design.md を参照。

// サーバーの場所。ポートは 8080 に決めている（CLAUDE.md の「サーバーの起動とポートのルール」）
const API_BASE_URL = 'http://localhost:8080/api'

async function getJson(path) {
  const response = await fetch(`${API_BASE_URL}${path}`)
  if (!response.ok) {
    throw new Error(`API の呼び出しに失敗しました（${response.status}）：${path}`)
  }
  return response.json()
}

/** A-01：リストと、その中のカードをまとめて取ってくる。 */
export function fetchBoard() {
  return getJson('/board')
}

/** A-03：ラベルの一覧を取ってくる。 */
export function fetchLabels() {
  return getJson('/labels')
}
