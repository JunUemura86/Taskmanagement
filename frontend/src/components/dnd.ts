// ドラッグ＆ドロップ（dnd-kit）で使う、名前の付け方と、重なっている場所の探し方。
import { type CollisionDetection, pointerWithin } from '@dnd-kit/core'

/** ドラッグ＆ドロップの部品に持たせる情報。カードか、リストか */
export type DndData = { type: 'card'; cardId: number } | { type: 'list'; listId: number }

/** カードの部品の名前（リストと区別するため、前に card- を付ける） */
export function cardDndId(cardId: number): string {
  return `card-${cardId}`
}

/** リストの部品の名前 */
export function listDndId(listId: number): string {
  return `list-${listId}`
}

/**
 * マウスの下にある部品を探す。カードとリストが重なっているときは、カードを優先する
 * （カードはリストの中にあるので、カードの上ではいつも両方が重なる）。
 * どれにも重なっていない（リストの外）ときは、空になる → 離すと元の位置に戻る。
 */
export const cardFirstCollision: CollisionDetection = (args) => {
  const hits = pointerWithin(args)
  const cardHit = hits.find(
    (hit) => (hit.data?.droppableContainer.data.current as DndData | undefined)?.type === 'card',
  )
  return cardHit ? [cardHit] : hits
}
