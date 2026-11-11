// ドラッグ＆ドロップ（dnd-kit）で使う、名前の付け方と、重なっている場所の探し方。
import { type CollisionDetection, closestCenter, pointerWithin } from '@dnd-kit/core'
import type { List } from '../types'
import { findListOfCard } from '../utils/moveCard'

/**
 * ドラッグ＆ドロップの部品に持たせる情報。
 * - card：カード
 * - list：カードを置く場所としてのリスト
 * - listSort：左右に並べ替えるものとしてのリスト（UC-13）
 */
export type DndData =
  | { type: 'card'; cardId: number }
  | { type: 'list'; listId: number }
  | { type: 'listSort'; listId: number }

/** カードの部品の名前（リストと区別するため、前に card- を付ける） */
export function cardDndId(cardId: number): string {
  return `card-${cardId}`
}

/** カードを置く場所としての、リストの部品の名前 */
export function listDndId(listId: number): string {
  return `list-${listId}`
}

/** 並べ替えるものとしての、リストの部品の名前 */
export function listSortDndId(listId: number): string {
  return `list-sort-${listId}`
}

/**
 * カードをドラッグしているときに、マウスの下にある部品（over）が、どのリストのものかを返す。
 * - カードの上：そのカードが入っているリスト
 * - リストの何もないところ：そのリスト
 * - それ以外（並べ替え用のリストなど）・見つからないとき：undefined
 */
export function listOfDropTarget(lists: List[], overData: unknown): List | undefined {
  const data = overData as DndData | undefined
  if (data?.type === 'card') return findListOfCard(lists, data.cardId)
  if (data?.type === 'list') return lists.find((list) => list.id === data.listId)
  return undefined
}

/** 部品に持たせた情報の種類（card・list・listSort）を取り出す */
function typeOf(data: unknown): DndData['type'] | undefined {
  return (data as DndData | undefined)?.type
}

/**
 * マウスの下にある部品を探す。何をドラッグしているかで、探し方を分ける。
 * - リストをドラッグ中：並べ替え用のリストだけを対象に、一番近いものを選ぶ（左右にずれる動きのため）
 * - カードをドラッグ中：並べ替え用のリストは対象から外し、カードとリストが重なっているときはカードを優先する
 *   （カードはリストの中にあるので、カードの上ではいつも両方が重なる）。
 *   どれにも重なっていない（リストの外）ときは、空になる → 離すと元の位置に戻る。
 */
export const boardCollision: CollisionDetection = (args) => {
  const isListSort = (container: (typeof args.droppableContainers)[number]) =>
    typeOf(container.data.current) === 'listSort'

  if (typeOf(args.active.data.current) === 'listSort') {
    return closestCenter({ ...args, droppableContainers: args.droppableContainers.filter(isListSort) })
  }

  const hits = pointerWithin({
    ...args,
    droppableContainers: args.droppableContainers.filter((container) => !isListSort(container)),
  })
  const cardHit = hits.find((hit) => typeOf(hit.data?.droppableContainer.data.current) === 'card')
  return cardHit ? [cardHit] : hits
}
