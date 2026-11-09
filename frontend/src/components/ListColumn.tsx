import type { Label, List } from '../types'
import AddCardForm from './AddCardForm'
import CardItem from './CardItem'

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
      <AddCardForm onAdd={(title) => onAddCard(list.id, title)} />
    </section>
  )
}

export default ListColumn
