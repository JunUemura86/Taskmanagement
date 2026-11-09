// サーバー（Spring Boot）の API を呼ぶ処理をまとめたファイル。
// API の詳しい内容は docs/api-design.md を参照。
import type { Card, Label, List } from './types'

// サーバーの場所。ポートは 8080 に決めている（CLAUDE.md の「サーバーの起動とポートのルール」）
const API_BASE_URL = 'http://localhost:8080/api'

/** サーバーがエラーを返したときのエラー。status で、どんなエラーかを見分けられる（409 など）。 */
export class ApiError extends Error {
  readonly status: number

  constructor(status: number, path: string) {
    super(`API の呼び出しに失敗しました（${status}）：${path}`)
    this.status = status
  }
}

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`)
  if (!response.ok) {
    throw new ApiError(response.status, path)
  }
  return (await response.json()) as T
}

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!response.ok) {
    throw new ApiError(response.status, path)
  }
  return (await response.json()) as T
}

/** A-01：リストと、その中のカードをまとめて取ってくる。 */
export function fetchBoard(): Promise<List[]> {
  return getJson<List[]>('/board')
}

/** A-05：リストを一番右に追加する。作ったリスト（カードは空）が返ってくる。 */
export function createList(name: string): Promise<List> {
  return postJson<List>('/lists', { name })
}

/** A-04：カードをリストの一番下に追加する。作ったカードが返ってくる。 */
export function createCard(listId: number, title: string): Promise<Card> {
  return postJson<Card>('/cards', { listId, title })
}

/** A-03：ラベルの一覧を取ってくる。 */
export function fetchLabels(): Promise<Label[]> {
  return getJson<Label[]>('/labels')
}
