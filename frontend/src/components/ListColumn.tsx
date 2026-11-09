import { useDroppable } from '@dnd-kit/core'
import type { Label, List } from '../types'
import AddItemForm from './AddItemForm'
import CardItem from './CardItem'
import { type DndData, listDndId } from './dnd'

// M-05：カードのタイトルが空のとき
const EMPTY_TITLE_ERROR = 'タイトルを入力してください。'

/**
 * 差し込む位置に出す青い線。見つけやすいよう、太さ 4px にして、左の端に丸を付ける。
 * カードのすき間（8px）の真ん中に来るよう、position で上下の位置を指定する。
 */
function DropLine({ position }: { position: string }) {
  return (
    <div aria-hidden="true" className={`pointer-events-none absolute inset-x-0 z-10 flex items-center ${position}`}>
      <div className="h-3 w-3 shrink-0 rounded-full border-[3px] border-[#0c66e4] bg-white" />
      <div className="h-1 flex-1 rounded-full bg-[#0c66e4] shadow-[0_0_0_1px_rgba(255,255,255,0.8)]" />
    </div>
  )
}

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
    <section ref={setNodeRef} data-list-id={list.id} className="w-68 shrink-0 rounded-lg bg-[#f1f2f4] p-2">
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
            // data-card-id：Board が、差し込む位置を決めるときにカードの位置を調べるための目印
            <li key={card.id} data-card-id={card.id} className="relative">
              {lineAbove && <DropLine position="-top-[10px]" />}
              <CardItem
                card={card}
                label={card.labelId === null ? undefined : labelsById.get(card.labelId)}
                isDoneList={list.isDone}
                onOpen={() => onOpenCard(card.id)}
              />
              {lineBelow && <DropLine position="-bottom-[10px]" />}
            </li>
          )
        })}
        {/* ほかにカードがないリストに差し込むときは、線だけを出す */}
        {others.length === 0 && dropIndex === 0 && (
          <li className="relative h-3">
            <DropLine position="inset-y-0" />
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
