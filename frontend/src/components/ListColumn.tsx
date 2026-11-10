import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useCallback, useState } from 'react'
import type { Label, List } from '../types'
import { listSelectionState } from '../utils/selection'
import { SORT_OPTIONS, type SortKey } from '../utils/sortCards'
import AddItemForm from './AddItemForm'
import CardItem from './CardItem'
import Checkbox from './Checkbox'
import ConfirmDialog from './ConfirmDialog'
import ListMenu from './ListMenu'
import ListNameEditor from './ListNameEditor'
import { cardDndId, type DndData, listDndId } from './dnd'

// M-05：カードのタイトルが空のとき
const EMPTY_TITLE_ERROR = 'タイトルを入力してください。'

type ListColumnProps = {
  list: List
  /** ラベルの ID から、ラベルを引けるようにしたもの */
  labelsById: Map<number, Label>
  /** カードを追加する。追加できたら true を返す */
  onAddCard: (listId: number, title: string) => Promise<boolean>
  /** カードを押したとき（編集画面を開く） */
  onOpenCard: (cardId: number) => void
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
  /** プルダウンに表示する並べ替えの条件（「並べ替え…」のときは null） */
  sortKey: SortKey | null
  /** プルダウンで並べ替えの条件を選んだとき */
  onSort: (listId: number, key: SortKey) => void
}

/**
 * リスト1つ。見出し（リスト名・完了用なら ✓）と、中のカードと、「＋カードを追加」を表示する。
 * 中のカードは、ドラッグ＆ドロップで並べ替えられる（SortableContext）。
 * リスト全体も、カードを置ける場所になる（カードのないリストや、カードの下の何もないところに置けるようにするため）。
 */
function ListColumn({
  list,
  labelsById,
  onAddCard,
  onOpenCard,
  onRenameList,
  onDeleteList,
  onSetDone,
  selectedCardIds,
  onToggleCard,
  onToggleList,
  sortKey,
  onSort,
}: ListColumnProps) {
  const selection = listSelectionState(list, selectedCardIds)
  // 削除の確認メッセージ（M-03）を出しているときは true
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false)
  // 確認メッセージの Esc の設定が毎回作り直されないよう、同じ関数を使い続ける
  const cancelDelete = useCallback(() => setIsConfirmingDelete(false), [])
  const data: DndData = { type: 'list', listId: list.id }
  const { setNodeRef } = useDroppable({ id: listDndId(list.id), data })

  return (
    <section ref={setNodeRef} className="w-68 shrink-0 rounded-lg bg-[#f1f2f4] p-2">
      <h2 className="flex items-center gap-1.5 pt-1 pb-2 pl-1 font-bold">
        {/* 「すべて選択」：一部だけ選んでいるときは「－」の表示。カードがないときは押せない */}
        <Checkbox
          checked={selection === 'all'}
          indeterminate={selection === 'some'}
          disabled={list.cards.length === 0}
          label={`リスト「${list.name}」のカードをすべて選択`}
          onToggle={() => onToggleList(list.id)}
        />
        {/* リスト名：クリックすると変更できる */}
        <ListNameEditor name={list.name} onRename={(name) => onRenameList(list.id, name)} />
        {list.isDone && (
          <span className="shrink-0 pr-1 text-[#1f845a]" title="完了用リスト">
            ✓
          </span>
        )}
        {/* 「…」メニュー。押し間違いを防ぐため、リストの削除はこの中に置く */}
        <ListMenu
          listName={list.name}
          items={[
            list.isDone
              ? { label: '完了用リストを解除', onSelect: () => onSetDone(list.id, false) }
              : { label: '完了用リストにする', onSelect: () => onSetDone(list.id, true) },
            { label: 'リストを削除', onSelect: () => setIsConfirmingDelete(true), isDanger: true },
          ]}
        />
      </h2>
      {/* 並べ替えのプルダウン（UC-12）。カードが1枚以下のときは押せない */}
      <select
        value={sortKey ?? ''}
        onChange={(event) => onSort(list.id, event.target.value as SortKey)}
        disabled={list.cards.length <= 1}
        aria-label={`リスト「${list.name}」のカードを並べ替える`}
        className="mb-2 w-full cursor-pointer rounded-md border border-[#dcdfe4] bg-white px-2 py-1 text-sm text-[#44546f] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {/* 最初に表示するだけの項目（選べない） */}
        <option value="" disabled hidden>
          並べ替え…
        </option>
        {SORT_OPTIONS.map((option) => (
          <option key={option.key} value={option.key}>
            {option.text}
          </option>
        ))}
      </select>
      {/* 縦に並んだカードとして、並べ替えられるようにする */}
      <SortableContext items={list.cards.map((card) => cardDndId(card.id))} strategy={verticalListSortingStrategy}>
        <ul className="flex min-h-1 flex-col gap-2">
          {list.cards.map((card) => (
            <li key={card.id}>
              <CardItem
                card={card}
                label={card.labelId === null ? undefined : labelsById.get(card.labelId)}
                isDoneList={list.isDone}
                onOpen={() => onOpenCard(card.id)}
                isSelected={selectedCardIds.has(card.id)}
                onToggleSelect={() => onToggleCard(card.id)}
              />
            </li>
          ))}
        </ul>
      </SortableContext>
      <div className="mt-2">
        <AddItemForm
          buttonLabel="＋カードを追加"
          inputLabel="カードのタイトル"
          placeholder="タイトルを入力して Enter"
          maxLength={100}
          emptyError={EMPTY_TITLE_ERROR}
          onAdd={(title) => onAddCard(list.id, title)}
        />
      </div>

      {isConfirmingDelete && (
        // M-03：リストの削除の確認メッセージ（SC-03）
        <ConfirmDialog
          message={`リスト「${list.name}」を削除します。中のカード${list.cards.length}件も削除されます。よろしいですか？`}
          confirmLabel="削除"
          onConfirm={() => {
            setIsConfirmingDelete(false)
            onDeleteList(list.id)
          }}
          onCancel={cancelDelete}
        />
      )}
    </section>
  )
}

export default ListColumn
