import {
  type Announcements,
  DndContext,
  type DragEndEvent,
  type DragOverEvent,
  DragOverlay,
  type DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { arrayMove, horizontalListSortingStrategy, SortableContext } from '@dnd-kit/sortable'
import { useState } from 'react'
import type { Card, Label, List } from '../types'
import type { SortKey } from '../utils/sortCards'
import { findListOfCard, moveCardInLists } from '../utils/moveCard'
import AddItemForm from './AddItemForm'
import CardView from './CardView'
import Checkbox from './Checkbox'
import { boardCollision, type DndData, listSortDndId } from './dnd'
import ListColumn from './ListColumn'

// M-04：リスト名が空のとき
const EMPTY_NAME_ERROR = 'リスト名を入力してください。'

// 1つのリストに入れられるカードの上限（機能要件 2.2）
const MAX_CARDS_PER_LIST = 100

// 画面の読み上げ（スクリーンリーダー）用の案内。画面の文字はすべて日本語にする
const SCREEN_READER_INSTRUCTIONS = {
  draggable: 'マウスで押したまま動かすと、カードやリストを別の場所へ移せます。',
}
/** ドラッグしているのが、カードかリストか（読み上げの文に使う） */
function thingOf(data: unknown): string {
  return (data as DndData | undefined)?.type === 'listSort' ? 'リスト' : 'カード'
}
const ANNOUNCEMENTS: Announcements = {
  onDragStart: ({ active }) => `${thingOf(active.data.current)}を持ち上げました。`,
  onDragOver: ({ active, over }) =>
    `${thingOf(active.data.current)}を置ける場所の${over ? '上' : '外'}にあります。`,
  onDragEnd: ({ active, over }) =>
    over ? `${thingOf(active.data.current)}を置きました。` : `${thingOf(active.data.current)}を元の場所に戻しました。`,
  onDragCancel: ({ active }) => `${thingOf(active.data.current)}を元の場所に戻しました。`,
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
  /** リスト名を変更する */
  onRenameList: (listId: number, name: string) => void
  /** リストと中のカードを削除する */
  onDeleteList: (listId: number) => void
  /** 完了用リストを指定（true）・解除（false）する */
  onSetDone: (listId: number, isDone: boolean) => void
  /** チェックボックスで選んだカードの ID */
  selectedCardIds: ReadonlySet<number>
  /** カードのチェックボックスを押したとき */
  onToggleCard: (cardId: number) => void
  /** 「すべて選択」を押したとき */
  onToggleList: (listId: number) => void
  /** リストごとの、プルダウンに表示する並べ替えの条件（ないリストは「並べ替え…」） */
  sortKeys: ReadonlyMap<number, SortKey>
  /** プルダウンで並べ替えの条件を選んだとき */
  onSort: (listId: number, key: SortKey) => void
  /** リストを、listIds の順番（左から）に並べ替える */
  onReorderLists: (listIds: number[]) => void
}

/** ドラッグ＆ドロップの部品の情報から、カードの ID を取り出す（カードでなければ null） */
function cardIdOf(data: unknown): number | null {
  const dndData = data as DndData | undefined
  return dndData?.type === 'card' ? dndData.cardId : null
}

/** ドラッグ＆ドロップの部品の情報から、並べ替え用のリストの ID を取り出す（並べ替え用のリストでなければ null） */
function sortListIdOf(data: unknown): number | null {
  const dndData = data as DndData | undefined
  return dndData?.type === 'listSort' ? dndData.listId : null
}

/**
 * ボード。リストを左から横に並べ、一番右に「＋リストを追加」を置く（多いときは横にスクロールする）。
 * カードをドラッグ＆ドロップで、別のリストや別の位置へ動かせる。
 * ドラッグ中は、まわりのカードがずれて、カードが入る場所が空く。
 * リストも、見出しのつまみ（⠿）をドラッグして左右の順番を変えられる。ドラッグ中は、まわりのリストが左右にずれる。
 */
function Board({
  lists,
  labelsById,
  onAddCard,
  onAddList,
  onOpenCard,
  onMoveCard,
  onRenameList,
  onDeleteList,
  onSetDone,
  selectedCardIds,
  onToggleCard,
  onToggleList,
  sortKeys,
  onSort,
  onReorderLists,
}: BoardProps) {
  // ドラッグ中のカード（ドラッグしていないときは null）
  const [draggingCard, setDraggingCard] = useState<Card | null>(null)
  // ドラッグ中だけ使う、表示用のボード。別のリストにカードを持っていくと、ここでそのリストへ移す。
  // 本当のボード（lists）は、離したときにだけ変える
  const [dragLists, setDragLists] = useState<List[] | null>(null)
  const shownLists = dragLists ?? lists
  // ドラッグ中のリスト（ドラッグしていないときは null）
  const [draggingList, setDraggingList] = useState<List | null>(null)

  // 5px 以上動かしたときだけドラッグを始める（ただ押しただけなら、今までどおり編集画面を開く）
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  function handleDragStart({ active }: DragStartEvent) {
    // リストのとき：並べ替えの見た目は dnd-kit がずらして表示してくれるので、ドラッグ中のリストを覚えるだけ
    const listId = sortListIdOf(active.data.current)
    if (listId !== null) {
      setDraggingList(lists.find((list) => list.id === listId) ?? null)
      return
    }

    const cardId = cardIdOf(active.data.current)
    const card = lists.flatMap((list) => list.cards).find((c) => c.id === cardId)
    if (!card) return
    setDraggingCard(card)
    setDragLists(lists)
  }

  /**
   * ドラッグ中のカードが、別のリスト（またはそのリストのカード）の上に来たら、表示用のボードでそのリストへ移す。
   * 同じリストの中での並べ替えは、dnd-kit がカードをずらして表示してくれるので、ここでは何もしない。
   */
  function handleDragOver({ active, over }: DragOverEvent) {
    const cardId = cardIdOf(active.data.current)
    if (!dragLists || cardId === null || !over) return

    const fromList = findListOfCard(dragLists, cardId)
    const overData = over.data.current as DndData | undefined
    const overCardId = cardIdOf(overData)
    const toList =
      overCardId !== null
        ? findListOfCard(dragLists, overCardId)
        : dragLists.find((list) => overData?.type === 'list' && list.id === overData.listId)
    if (!fromList || !toList || fromList.id === toList.id) return

    // 100枚あるリストには入れない（離しても動かさない）
    if (toList.cards.length >= MAX_CARDS_PER_LIST) return

    // カードの上なら、そのカードの上半分で「前」、下半分で「後」。リストの何もないところなら一番下
    let index = toList.cards.length
    if (overCardId !== null) {
      const overIndex = toList.cards.findIndex((card) => card.id === overCardId)
      const draggingRect = active.rect.current.translated
      const isBelow = draggingRect !== null && draggingRect.top > over.rect.top + over.rect.height / 2
      index = overIndex + (isBelow ? 1 : 0)
    }
    setDragLists(moveCardInLists(dragLists, cardId, toList.id, index))
  }

  function handleDragEnd({ active, over }: DragEndEvent) {
    if (sortListIdOf(active.data.current) !== null) {
      handleListDragEnd(active.data.current, over?.data.current)
      return
    }

    const cardId = cardIdOf(active.data.current)
    const current = dragLists
    resetDrag()
    // リストの外で離したときは、何もしない（元の位置に戻る）
    if (!current || cardId === null || !over) return

    const list = findListOfCard(current, cardId)
    if (!list) return

    // 同じリストの中で、別のカードの上で離したときは、そのカードの位置へ動かす
    let cards = list.cards
    const overCardId = cardIdOf(over.data.current)
    const overIndex = cards.findIndex((card) => card.id === overCardId)
    if (overIndex !== -1) {
      cards = arrayMove(cards, cards.findIndex((card) => card.id === cardId), overIndex)
    }
    // 動かした先で上から何番目か（自分より上にあるカードの枚数なので、自分を除いて数えた番号と同じ）
    const index = cards.findIndex((card) => card.id === cardId)

    // 元の位置のままなら、何もしない
    const original = findListOfCard(lists, cardId)
    if (original?.id === list.id && original.cards.findIndex((card) => card.id === cardId) === index) return

    onMoveCard(cardId, list.id, index)
  }

  /** リストを離したとき。別のリストの位置で離したら、そこへ動かした並び順を保存する */
  function handleListDragEnd(activeData: unknown, overData: unknown) {
    const listId = sortListIdOf(activeData)
    const overListId = sortListIdOf(overData)
    resetDrag()
    // ボードの外で離したとき・元の位置で離したときは、何もしない
    if (listId === null || overListId === null || listId === overListId) return

    const ids = lists.map((list) => list.id)
    const from = ids.indexOf(listId)
    const to = ids.indexOf(overListId)
    if (from === -1 || to === -1) return
    onReorderLists(arrayMove(ids, from, to))
  }

  function resetDrag() {
    setDraggingCard(null)
    setDragLists(null)
    setDraggingList(null)
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={boardCollision}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={resetDrag}
      accessibility={{ screenReaderInstructions: SCREEN_READER_INSTRUCTIONS, announcements: ANNOUNCEMENTS }}
    >
      <main className="flex min-h-[calc(100vh-3.5rem)] items-start gap-3 overflow-x-auto p-4">
        {/* 横に並んだリストとして、並べ替えられるようにする */}
        <SortableContext items={shownLists.map((list) => listSortDndId(list.id))} strategy={horizontalListSortingStrategy}>
          {shownLists.map((list) => (
            <ListColumn
              key={list.id}
              list={list}
              labelsById={labelsById}
              onAddCard={onAddCard}
              onOpenCard={onOpenCard}
              onRenameList={onRenameList}
              onDeleteList={onDeleteList}
              onSetDone={onSetDone}
              selectedCardIds={selectedCardIds}
              onToggleCard={onToggleCard}
              onToggleList={onToggleList}
              sortKey={sortKeys.get(list.id) ?? null}
              onSort={onSort}
            />
          ))}
        </SortableContext>
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
      <DragOverlay>
        {draggingCard && (
          <div className="w-64 rotate-2 cursor-grabbing shadow-lg">
            <CardView
              card={draggingCard}
              label={draggingCard.labelId === null ? undefined : labelsById.get(draggingCard.labelId)}
              isDoneList={lists.find((list) => list.id === draggingCard.listId)?.isDone ?? false}
              // チェックボックスは、見せるだけ（押せない）
              leading={<Checkbox checked={selectedCardIds.has(draggingCard.id)} label="選択" />}
            />
          </div>
        )}
        {/* ドラッグ中に、マウスについてくるリスト（リスト名と、中のカードを見せるだけ。押せない） */}
        {draggingList && (
          <div className="max-h-[80vh] w-68 rotate-2 cursor-grabbing overflow-hidden rounded-lg bg-[#f1f2f4] p-2 shadow-lg">
            <h2 className="flex items-center gap-1.5 pt-1 pb-2 font-bold">
              <span className="px-0.5 text-[#626f86]">⠿</span>
              <span className="truncate">{draggingList.name}</span>
              {draggingList.isDone && <span className="text-[#1f845a]">✓</span>}
            </h2>
            <ul className="flex flex-col gap-2">
              {draggingList.cards.map((card) => (
                <li key={card.id}>
                  <CardView
                    card={card}
                    label={card.labelId === null ? undefined : labelsById.get(card.labelId)}
                    isDoneList={draggingList.isDone}
                    leading={<Checkbox checked={selectedCardIds.has(card.id)} label="選択" />}
                  />
                </li>
              ))}
            </ul>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  )
}

export default Board
