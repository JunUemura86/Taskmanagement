import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
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
 * ボードの中のカード1枚。押すと編集画面を開き、押したまま動かすとドラッグできる。
 * ほかのカードをドラッグしているときは、入る場所を空けるために、なめらかに上下にずれる（useSortable）。
 * ドラッグ中のカード自身は、入る予定の場所に薄く表示する（マウスについてくるカードは Board の DragOverlay が表示する）。
 */
function CardItem({ card, label, isDoneList, onOpen }: CardItemProps) {
  const data: DndData = { type: 'card', cardId: card.id }
  const { setNodeRef, listeners, transform, transition, isDragging } = useSortable({ id: cardDndId(card.id), data })

  return (
    // あとでカードの中にチェックボックスを入れるため、<button> ではなく「ボタンとして働く div」にする
    <div
      ref={setNodeRef}
      // ずれる動き（上下に動かす量と、動くときのなめらかさ）
      style={{ transform: CSS.Translate.toString(transform), transition }}
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
