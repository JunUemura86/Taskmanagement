// ドラッグ＆ドロップ（dnd-kit）で使う、名前の付け方。
// どのリストの上にあるかはマウスの位置（pointerWithin）で決め、
// リストの中の何番目に差し込むかは、Board で、ドラッグ中のカードの端の位置から決める。

/** ドラッグ＆ドロップの部品に持たせる情報。カード（動かすもの）か、リスト（置く場所）か */
export type DndData = { type: 'card'; listId: number; cardId: number } | { type: 'list'; listId: number }

/** 差し込む場所。listId のリストの index 番目（0 から数える。動かすカード自身を除いて数える） */
export type DropTarget = { listId: number; index: number }

/** カードの部品の名前（リストと区別するため、前に card- を付ける） */
export function cardDndId(cardId: number): string {
  return `card-${cardId}`
}

/** リストの部品の名前 */
export function listDndId(listId: number): string {
  return `list-${listId}`
}
