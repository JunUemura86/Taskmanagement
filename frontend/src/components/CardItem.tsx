import { useDraggable, useDroppable } from '@dnd-kit/core'
import type { Card, Label } from '../types'
import CardView from './CardView'
import { cardDndId, type DndData } from './dnd'

type CardItemProps = {
  card: Card
  /** ラベルなしのときは undefined */
  label?: Label
  /** 完了用リストのカードなら true */
  isDoneList: boolean
  /** カードを押したとき（編集画面を開く） */
  onOpen: () => void
}

/**
 * ボードの中のカード1枚。押すと編集画面を開く。
 * ドラッグして動かせる（useDraggable）。ほかのカードを上に重ねると、差し込む位置の目印にもなる（useDroppable）。
 * ドラッグ中は、元の場所のカードを薄く表示する（マウスについてくるカードは Board の DragOverlay が表示する）。
 */
function CardItem({ card, label, isDoneList, onOpen }: CardItemProps) {
  const id = cardDndId(card.id)
  const data: DndData = { type: 'card', listId: card.listId, cardId: card.id }
  const { setNodeRef: setDragRef, listeners, isDragging } = useDraggable({ id, data })
  const { setNodeRef: setDropRef } = useDroppable({ id, data })

  return (
    // あとでカードの中にチェックボックスを入れるため、<button> ではなく「ボタンとして働く div」にする
    <div
      ref={(node) => {
        setDragRef(node)
        setDropRef(node)
      }}
      // マウスで押したまま動かすと、ドラッグが始まる
      {...listeners}
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(event) => {
        // キーボードの Enter・スペースでも開けるようにする
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onOpen()
        }
      }}
      aria-label={`カード「${card.title}」を編集`}
      className={`cursor-pointer touch-none rounded-md outline-none hover:ring-2 hover:ring-[#8590a2]/40 focus-visible:ring-2 focus-visible:ring-[#0c66e4] ${isDragging ? 'opacity-40' : ''}`}
    >
      <CardView card={card} label={label} isDoneList={isDoneList} />
    </div>
  )
}

export default CardItem
