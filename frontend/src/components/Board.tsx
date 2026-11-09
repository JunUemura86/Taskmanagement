import type { Label, List } from '../types'
import AddItemForm from './AddItemForm'
import ListColumn from './ListColumn'

// M-04：リスト名が空のとき
const EMPTY_NAME_ERROR = 'リスト名を入力してください。'

type BoardProps = {
  lists: List[]
  /** ラベルの ID から、ラベルを引けるようにしたもの */
  labelsById: Map<number, Label>
  /** カードを追加する。追加できたら true を返す */
  onAddCard: (listId: number, title: string) => Promise<boolean>
  /** リストを追加する。追加できたら true を返す */
  onAddList: (name: string) => Promise<boolean>
}

/** ボード。リストを左から横に並べ、一番右に「＋リストを追加」を置く（多いときは横にスクロールする）。 */
function Board({ lists, labelsById, onAddCard, onAddList }: BoardProps) {
  return (
    <main className="flex min-h-[calc(100vh-3.5rem)] items-start gap-3 overflow-x-auto p-4">
      {lists.map((list) => (
        <ListColumn key={list.id} list={list} labelsById={labelsById} onAddCard={onAddCard} />
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
  )
}

export default Board
