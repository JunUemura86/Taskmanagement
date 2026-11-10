// チェックボックスで選んだカード（F-12）の計算。選んだカードは、カードの ID の集まり（Set）で持つ。
import type { List } from '../types'

/** リストの「すべて選択」のチェックボックスの状態。'none'：1枚も選んでいない、'some'：一部だけ、'all'：全部 */
export type ListSelectionState = 'none' | 'some' | 'all'

/** リストのカードを、どれだけ選んでいるか。カードがないリストは 'none' */
export function listSelectionState(list: List, selected: ReadonlySet<number>): ListSelectionState {
  const count = list.cards.filter((card) => selected.has(card.id)).length
  if (count === 0) return 'none'
  return count === list.cards.length ? 'all' : 'some'
}

/** カード1枚の選択を切り替えた、新しい集まりを返す */
export function toggleCard(selected: ReadonlySet<number>, cardId: number): Set<number> {
  const next = new Set(selected)
  if (next.has(cardId)) {
    next.delete(cardId)
  } else {
    next.add(cardId)
  }
  return next
}

/**
 * リストの「すべて選択」を押したときの、新しい集まりを返す。
 * 全部選んでいるときは、そのリストのカードを全部外す。それ以外（1枚も・一部だけ）は、全部選ぶ。
 * ほかのリストで選んだカードは、そのまま残す。
 */
export function toggleList(selected: ReadonlySet<number>, list: List): Set<number> {
  const next = new Set(selected)
  const selectAll = listSelectionState(list, selected) !== 'all'
  for (const card of list.cards) {
    if (selectAll) {
      next.add(card.id)
    } else {
      next.delete(card.id)
    }
  }
  return next
}

/**
 * 選んだカードのうち、今ボードにあるものの ID を返す。
 * 削除などで、もうボードにないカードの ID が残っていても、数えたり送ったりしないようにする。
 */
export function selectedCardIdsOnBoard(lists: List[], selected: ReadonlySet<number>): number[] {
  return lists.flatMap((list) => list.cards.filter((card) => selected.has(card.id)).map((card) => card.id))
}

/** 指定した ID のカードを、ボードから取り除いた新しいデータを返す（関係のないリストは、そのまま使う） */
export function removeCards(lists: List[], cardIds: ReadonlySet<number>): List[] {
  return lists.map((list) =>
    list.cards.some((card) => cardIds.has(card.id))
      ? { ...list, cards: list.cards.filter((card) => !cardIds.has(card.id)) }
      : list,
  )
}
