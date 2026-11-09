// カードをドラッグ＆ドロップで動かしたときの、ボードのデータの計算。
// サーバー（PATCH /api/cards/{id}/position）と同じ考え方で、並び順（position）を 0, 1, 2… に振り直す。
import type { Card, List } from '../types'

/**
 * カードを、toListId のリストの toIndex 番目（0 から数える。動かすカード自身を除いて数える）に動かした、
 * 新しいボードのデータを返す。toIndex がリストの枚数より大きいときは一番下にする。
 * カードが見つからないときは、そのままのデータを返す。
 */
export function moveCardInLists(lists: List[], cardId: number, toListId: number, toIndex: number): List[] {
  const card = lists.flatMap((list) => list.cards).find((c) => c.id === cardId)
  if (!card) return lists

  return lists.map((list) => {
    // 動かすカードを抜く
    const cards = list.cards.filter((c) => c.id !== cardId)
    // 動かした先のリストなら、toIndex 番目に差し込む
    if (list.id === toListId) {
      cards.splice(Math.min(toIndex, cards.length), 0, { ...card, listId: toListId })
    } else if (cards.length === list.cards.length) {
      // 動かすカードが入っていない、関係のないリストは、そのまま返す
      return list
    }
    return { ...list, cards: renumber(cards) }
  })
}

/** カードが入っているリストを探す。見つからないときは undefined */
export function findListOfCard(lists: List[], cardId: number): List | undefined {
  return lists.find((list) => list.cards.some((card) => card.id === cardId))
}

/** カードの並び順を、上から 0, 1, 2… に振り直す（変わらないカードは、そのまま使う）。 */
function renumber(cards: Card[]): Card[] {
  return cards.map((card, index) => (card.position === index ? card : { ...card, position: index }))
}
