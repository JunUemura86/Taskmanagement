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

/** JSON を送って、JSON を受け取る（追加は POST、変更は PUT）。 */
async function sendJson<T>(method: 'POST' | 'PUT', path: string, body: unknown): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
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
  return sendJson<List>('POST', '/lists', { name })
}

/** A-04：カードをリストの一番下に追加する。作ったカードが返ってくる。 */
export function createCard(listId: number, title: string): Promise<Card> {
  return sendJson<Card>('POST', '/cards', { listId, title })
}

/** A-06 で送る内容。期限なし・ラベルなしは null。 */
export type CardUpdate = Pick<Card, 'title' | 'priority' | 'dueDate' | 'labelId'>

/** A-06：カードのタイトル・優先度・期限・ラベルを変更する。変更したあとのカードが返ってくる。 */
export function updateCard(id: number, update: CardUpdate): Promise<Card> {
  return sendJson<Card>('PUT', `/cards/${id}`, update)
}

/** A-03：ラベルの一覧を取ってくる。 */
export function fetchLabels(): Promise<Label[]> {
  return getJson<Label[]>('/labels')
}
