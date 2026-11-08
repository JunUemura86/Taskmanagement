import ListColumn from './ListColumn'

/** ボード。リストを左から横に並べる（多いときは横にスクロールする）。 */
function Board({ lists, labelsById }) {
  return (
    <main className="flex min-h-[calc(100vh-3.5rem)] items-start gap-3 overflow-x-auto p-4">
      {lists.map((list) => (
        <ListColumn key={list.id} list={list} labelsById={labelsById} />
      ))}
    </main>
  )
}

export default Board
