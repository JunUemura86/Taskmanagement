import { CircleCheck } from 'lucide-react'
import type { List } from '../types'

type ListBadgesProps = {
  list: List
}

/** リスト名の右に出す、完了用リストの印（✓）とカードの枚数。ドラッグ中にマウスについてくるリストでも使う。 */
function ListBadges({ list }: ListBadgesProps) {
  return (
    <>
      {list.isDone && (
        <span className="shrink-0 text-done" title="完了用リスト">
          <CircleCheck className="size-4" aria-hidden="true" />
          <span className="sr-only">完了用リスト</span>
        </span>
      )}
      <span
        className="shrink-0 rounded-full bg-white px-2 text-xs leading-5 font-medium text-sub tabular-nums"
        title={`カード${list.cards.length}枚`}
      >
        {list.cards.length}
      </span>
    </>
  )
}

export default ListBadges
