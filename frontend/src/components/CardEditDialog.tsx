import { useCallback, useEffect, useState, type KeyboardEvent } from 'react'
import type { CardUpdate } from '../api'
import type { Card, Label, Priority } from '../types'
import { getPriority } from '../utils/priority'
import ConfirmDialog from './ConfirmDialog'

// M-05：カードのタイトルが空のとき
const EMPTY_TITLE_ERROR = 'タイトルを入力してください。'

/** 優先度のボタンを並べる順番（高・中・低） */
const PRIORITY_OPTIONS: Priority[] = [1, 2, 3]

/** 選んでいるボタンの見た目（青い枠） */
const SELECTED = 'ring-2 ring-[#0c66e4] ring-offset-1'

type CardEditDialogProps = {
  card: Card
  /** ラベルの一覧（並び順どおり） */
  labels: Label[]
  /** 変更を保存する。保存できたら true、できなかったら false を返す */
  onSave: (update: CardUpdate) => Promise<boolean>
  /** カードを削除する。削除できたら true、できなかったら false を返す */
  onDelete: () => Promise<boolean>
  /** 保存せずに閉じる */
  onClose: () => void
}

/**
 * カード編集画面（SC-02）。メイン画面の上に重ねて表示する。
 * タイトル・優先度・期限・ラベルを変えて「保存」する。「×」と Esc は保存せずに閉じる。
 * 「削除」は、確認メッセージ（M-01）で「OK」を押したときだけ削除する。
 */
