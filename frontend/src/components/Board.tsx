import type { Label, List } from '../types'
import ListColumn from './ListColumn'

type BoardProps = {
  lists: List[]
  /** ラベルの ID から、ラベルを引けるようにしたもの */
  labelsById: Map<number, Label>
}

/** ボード。リストを左から横に並べる（多いときは横にスクロールする）。 */
function Board({ lists, labelsById }: BoardProps) {
  return (
    <main className="flex min-h-[calc(100vh-3.5rem)] items-start gap-3 overflow-x-auto p-4">
      {lists.map((list) => (
        <ListColumn key={list.id} list={list} labelsById={labelsById} />
      ))}
    </main>
  )
}

export default Board
