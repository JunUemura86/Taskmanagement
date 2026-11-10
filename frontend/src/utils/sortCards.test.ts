import { describe, expect, it } from 'vitest'
import type { Card, Priority } from '../types'
import { sortCards } from './sortCards'

function card(id: number, priority: Priority, dueDate: string | null, labelId: number | null): Card {
  return { id, listId: 1, labelId, title: `カード${id}`, priority, dueDate, position: 0 }
}

// ラベルの並び順：赤(10)=0、黄(11)=1、緑(12)=2
const labelPositions = new Map([
  [10, 0],
  [11, 1],
  [12, 2],
])

/** 並べ替えたあとの、カードの ID の順番 */
function order(cards: Card[]) {
  return cards.map((c) => c.id)
}

describe('sortCards', () => {
  describe('優先度順', () => {
    it('高 → 中 → 低 の順になる', () => {
      const cards = [card(1, 3, null, null), card(2, 1, null, null), card(3, 2, null, null)]
      expect(order(sortCards(cards, 'priority', labelPositions))).toEqual([2, 3, 1])
    })

    it('同じ優先度なら、期限の早い順（期限なしは下）→ 追加した順', () => {
      const cards = [
        card(4, 1, null, null),
        card(3, 1, '2026-11-20', null),
        card(2, 1, '2026-11-10', null),
        card(1, 1, '2026-11-20', null),
      ]
      expect(order(sortCards(cards, 'priority', labelPositions))).toEqual([2, 1, 3, 4])
    })
  })

  describe('期限順', () => {
    it('期限の早い順で、期限なしは一番下', () => {
      const cards = [card(1, 2, null, null), card(2, 2, '2026-12-01', null), card(3, 2, '2026-11-05', null)]
      expect(order(sortCards(cards, 'dueDate', labelPositions))).toEqual([3, 2, 1])
    })

    it('同じ期限なら、優先度の高い順 → 追加した順', () => {
      const cards = [card(3, 3, '2026-11-10', null), card(2, 1, '2026-11-10', null), card(1, 3, '2026-11-10', null)]
      expect(order(sortCards(cards, 'dueDate', labelPositions))).toEqual([2, 1, 3])
    })
  })

  describe('カテゴリ別', () => {
    it('ラベルの順（赤 → 黄 → 緑）で、ラベルなしは一番下', () => {
      const cards = [card(1, 2, null, null), card(2, 2, null, 12), card(3, 2, null, 10), card(4, 2, null, 11)]
      expect(order(sortCards(cards, 'label', labelPositions))).toEqual([3, 4, 2, 1])
    })

    it('同じラベルなら、優先度の高い順 → 追加した順', () => {
      const cards = [card(3, 2, null, 10), card(2, 1, null, 10), card(1, 2, null, 10)]
      expect(order(sortCards(cards, 'label', labelPositions))).toEqual([2, 1, 3])
    })

    it('ラベルなしどうしは、優先度の高い順 → 追加した順', () => {
      const cards = [card(3, 2, null, null), card(2, 1, null, null), card(1, 2, null, null)]
      expect(order(sortCards(cards, 'label', labelPositions))).toEqual([2, 1, 3])
    })
  })

  describe('追加した順', () => {
    it('カードの ID の小さい順（古いものが上）', () => {
      const cards = [card(5, 1, null, null), card(2, 3, null, null), card(9, 2, null, null)]
      expect(order(sortCards(cards, 'created', labelPositions))).toEqual([2, 5, 9])
    })
  })

  it('並び順（position）を 0, 1, 2… に振り直し、もとの配列は書き換えない', () => {
    const cards = [card(2, 1, null, null), card(1, 1, null, null)]
    const result = sortCards(cards, 'created', labelPositions)
    expect(result.map((c) => c.position)).toEqual([0, 1])
    expect(order(cards)).toEqual([2, 1])
  })
})
