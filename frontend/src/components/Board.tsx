import type { Label, List } from '../types'
import ListColumn from './ListColumn'

type BoardProps = {
  lists: List[]
  /** ラベルの ID から、ラベルを引けるようにしたもの */
  labelsById: Map<number, Label>
  /** カードを追加する。追加できたら true を返す */
  onAddCard: (listId: number, title: string) => Promise<boolean>
}

/** ボード。リストを左から横に並べる（多いときは横にスクロールする）。 */
function Board({ lists, labelsById, onAddCard }: BoardProps) {
  return (
    <main className="flex min-h-[calc(100vh-3.5rem)] items-start gap-3 overflow-x-auto p-4">
      {lists.map((list) => (
        <ListColumn key={list.id} list={list} labelsById={labelsById} onAddCard={onAddCard} />
      ))}
    </main>
  )
}

export default Board
