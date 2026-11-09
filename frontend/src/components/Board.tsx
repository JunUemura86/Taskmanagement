import {
  type Announcements,
  DndContext,
  type DragEndEvent,
  type DragMoveEvent,
  DragOverlay,
  type DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { useState } from 'react'
import type { Card, Label, List } from '../types'
import AddItemForm from './AddItemForm'
import CardView from './CardView'
import { cardFirstCollision, type DndData, type DropTarget } from './dnd'
import ListColumn from './ListColumn'

// M-04：リスト名が空のとき
const EMPTY_NAME_ERROR = 'リスト名を入力してください。'

// 画面の読み上げ（スクリーンリーダー）用の案内。画面の文字はすべて日本語にする
const SCREEN_READER_INSTRUCTIONS = { draggable: 'マウスで押したまま動かすと、カードを別の場所へ移せます。' }
const ANNOUNCEMENTS: Announcements = {
  onDragStart: () => 'カードを持ち上げました。',
  onDragOver: ({ over }) => (over ? 'カードを置ける場所の上にあります。' : 'カードを置ける場所の外にあります。'),
  onDragEnd: ({ over }) => (over ? 'カードを置きました。' : 'カードを元の場所に戻しました。'),
  onDragCancel: () => 'カードを元の場所に戻しました。',
}

type BoardProps = {
  lists: List[]
  /** ラベルの ID から、ラベルを引けるようにしたもの */
  labelsById: Map<number, Label>
  /** カードを追加する。追加できたら true を返す */
  onAddCard: (listId: number, title: string) => Promise<boolean>
  /** リストを追加する。追加できたら true を返す */
  onAddList: (name: string) => Promise<boolean>
  /** カードを押したとき（編集画面を開く） */
  onOpenCard: (cardId: number) => void
  /** カードを、listId のリストの index 番目（動かすカード自身を除いて数える）に動かす */
  onMoveCard: (cardId: number, listId: number, index: number) => void
}

/**
 * ボード。リストを左から横に並べ、一番右に「＋リストを追加」を置く（多いときは横にスクロールする）。
 * カードをドラッグ＆ドロップで、別のリストや別の位置へ動かせる。
 */
function Board({ lists, labelsById, onAddCard, onAddList, onOpenCard, onMoveCard }: BoardProps) {
  // ドラッグ中のカード（ドラッグしていないときは null）
  const [draggingCard, setDraggingCard] = useState<Card | null>(null)
  // 差し込む場所（リストの外にあるときは null）
  const [dropTarget, setDropTarget] = useState<DropTarget | null>(null)

  // 5px 以上動かしたときだけドラッグを始める（ただ押しただけなら、今までどおり編集画面を開く）
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  /** カードが、そのリストの上から何番目（動かすカード自身を除く）にあるか。ないときは -1 */
  function indexWithout(list: List, cardId: number, draggingId: number): number {
    return list.cards.filter((card) => card.id !== draggingId).findIndex((card) => card.id === cardId)
  }

  function handleDragStart(event: DragStartEvent) {
    const data = event.active.data.current as DndData | undefined
    if (data?.type !== 'card') return
    const card = lists.find((list) => list.id === data.listId)?.cards.find((c) => c.id === data.cardId)
    setDraggingCard(card ?? null)
  }

  /** マウスを動かすたびに、差し込む場所を決め直す */
  function handleDragMove(event: DragMoveEvent) {
    const next = findDropTarget(event)
    // 変わったときだけ書き換える（画面を何度も描き直さないため）
    setDropTarget((current) =>
      current?.listId === next?.listId && current?.index === next?.index ? current : next,
    )
  }

  function findDropTarget({ active, over, activatorEvent, delta }: DragMoveEvent): DropTarget | null {
    const activeData = active.data.current as DndData | undefined
    const overData = over?.data.current as DndData | undefined
    if (activeData?.type !== 'card' || !over || !overData) return null
    const draggingId = activeData.cardId
    const list = lists.find((l) => l.id === overData.listId)
    if (!list) return null

    // リストの何もないところ（カードの下・空のリスト）なら、一番下
    if (overData.type === 'list') {
      return { listId: list.id, index: list.cards.filter((card) => card.id !== draggingId).length }
    }

    // ドラッグ中のカード自身の上なら、元の位置（動かさない）
    if (overData.cardId === draggingId) {
      return { listId: list.id, index: list.cards.findIndex((card) => card.id === draggingId) }
    }

    // ほかのカードの上なら、そのカードの上半分で「前」、下半分で「後」に差し込む
    const pointerY = (activatorEvent as PointerEvent).clientY + delta.y
    const isLowerHalf = pointerY > over.rect.top + over.rect.height / 2
    const index = indexWithout(list, overData.cardId, draggingId)
    return { listId: list.id, index: index + (isLowerHalf ? 1 : 0) }
  }

  function handleDragEnd(event: DragEndEvent) {
    const target = findDropTarget(event)
    const card = draggingCard
    resetDrag()
    // リストの外で離したときは、何もしない（元の位置のまま）
    if (!target || !card) return

    // 位置が変わらないときも、何もしない
    const fromList = lists.find((list) => list.id === card.listId)
    const fromIndex = fromList ? fromList.cards.findIndex((c) => c.id === card.id) : -1
    if (target.listId === card.listId && target.index === fromIndex) return

    onMoveCard(card.id, target.listId, target.index)
  }

  function resetDrag() {
    setDraggingCard(null)
    setDropTarget(null)
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={cardFirstCollision}
      onDragStart={handleDragStart}
      onDragMove={handleDragMove}
      onDragEnd={handleDragEnd}
      onDragCancel={resetDrag}
      accessibility={{ screenReaderInstructions: SCREEN_READER_INSTRUCTIONS, announcements: ANNOUNCEMENTS }}
    >
      <main className="flex min-h-[calc(100vh-3.5rem)] items-start gap-3 overflow-x-auto p-4">
        {lists.map((list) => (
          <ListColumn
            key={list.id}
            list={list}
            labelsById={labelsById}
            draggingCardId={draggingCard?.id ?? null}
            dropIndex={dropTarget?.listId === list.id ? dropTarget.index : null}
            onAddCard={onAddCard}
            onOpenCard={onOpenCard}
          />
        ))}
        <div className="w-68 shrink-0 rounded-lg bg-[#f1f2f4]/70 p-2">
          <AddItemForm
            buttonLabel="＋リストを追加"
            inputLabel="リスト名"
            placeholder="リスト名を入力して Enter"
            maxLength={30}
            emptyError={EMPTY_NAME_ERROR}
            onAdd={onAddList}
          />
        </div>
      </main>

      {/* ドラッグ中に、マウスについてくるカード */}
      <DragOverlay dropAnimation={null}>
        {draggingCard && (
          <div className="w-64 rotate-2 cursor-grabbing shadow-lg">
            <CardView
              card={draggingCard}
              label={draggingCard.labelId === null ? undefined : labelsById.get(draggingCard.labelId)}
              isDoneList={lists.find((list) => list.id === draggingCard.listId)?.isDone ?? false}
            />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  )
}

export default Board
