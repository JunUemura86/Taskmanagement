import {
  type Announcements,
  DndContext,
  type DragEndEvent,
  type DragMoveEvent,
  DragOverlay,
  type DragStartEvent,
  PointerSensor,
  pointerWithin,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { useState } from 'react'
import type { Card, Label, List } from '../types'
import { countCardsAbove, referenceY } from '../utils/dropIndex'
import AddItemForm from './AddItemForm'
import CardView from './CardView'
import { type DndData, type DropTarget } from './dnd'
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

  function handleDragStart(event: DragStartEvent) {
    const data = event.active.data.current as DndData | undefined
    if (data?.type !== 'card') return
    const card = lists.find((list) => list.id === data.listId)?.cards.find((c) => c.id === data.cardId)
    setDraggingCard(card ?? null)
  }

  /** マウスを動かすたびに、差し込む場所を決め直す */
  function handleDragMove(event: DragMoveEvent) {
    const found = findDropTarget(event)
    // 元の位置のまま（置いても何も変わらない）ときは、線を出さない（ドラッグ中のカードと重なって見えるため）
    const next = found && !isSamePlace(event, found) ? found : null
    // 変わったときだけ書き換える（画面を何度も描き直さないため）
    setDropTarget((current) =>
      current?.listId === next?.listId && current?.index === next?.index ? current : next,
    )
  }

  /**
   * 差し込む場所を決める。
   * - どのリストか：マウスの下にあるリスト（リストの外なら null）
   * - 何番目か：ドラッグ中のカードの端（上へ動かしているときは上の端、下へは下の端）が、
   *   となりのカードの真ん中を越えたら、そのカードの向こう側にする
   */
  function findDropTarget({ active, over, delta }: DragMoveEvent): DropTarget | null {
    const activeData = active.data.current as DndData | undefined
    const overData = over?.data.current as DndData | undefined
    const rect = active.rect.current.translated
    if (activeData?.type !== 'card' || !overData || !rect) return null

    // そのリストのカード（ドラッグ中のカード自身を除く）の、画面の上での真ん中の高さを調べる
    const listElement = document.querySelector(`[data-list-id="${overData.listId}"]`)
    if (!listElement) return null
    const centers = Array.from(listElement.querySelectorAll<HTMLElement>('[data-card-id]'))
      .filter((element) => Number(element.dataset.cardId) !== activeData.cardId)
      .map((element) => {
        const box = element.getBoundingClientRect()
        return box.top + box.height / 2
      })

    const y = referenceY(rect.top, rect.top + rect.height, delta.y)
    return { listId: overData.listId, index: countCardsAbove(centers, y) }
  }

  /** 差し込む場所が、ドラッグ中のカードの元の位置と同じか（置いても何も変わらないか） */
  function isSamePlace({ active }: DragMoveEvent, target: DropTarget): boolean {
    const activeData = active.data.current as DndData | undefined
    if (activeData?.type !== 'card' || target.listId !== activeData.listId) return false
    const fromList = lists.find((list) => list.id === activeData.listId)
    return fromList?.cards.findIndex((card) => card.id === activeData.cardId) === target.index
  }

  function handleDragEnd(event: DragEndEvent) {
    const target = findDropTarget(event)
    const card = draggingCard
    resetDrag()
    // リストの外で離したとき・元の位置のままのときは、何もしない
    if (!target || !card || isSamePlace(event, target)) return

    onMoveCard(card.id, target.listId, target.index)
  }

  function resetDrag() {
    setDraggingCard(null)
    setDropTarget(null)
  }

  return (
    <DndContext
      sensors={sensors}
      // どのリストの上にあるかは、マウスの位置で決める
      collisionDetection={pointerWithin}
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
