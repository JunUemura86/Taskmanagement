import type { Label, List } from '../types'
import AddItemForm from './AddItemForm'
import CardItem from './CardItem'

// M-05：カードのタイトルが空のとき
const EMPTY_TITLE_ERROR = 'タイトルを入力してください。'

type ListColumnProps = {
  list: List
  /** ラベルの ID から、ラベルを引けるようにしたもの */
  labelsById: Map<number, Label>
  /** カードを追加する。追加できたら true を返す */
  onAddCard: (listId: number, title: string) => Promise<boolean>
}

/** リスト1つ。見出し（リスト名・完了用なら ✓）と、中のカードと、「＋カードを追加」を表示する。 */
function ListColumn({ list, labelsById, onAddCard }: ListColumnProps) {
  return (
    <section className="w-68 shrink-0 rounded-lg bg-[#f1f2f4] p-2">
      <h2 className="flex items-center gap-1.5 px-1 pt-1 pb-2 font-bold">
        <span className="break-all">{list.name}</span>
        {list.isDone && (
          <span className="text-[#1f845a]" title="完了用リスト">
            ✓
          </span>
        )}
      </h2>
      <ul className="flex flex-col gap-2">
        {list.cards.map((card) => (
          <li key={card.id}>
            <CardItem
              card={card}
              label={card.labelId === null ? undefined : labelsById.get(card.labelId)}
              isDoneList={list.isDone}
            />
          </li>
        ))}
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
