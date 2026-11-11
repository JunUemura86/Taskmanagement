import { describe, expect, it } from 'vitest'
import type { Card, List } from '../types'
import { type DndData, listOfDropTarget } from './dnd'

function card(id: number, listId: number, position: number): Card {
  return { id, listId, labelId: null, title: `カード${id}`, priority: 2, dueDate: null, position }
}

// リスト1：1, 2 ／ リスト2：3 ／ リスト3：空
const board: List[] = [
  { id: 1, name: '未着手', position: 0, isDone: false, cards: [card(1, 1, 0), card(2, 1, 1)] },
  { id: 2, name: '進行中', position: 1, isDone: false, cards: [card(3, 2, 0)] },
  { id: 3, name: '完了', position: 2, isDone: true, cards: [] },
]

describe('listOfDropTarget', () => {
  it('カードの上なら、そのカードが入っているリストを返す', () => {
    const over: DndData = { type: 'card', cardId: 3 }
    expect(listOfDropTarget(board, over)?.id).toBe(2)
  })

  it('リストの何もないところなら、そのリストを返す（カードのないリストも）', () => {
    const over: DndData = { type: 'list', listId: 3 }
    expect(listOfDropTarget(board, over)?.id).toBe(3)
  })

  it('並べ替え用のリストの上なら、undefined を返す', () => {
    const over: DndData = { type: 'listSort', listId: 1 }
    expect(listOfDropTarget(board, over)).toBeUndefined()
  })

  it('部品の情報がないとき・ボードにないカードやリストのときは、undefined を返す', () => {
    expect(listOfDropTarget(board, undefined)).toBeUndefined()
    expect(listOfDropTarget(board, { type: 'card', cardId: 99 })).toBeUndefined()
    expect(listOfDropTarget(board, { type: 'list', listId: 99 })).toBeUndefined()
  })
})
