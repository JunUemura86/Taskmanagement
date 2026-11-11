import { describe, expect, it } from 'vitest'
import type { List } from '../types'
import { orderLists } from './orderLists'

// 未着手(0) 進行中(1) 完了(2)
const board: List[] = [
  {
    id: 1,
    name: '未着手',
    position: 0,
    isDone: false,
    cards: [{ id: 1, listId: 1, labelId: null, title: 'カード1', priority: 2, dueDate: null, position: 0 }],
  },
  { id: 2, name: '進行中', position: 1, isDone: false, cards: [] },
  { id: 3, name: '完了', position: 2, isDone: true, cards: [] },
]

describe('orderLists', () => {
  it('送った順番に並び、並び順が 0, 1, 2… に振り直される', () => {
    const result = orderLists(board, [3, 1, 2])
    expect(result.map((list) => [list.id, list.position])).toEqual([
      [3, 0],
      [1, 1],
      [2, 2],
    ])
  })

  it('リストの中のカードはそのまま残る', () => {
    const result = orderLists(board, [2, 3, 1])
    expect(result[2].cards).toEqual(board[0].cards)
  })

  it('元のボードは変えない', () => {
    orderLists(board, [3, 2, 1])
    expect(board.map((list) => [list.id, list.position])).toEqual([
      [1, 0],
      [2, 1],
      [3, 2],
    ])
  })
})
