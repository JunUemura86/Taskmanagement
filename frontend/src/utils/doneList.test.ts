import { describe, expect, it } from 'vitest'
import type { List } from '../types'
import { setDoneList } from './doneList'

function list(id: number, isDone: boolean): List {
  return { id, name: `リスト${id}`, position: id, isDone, cards: [] }
}

// リスト3 が完了用
const board = [list(1, false), list(2, false), list(3, true)]

describe('setDoneList', () => {
  it('指定すると、それまでの完了用リストの指定が外れる', () => {
    expect(setDoneList(board, 2, true).map((l) => l.isDone)).toEqual([false, true, false])
  })

  it('解除すると、完了用リストがない状態になる', () => {
    expect(setDoneList(board, 3, false).map((l) => l.isDone)).toEqual([false, false, false])
  })

  it('完了用リストがないときに指定できる', () => {
    const none = [list(1, false), list(2, false)]
    expect(setDoneList(none, 1, true).map((l) => l.isDone)).toEqual([true, false])
  })

  it('変わらないリストは、同じものをそのまま使う', () => {
    const result = setDoneList(board, 2, true)
    expect(result[0]).toBe(board[0])
  })
})
