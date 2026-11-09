import { useEffect, useState } from 'react'
import { ApiError, createCard, createList, fetchBoard, fetchLabels } from './api'
import Board from './components/Board'
import ErrorBanner from './components/ErrorBanner'
import Header from './components/Header'
import type { Label, List } from './types'

// M-06：リストが10個あるのに追加しようとしたとき
const LIST_LIMIT_ERROR = 'リストは最大10個まで作成できます。'
// M-07：100枚あるリストにカードを追加しようとしたとき
const CARD_LIMIT_ERROR = '1つのリストに入れられるカードは最大100枚です。'
// M-08：サーバーや DB につながらないとき
const CONNECTION_ERROR = 'サーバーに接続できませんでした。サーバーが起動しているか確認してください。'

/** 'loading'（読み込み中）・'error'（つながらない）・'ready'（表示できる）のどれか */
type Status = 'loading' | 'error' | 'ready'

function App() {
  const [status, setStatus] = useState<Status>('loading')
  const [lists, setLists] = useState<List[]>([])
  const [labelsById, setLabelsById] = useState<Map<number, Label>>(new Map())
  // 操作に失敗したときに、画面上部のお知らせ欄に出すメッセージ（ないときは null）
  const [notice, setNotice] = useState<string | null>(null)

  useEffect(() => {
    // 画面が閉じられたあとに結果が届いても、使わないようにするための印
    let ignore = false

    // ボードとラベルを同時に取ってくる
    Promise.all([fetchBoard(), fetchLabels()])
      .then(([board, labels]) => {
        if (ignore) return
        setLists(board)
        setLabelsById(new Map(labels.map((label) => [label.id, label])))
        setStatus('ready')
      })
      .catch((error: unknown) => {
        if (ignore) return
        console.error(error)
        setStatus('error')
      })

    return () => {
      ignore = true
    }
  }, [])

  /** リストを追加する（A-05）。成功したら、ボードの一番右に足して true を返す。 */
  async function handleAddList(name: string): Promise<boolean> {
    try {
      const list = await createList(name)
      setLists((current) => [...current, list])
      setNotice(null)
      return true
    } catch (error: unknown) {
      console.error(error)
      setNotice(error instanceof ApiError && error.status === 409 ? LIST_LIMIT_ERROR : CONNECTION_ERROR)
      return false
    }
  }

  /** カードを追加する（A-04）。成功したら、そのリストの一番下に足して true を返す。 */
  async function handleAddCard(listId: number, title: string): Promise<boolean> {
    try {
      const card = await createCard(listId, title)
      setLists((current) =>
        current.map((list) => (list.id === listId ? { ...list, cards: [...list.cards, card] } : list)),
      )
      setNotice(null)
      return true
    } catch (error: unknown) {
      console.error(error)
      setNotice(error instanceof ApiError && error.status === 409 ? CARD_LIMIT_ERROR : CONNECTION_ERROR)
      return false
    }
  }

  return (
    <div className="min-h-screen bg-[#e8eef5] text-[#172b4d]">
      <Header />
      {status === 'error' && <ErrorBanner message={CONNECTION_ERROR} />}
      {status === 'ready' && notice && <ErrorBanner message={notice} />}
      {status === 'loading' && <p className="p-4 text-sm text-[#626f86]">読み込み中…</p>}
      {status === 'ready' && (
        <Board lists={lists} labelsById={labelsById} onAddCard={handleAddCard} onAddList={handleAddList} />
      )}
    </div>
  )
}

export default App
