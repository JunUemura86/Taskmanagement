import { useCallback, useEffect, useState } from 'react'
import {
  ApiError,
  type CardUpdate,
  createCard,
  createList,
  deleteCard,
  deleteCards,
  deleteList,
  fetchBoard,
  fetchLabels,
  moveCard,
  renameList,
  updateCard,
} from './api'
import Board from './components/Board'
import CardEditDialog from './components/CardEditDialog'
import ConfirmDialog from './components/ConfirmDialog'
import ErrorBanner from './components/ErrorBanner'
import Header from './components/Header'
import type { Label, List } from './types'
import { moveCardInLists } from './utils/moveCard'
import { removeCards, selectedCardIdsOnBoard, toggleCard, toggleList } from './utils/selection'

// M-06：リストが10個あるのに追加しようとしたとき
const LIST_LIMIT_ERROR = 'リストは最大10個まで作成できます。'
// M-07：100枚あるリストにカードを追加・移動しようとしたとき
const CARD_LIMIT_ERROR = '1つのリストに入れられるカードは最大100枚です。'
// 1つのリストに入れられるカードの上限（機能要件 2.2）
const MAX_CARDS_PER_LIST = 100

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
  // 編集画面で開いているカードの ID（開いていないときは null）
  const [editingCardId, setEditingCardId] = useState<number | null>(null)
  // チェックボックスで選んだカードの ID（F-12）
  const [selectedCardIds, setSelectedCardIds] = useState<ReadonlySet<number>>(new Set())
  // まとめて削除の確認メッセージ（M-02）を出しているときは true
  const [isConfirmingBulkDelete, setIsConfirmingBulkDelete] = useState(false)

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

  /** カードを変更する（A-06）。成功したら、ボードのそのカードを入れ替えて編集画面を閉じ、true を返す。 */
  async function handleUpdateCard(cardId: number, update: CardUpdate): Promise<boolean> {
    try {
      const updated = await updateCard(cardId, update)
      setLists((current) =>
        current.map((list) => ({
          ...list,
          cards: list.cards.map((card) => (card.id === cardId ? updated : card)),
        })),
      )
      setNotice(null)
      setEditingCardId(null)
      return true
    } catch (error: unknown) {
      console.error(error)
      setNotice(CONNECTION_ERROR)
      return false
    }
  }

  /**
   * カードを、listId のリストの index 番目（動かすカード自身を除いて数える）に動かす（A-08）。
   * 先に画面を並べ替えてから保存する。保存できなかったら、元の並びに戻す。
   */
  async function handleMoveCard(cardId: number, listId: number, index: number) {
    const before = lists
    const fromList = before.find((list) => list.cards.some((card) => card.id === cardId))
    const toList = before.find((list) => list.id === listId)
    if (!fromList || !toList) return

    // 別のリストに動かすとき、そこにもう100枚あるなら、動かさない
    if (fromList.id !== toList.id && toList.cards.length >= MAX_CARDS_PER_LIST) {
      setNotice(CARD_LIMIT_ERROR)
      return
    }

    setLists(moveCardInLists(before, cardId, listId, index))
    try {
      await moveCard(cardId, listId, index)
      setNotice(null)
    } catch (error: unknown) {
      console.error(error)
      setLists(before)
      setNotice(error instanceof ApiError && error.status === 409 ? CARD_LIMIT_ERROR : CONNECTION_ERROR)
    }
  }

  /** カードを削除する（A-07）。成功したら、ボードからそのカードを消して編集画面を閉じ、true を返す。 */
  async function handleDeleteCard(cardId: number): Promise<boolean> {
    try {
      await deleteCard(cardId)
    } catch (error: unknown) {
      // 404（もう消えている）のときは、画面からも消せばよいので、失敗として扱わない
      if (!(error instanceof ApiError && error.status === 404)) {
        console.error(error)
        setNotice(CONNECTION_ERROR)
        return false
      }
    }
    setLists((current) =>
      current.map((list) => ({ ...list, cards: list.cards.filter((card) => card.id !== cardId) })),
    )
    setNotice(null)
    setEditingCardId(null)
    return true
  }

  // 編集画面を、保存せずに閉じる（編集画面の Esc の設定が毎回作り直されないよう、同じ関数を使い続ける）
  const closeEditor = useCallback(() => setEditingCardId(null), [])

  // 開いているカードを、ボードの中から探す
  const editingCard =
    editingCardId === null ? undefined : lists.flatMap((list) => list.cards).find((card) => card.id === editingCardId)

  /**
   * リスト名を変更する（A-09）。先に画面の名前を変えてから保存する。
   * 保存できなかったら、元の名前に戻して M-08 を表示する。
   */
  async function handleRenameList(listId: number, name: string) {
    const oldName = lists.find((list) => list.id === listId)?.name
    if (oldName === undefined) return
    const setName = (newName: string) =>
      setLists((current) => current.map((list) => (list.id === listId ? { ...list, name: newName } : list)))

    setName(name)
    try {
      const renamed = await renameList(listId, name)
      // サーバーが保存した名前（前後の空白を取り除いたもの）にそろえる
      setName(renamed.name)
      setNotice(null)
    } catch (error: unknown) {
      console.error(error)
      setName(oldName)
      setNotice(CONNECTION_ERROR)
    }
  }

  /** リストと中のカードを削除する（A-10）。成功したら、ボードからそのリストを消す。 */
  async function handleDeleteList(listId: number) {
    try {
      await deleteList(listId)
    } catch (error: unknown) {
      // 404（もう消えている）のときは、画面からも消せばよいので、失敗として扱わない
      if (!(error instanceof ApiError && error.status === 404)) {
        console.error(error)
        setNotice(CONNECTION_ERROR)
        return
      }
    }
    setLists((current) => current.filter((list) => list.id !== listId))
    setNotice(null)
  }

  // 選んだカードのうち、今ボードにあるもの（削除などで消えたカードは数えない）
  const selectedIdsOnBoard = selectedCardIdsOnBoard(lists, selectedCardIds)

  /**
   * 選んだカードをまとめて削除する（A-11）。成功したら、ボードから消して選択を空にする。
   * 失敗したときは、選択はそのまま残して M-08 を表示する。
   */
  async function handleDeleteSelected() {
    setIsConfirmingBulkDelete(false)
    const ids = selectedIdsOnBoard
    try {
      await deleteCards(ids)
      setLists((current) => removeCards(current, new Set(ids)))
      setSelectedCardIds(new Set())
      setNotice(null)
    } catch (error: unknown) {
      console.error(error)
      setNotice(CONNECTION_ERROR)
    }
  }

  // まとめて削除の確認メッセージを、削除せずに閉じる（チェックは残す。UC-10）
  const cancelBulkDelete = useCallback(() => setIsConfirmingBulkDelete(false), [])

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
      <Header selectedCount={selectedIdsOnBoard.length} onDeleteSelected={() => setIsConfirmingBulkDelete(true)} />
      {status === 'error' && <ErrorBanner message={CONNECTION_ERROR} />}
      {status === 'ready' && notice && (
        // 編集画面のうしろの暗い幕より手前に出す
        <div className="relative z-20">
          <ErrorBanner message={notice} />
        </div>
      )}
      {status === 'loading' && <p className="p-4 text-sm text-[#626f86]">読み込み中…</p>}
      {status === 'ready' && (
        <Board
          lists={lists}
          labelsById={labelsById}
          onAddCard={handleAddCard}
          onAddList={handleAddList}
          onOpenCard={setEditingCardId}
          onMoveCard={(cardId, listId, index) => void handleMoveCard(cardId, listId, index)}
          onRenameList={(listId, name) => void handleRenameList(listId, name)}
          onDeleteList={(listId) => void handleDeleteList(listId)}
          selectedCardIds={selectedCardIds}
          onToggleCard={(cardId) => setSelectedCardIds((current) => toggleCard(current, cardId))}
          onToggleList={(listId) => {
            const list = lists.find((l) => l.id === listId)
            if (list) setSelectedCardIds((current) => toggleList(current, list))
          }}
        />
      )}
      {editingCard && (
        <CardEditDialog
          // カードが変わったら、入力中の値を作り直す
          key={editingCard.id}
          card={editingCard}
          labels={[...labelsById.values()]}
          onSave={(update) => handleUpdateCard(editingCard.id, update)}
          onDelete={() => handleDeleteCard(editingCard.id)}
          onClose={closeEditor}
        />
      )}
      {isConfirmingBulkDelete && (
        // M-02：選んだカードをまとめて削除するときの確認メッセージ（SC-03）
        <ConfirmDialog
          message={`選択した${selectedIdsOnBoard.length}件のカードを削除します。よろしいですか？`}
          confirmLabel="削除"
          onConfirm={() => void handleDeleteSelected()}
          onCancel={cancelBulkDelete}
        />
      )}
    </div>
  )
}

export default App
