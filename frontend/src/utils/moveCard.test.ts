import { describe, expect, it } from 'vitest'
import type { Card, List } from '../types'
import { moveCardInLists } from './moveCard'

function card(id: number, listId: number, position: number): Card {
  return { id, listId, labelId: null, title: `カード${id}`, priority: 2, dueDate: null, position }
}

// リスト1：1, 2, 3 ／ リスト2：4, 5 ／ リスト3：空
const board: List[] = [
  { id: 1, name: '未着手', position: 0, isDone: false, cards: [card(1, 1, 0), card(2, 1, 1), card(3, 1, 2)] },
  { id: 2, name: '進行中', position: 1, isDone: false, cards: [card(4, 2, 0), card(5, 2, 1)] },
  { id: 3, name: '完了', position: 2, isDone: true, cards: [] },
]

/** 各リストの「カードの ID と並び順」だけを取り出す（確かめやすくするため） */
function summary(lists: List[]) {
  return lists.map((list) => list.cards.map((c) => [c.id, c.listId, c.position]))
}

describe('moveCardInLists', () => {
  it('同じリストで、一番上のカードを一番下へ動かせる', () => {
    const result = moveCardInLists(board, 1, 1, 2)
    expect(summary(result)[0]).toEqual([
      [2, 1, 0],
      [3, 1, 1],
      [1, 1, 2],
    ])
  })

  it('同じリストで、一番下のカードを一番上へ動かせる', () => {
    const result = moveCardInLists(board, 3, 1, 0)
    expect(summary(result)[0]).toEqual([
      [3, 1, 0],
      [1, 1, 1],
      [2, 1, 2],
    ])
  })

  it('別のリストへ動かすと、両方のリストの並び順が振り直される', () => {
    const result = moveCardInLists(board, 2, 2, 1)
    expect(summary(result)[0]).toEqual([
      [1, 1, 0],
      [3, 1, 1],
    ])
    expect(summary(result)[1]).toEqual([
      [4, 2, 0],
      [2, 2, 1],
      [5, 2, 2],
    ])
  })

  it('空のリストへ動かせる', () => {
    const result = moveCardInLists(board, 5, 3, 0)
    expect(summary(result)[1]).toEqual([[4, 2, 0]])
    expect(summary(result)[2]).toEqual([[5, 3, 0]])
  })

  it('位置が大きすぎるときは一番下に入る', () => {
    const result = moveCardInLists(board, 1, 2, 99)
    expect(summary(result)[1]).toEqual([
      [4, 2, 0],
      [5, 2, 1],
      [1, 2, 2],
    ])
  })

  it('関係のないリストは、同じものをそのまま使う', () => {
    const result = moveCardInLists(board, 1, 1, 2)
    expect(result[1]).toBe(board[1])
    expect(result[2]).toBe(board[2])
  })

  it('もとのデータは書き換えない', () => {
    moveCardInLists(board, 2, 2, 0)
    expect(summary(board)[0]).toEqual([
      [1, 1, 0],
      [2, 1, 1],
      [3, 1, 2],
    ])
  })
})
