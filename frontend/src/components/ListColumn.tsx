import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import type { Label, List } from '../types'
import AddItemForm from './AddItemForm'
import CardItem from './CardItem'
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
}

/**
 * リスト1つ。見出し（リスト名・完了用なら ✓）と、中のカードと、「＋カードを追加」を表示する。
 * 中のカードは、ドラッグ＆ドロップで並べ替えられる（SortableContext）。
 * リスト全体も、カードを置ける場所になる（カードのないリストや、カードの下の何もないところに置けるようにするため）。
 */
function ListColumn({ list, labelsById, onAddCard, onOpenCard }: ListColumnProps) {
  const data: DndData = { type: 'list', listId: list.id }
  const { setNodeRef } = useDroppable({ id: listDndId(list.id), data })

  return (
    <section ref={setNodeRef} className="w-68 shrink-0 rounded-lg bg-[#f1f2f4] p-2">
      <h2 className="flex items-center gap-1.5 px-1 pt-1 pb-2 font-bold">
        <span className="break-all">{list.name}</span>
        {list.isDone && (
          <span className="text-[#1f845a]" title="完了用リスト">
            ✓
          </span>
        )}
      </h2>
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
    </section>
  )
}

export default ListColumn