function CardEditDialog({ card, labels, onSave, onDelete, onClose }: CardEditDialogProps) {
  // 入力中の値は、この画面の中だけで持つ（「保存」が成功したときだけボードを変える）
  const [title, setTitle] = useState(card.title)
  const [priority, setPriority] = useState<Priority>(card.priority)
  // 期限の入力欄は、なしのとき空の文字（''）にする
  const [dueDate, setDueDate] = useState(card.dueDate ?? '')
  const [labelId, setLabelId] = useState<number | null>(card.labelId)
  const [error, setError] = useState<string | null>(null)
  // 保存している間は、ボタンを押せなくする（二重に保存しないため）
  const [isSaving, setIsSaving] = useState(false)
  // 削除の確認メッセージ（M-01）を出しているときは true
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false)
  // 確認メッセージの Esc の設定が毎回作り直されないよう、同じ関数を使い続ける
  const cancelDelete = useCallback(() => setIsConfirmingDelete(false), [])

  // Esc キーで閉じる（日本語入力の変換中の Esc は、変換の取り消しなので無視する）
  useEffect(() => {
    function handleKeyDown(event: globalThis.KeyboardEvent) {
      if (event.isComposing || event.keyCode === 229) return
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  async function save() {
    // 前後の空白を取り除く（空白だけの入力は「空」として扱う）
    const trimmed = title.trim()
    if (trimmed === '') {
      setError(EMPTY_TITLE_ERROR)
      return
    }
    setIsSaving(true)
    const saved = await onSave({ title: trimmed, priority, dueDate: dueDate === '' ? null : dueDate, labelId })
    // 保存できたときは、この画面が閉じるので何もしない
    if (!saved) setIsSaving(false)
  }

  /** 確認メッセージで「削除」を押したとき */
  async function remove() {
    setIsConfirmingDelete(false)
    setIsSaving(true)
    const deleted = await onDelete()
    // 削除できたときは、この画面が閉じるので何もしない
    if (!deleted) setIsSaving(false)
  }

  function handleTitleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    // 日本語入力（IME）で変換を確定するための Enter は無視する
    if (event.nativeEvent.isComposing || event.keyCode === 229) return
    if (event.key === 'Enter') {
      event.preventDefault()
      if (!isSaving) void save()
    }
  }

  return (
    // うしろを暗くして、真ん中に表示する
    <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/40 p-4">
      <div
        // HTML 標準の <dialog> にするかは、アクセシビリティの見直し（品質チェックの提案 C6）で決める
        // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role
        role="dialog"
        aria-modal="true"
        aria-labelledby="card-edit-title"
        className="w-full max-w-sm rounded-lg bg-white shadow-xl"
      >
        <div className="flex items-center justify-between border-b border-[#dcdfe4] px-4 py-3">
          <h2 id="card-edit-title" className="font-bold">
            カードの編集
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="閉じる"
            className="rounded px-2 text-xl leading-none text-[#626f86] hover:bg-[#f1f2f4]"
          >
            ×
          </button>
        </div>

        <div className="flex flex-col gap-4 px-4 py-4 text-sm">
          {/* タイトル */}
          <div>
            <label htmlFor="card-edit-title-input" className="mb-1 block font-bold text-[#44546f]">
              タイトル（必須）
            </label>
            <input
              id="card-edit-title-input"
              type="text"
              value={title}
              onChange={(event) => {
                setTitle(event.target.value)
                setError(null)
              }}
              onKeyDown={handleTitleKeyDown}
              maxLength={100}
              aria-invalid={error !== null}
              autoFocus
              className="w-full rounded-md border border-[#8590a2] px-2 py-1.5 outline-none focus:border-[#0c66e4]"
            />
            {error && <p className="mt-1 px-1 text-xs text-[#ae2e24]">{error}</p>}
          </div>

          {/* 優先度：選んでいるものは青い枠、ほかは薄く表示する */}
          <fieldset>
            <legend className="mb-1 font-bold text-[#44546f]">優先度</legend>
            <div className="flex gap-2">
              {PRIORITY_OPTIONS.map((value) => {
                const style = getPriority(value)
                const isSelected = priority === value
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setPriority(value)}
                    aria-pressed={isSelected}
                    className={`rounded-full border px-3 py-0.5 font-bold ${style.className} ${isSelected ? SELECTED : 'opacity-40 hover:opacity-70'}`}
                  >
                    {style.text}
                  </button>
                )
              })}
            </div>
          </fieldset>

          {/* 期限：カレンダーから選ぶ。「クリア」でなしにできる */}
          <div>
            <label htmlFor="card-edit-due-date" className="mb-1 block font-bold text-[#44546f]">
              期限
            </label>
            <div className="flex gap-2">
              <input
                id="card-edit-due-date"
                type="date"
                value={dueDate}
                onChange={(event) => setDueDate(event.target.value)}
                className="rounded-md border border-[#8590a2] px-2 py-1 outline-none focus:border-[#0c66e4]"
              />
              <button
                type="button"
                onClick={() => setDueDate('')}
                disabled={dueDate === ''}
                className="rounded-md bg-[#f1f2f4] px-3 text-[#44546f] hover:bg-[#dcdfe4] disabled:opacity-40"
              >
                クリア
              </button>
            </div>
          </div>

          {/* ラベル：「なし」と5色から1つ。色にマウスを乗せると名前を表示する */}
          <fieldset>
            <legend className="mb-1 font-bold text-[#44546f]">ラベル</legend>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setLabelId(null)}
                aria-pressed={labelId === null}
                className={`rounded-full border border-[#8590a2] px-2.5 py-0.5 text-[#44546f] ${labelId === null ? SELECTED : ''}`}
              >
                なし
              </button>
              {labels.map((label) => (
                <button
                  key={label.id}
                  type="button"
                  onClick={() => setLabelId(label.id)}
                  aria-pressed={labelId === label.id}
                  aria-label={`ラベル：${label.name}`}
                  title={label.name}
                  className={`h-7 w-7 rounded-full ${labelId === label.id ? SELECTED : ''}`}
                  style={{ backgroundColor: label.colorCode }}
                />
              ))}
            </div>
          </fieldset>
        </div>

        {/* 左に「削除」、右に「保存」（押し間違えないよう離して置く） */}
        <div className="flex justify-between border-t border-[#dcdfe4] px-4 py-3">
          <button
            type="button"
            onClick={() => setIsConfirmingDelete(true)}
            disabled={isSaving}
            className="rounded-md px-3 py-1.5 text-sm font-bold text-[#ae2e24] hover:bg-[#ffeceb] disabled:opacity-50"
          >
            削除
          </button>
          <button
            type="button"
            onClick={() => void save()}
            disabled={isSaving}
            className="rounded-md bg-[#0c66e4] px-4 py-1.5 text-sm font-bold text-white hover:bg-[#0055cc] disabled:opacity-50"
          >
            {isSaving ? '保存中…' : '保存'}
          </button>
        </div>
      </div>

      {isConfirmingDelete && (
        // M-01：削除の確認メッセージ（SC-03）
        <ConfirmDialog
          message={`カード「${card.title}」を削除します。よろしいですか？`}
          confirmLabel="削除"
          onConfirm={() => void remove()}
          onCancel={cancelDelete}
        />
      )}
    </div>
  )
}

export default CardEditDialog
