// サーバー（Spring Boot）の API を呼ぶ処理をまとめたファイル。
// API の詳しい内容は docs/api-design.md を参照。
import type { Label, List } from './types'

// サーバーの場所。ポートは 8080 に決めている（CLAUDE.md の「サーバーの起動とポートのルール」）
const API_BASE_URL = 'http://localhost:8080/api'

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`)
  if (!response.ok) {
    throw new Error(`API の呼び出しに失敗しました（${response.status}）：${path}`)
  }
  return (await response.json()) as T
}

/** A-01：リストと、その中のカードをまとめて取ってくる。 */
export function fetchBoard(): Promise<List[]> {
  return getJson<List[]>('/board')
}

/** A-03：ラベルの一覧を取ってくる。 */
export function fetchLabels(): Promise<Label[]> {
  return getJson<Label[]>('/labels')
}
