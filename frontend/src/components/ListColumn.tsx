import { useDroppable } from '@dnd-kit/core'
import type { Label, List } from '../types'
import AddItemForm from './AddItemForm'
import CardItem from './CardItem'
import { type DndData, listDndId } from './dnd'

// M-05：カードのタイトルが空のとき
const EMPTY_TITLE_ERROR = 'タイトルを入力してください。'

/** 差し込む位置に出す青い線 */
const DROP_LINE = 'pointer-events-none absolute inset-x-0 h-0.5 rounded-full bg-[#0c66e4]'

type ListColumnProps = {
  list: List
  /** ラベルの ID から、ラベルを引けるようにしたもの */
  labelsById: Map<number, Label>
  /** ドラッグ中のカードの ID（ドラッグしていないときは null） */
  draggingCardId: number | null
  /** このリストに差し込む位置（動かすカード自身を除いて数える）。このリストに差し込まないときは null */
  dropIndex: number | null
  /** カードを追加する。追加できたら true を返す */
  onAddCard: (listId: number, title: string) => Promise<boolean>
  /** カードを押したとき（編集画面を開く） */
  onOpenCard: (cardId: number) => void
}

/**
 * リスト1つ。見出し（リスト名・完了用なら ✓）と、中のカードと、「＋カードを追加」を表示する。
 * リスト全体が、カードを置ける場所になる（カードの下の何もないところに置くと、一番下に入る）。
 */
function ListColumn({ list, labelsById, draggingCardId, dropIndex, onAddCard, onOpenCard }: ListColumnProps) {
  const data: DndData = { type: 'list', listId: list.id }
  const { setNodeRef } = useDroppable({ id: listDndId(list.id), data })

  // 線を出す位置は、動かすカード自身を除いた順番で決める
  const others = list.cards.filter((card) => card.id !== draggingCardId)
  const lastOtherId = others.at(-1)?.id

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
      <ul className="flex flex-col gap-2">
        {list.cards.map((card) => {
          const indexInOthers = others.indexOf(card)
          // このカードの「上」に線を出すか（ドラッグ中のカード自身には出さない）
          const lineAbove = indexInOthers !== -1 && dropIndex === indexInOthers
          // 一番下に差し込むときは、最後のカードの「下」に線を出す
          const lineBelow = card.id === lastOtherId && dropIndex === others.length
          return (
            <li key={card.id} className="relative">
              {lineAbove && <div className={`${DROP_LINE} -top-[5px]`} />}
              <CardItem
                card={card}
                label={card.labelId === null ? undefined : labelsById.get(card.labelId)}
                isDoneList={list.isDone}
                onOpen={() => onOpenCard(card.id)}
              />
              {lineBelow && <div className={`${DROP_LINE} -bottom-[5px]`} />}
            </li>
          )
        })}
        {/* ほかにカードがないリストに差し込むときは、線だけを出す */}
        {others.length === 0 && dropIndex === 0 && (
          <li className="relative h-0.5">
            <div className={DROP_LINE} />
          </li>
        )}
      </ul>
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
