import { describe, expect, it } from 'vitest'
import type { Card, List } from '../types'
import {
  listSelectionState,
  removeCards,
  selectedCardIdsOnBoard,
  toggleCard,
  toggleList,
} from './selection'

function card(id: number, listId: number): Card {
  return { id, listId, labelId: null, title: `カード${id}`, priority: 2, dueDate: null, position: 0 }
}

// リスト1：1, 2, 3 ／ リスト2：4 ／ リスト3：空
const list1: List = { id: 1, name: '未着手', position: 0, isDone: false, cards: [card(1, 1), card(2, 1), card(3, 1)] }
const list2: List = { id: 2, name: '進行中', position: 1, isDone: false, cards: [card(4, 2)] }
const list3: List = { id: 3, name: '完了', position: 2, isDone: true, cards: [] }
const board = [list1, list2, list3]

describe('listSelectionState', () => {
  it('1枚も選んでいなければ none', () => {
    expect(listSelectionState(list1, new Set())).toBe('none')
  })

  it('一部だけ選んでいれば some', () => {
    expect(listSelectionState(list1, new Set([2]))).toBe('some')
  })

  it('全部選んでいれば all', () => {
    expect(listSelectionState(list1, new Set([1, 2, 3]))).toBe('all')
  })

  it('カードがないリストは none', () => {
    expect(listSelectionState(list3, new Set([1]))).toBe('none')
  })
})

describe('toggleCard', () => {
  it('選んでいなければ選ぶ、選んでいれば外す', () => {
    expect([...toggleCard(new Set([1]), 2)]).toEqual([1, 2])
    expect([...toggleCard(new Set([1, 2]), 2)]).toEqual([1])
  })

  it('もとの集まりは書き換えない', () => {
    const selected = new Set([1])
    toggleCard(selected, 2)
    expect([...selected]).toEqual([1])
  })
})

describe('toggleList', () => {
  it('一部だけ選んでいるときは、そのリストを全部選ぶ（ほかのリストの選択は残す）', () => {
    expect([...toggleList(new Set([2, 4]), list1)].sort()).toEqual([1, 2, 3, 4])
  })

  it('全部選んでいるときは、そのリストを全部外す（ほかのリストの選択は残す）', () => {
    expect([...toggleList(new Set([1, 2, 3, 4]), list1)]).toEqual([4])
  })
})

describe('selectedCardIdsOnBoard', () => {
  it('選んだカードのうち、ボードにあるものだけを返す', () => {
    expect(selectedCardIdsOnBoard(board, new Set([3, 4, 999]))).toEqual([3, 4])
  })
})

describe('removeCards', () => {
  it('指定したカードを、リストをまたいで取り除く', () => {
    const result = removeCards(board, new Set([2, 4]))
    expect(result[0].cards.map((c) => c.id)).toEqual([1, 3])
    expect(result[1].cards).toEqual([])
  })

  it('関係のないリストは、同じものをそのまま使う', () => {
    const result = removeCards(board, new Set([2]))
    expect(result[1]).toBe(list2)
    expect(result[2]).toBe(list3)
  })
})
