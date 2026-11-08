import { useEffect, useState } from 'react'
import { fetchBoard, fetchLabels } from './api'
import Board from './components/Board'
import ErrorBanner from './components/ErrorBanner'
import Header from './components/Header'

// M-08：サーバーや DB につながらないとき
const CONNECTION_ERROR = 'サーバーに接続できませんでした。サーバーが起動しているか確認してください。'

function App() {
  // 'loading'（読み込み中）・'error'（つながらない）・'ready'（表示できる）のどれか
  const [status, setStatus] = useState('loading')
  const [lists, setLists] = useState([])
  const [labelsById, setLabelsById] = useState(new Map())

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
      .catch((error) => {
        if (ignore) return
        console.error(error)
        setStatus('error')
      })

    return () => {
      ignore = true
    }
  }, [])

  return (
    <div className="min-h-screen bg-[#e8eef5] text-[#172b4d]">
      <Header />
      {status === 'error' && <ErrorBanner message={CONNECTION_ERROR} />}
      {status === 'loading' && <p className="p-4 text-sm text-[#626f86]">読み込み中…</p>}
      {status === 'ready' && <Board lists={lists} labelsById={labelsById} />}
    </div>
  )
}

export default App
