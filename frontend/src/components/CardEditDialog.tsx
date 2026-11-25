import { Check, Trash2 } from 'lucide-react'
import { useCallback, useRef, useState, type KeyboardEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import type { CardUpdate } from '../api'
import type { Card, Label, Priority } from '../types'
import { isImeEscape } from '../utils/ime'
import { getPriority } from '../utils/priority'
import ConfirmDialog from './ConfirmDialog'
import DueDatePicker from './DueDatePicker'

// M-05：カードのタイトルが空のとき
const EMPTY_TITLE_ERROR = 'タイトルを入力してください。'

/** 優先度のボタンを並べる順番（高・中・低） */
const PRIORITY_OPTIONS: Priority[] = [1, 2, 3]

/** 選んでいるボタンの見た目（紫の枠） */
const SELECTED = 'ring-2 ring-primary ring-offset-1'

/** 欄の見出しの見た目 */
const FIELD_LABEL = 'mb-1.5 block text-xs font-medium text-sub'

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
 * タイトル・優先度・期限・ラベルを変えて「保存」する。「×」と Esc は保存せずに閉じる（背景を押しても閉じない）。
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

  const titleRef = useRef<HTMLInputElement>(null)

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
    <Dialog
      open
      // 書きかけの内容をまちがって消さないよう、背景を押しても閉じない
      disablePointerDismissal
      onOpenChange={(open, details) => {
        if (open) return
        // 日本語入力の変換中の Esc は、変換の取り消しなので無視する
        if (isImeEscape(details.event)) details.cancel()
        else onClose()
      }}
    >
      <DialogContent initialFocus={titleRef} className="gap-5 sm:max-w-md">
        <DialogHeader>
          <DialogTitle>カードの編集</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-5">
          {/* タイトル */}
          <div>
            <label htmlFor="card-edit-title-input" className={FIELD_LABEL}>
              タイトル（必須）
            </label>
            <Input
              id="card-edit-title-input"
              ref={titleRef}
              type="text"
              value={title}
              onChange={(event) => {
                setTitle(event.target.value)
                setError(null)
              }}
              onKeyDown={handleTitleKeyDown}
              maxLength={100}
              aria-invalid={error !== null}
              className="h-9"
            />
            {error && <p className="mt-1 px-1 text-xs text-danger-dark">{error}</p>}
          </div>

          {/* 優先度：選んでいるものは、その優先度の色にして紫の枠で囲む */}
          <fieldset>
            <legend className={FIELD_LABEL}>優先度</legend>
            <div className="grid grid-cols-3 gap-2.5">
              {PRIORITY_OPTIONS.map((value) => {
                const style = getPriority(value)
                const isSelected = priority === value
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setPriority(value)}
                    aria-pressed={isSelected}
                    className={`h-9 cursor-pointer rounded-lg border text-sm font-semibold outline-none focus-visible:ring-3 focus-visible:ring-ring/50 ${isSelected ? `${style.className} ${SELECTED}` : 'border-line bg-white text-sub hover:bg-soft'}`}
                  >
                    {style.text}
                  </button>
                )
              })}
            </div>
          </fieldset>

          {/* 期限：カレンダーから選ぶ。「クリア」でなしにできる */}
          <div>
            <p id="card-edit-due-date-label" className={FIELD_LABEL}>
              期限
            </p>
            <DueDatePicker labelId="card-edit-due-date-label" value={dueDate} onChange={setDueDate} />
          </div>

          {/* ラベル：「なし」と5色から1つ。色にマウスを乗せると名前を表示する */}
          <fieldset>
            <legend className={FIELD_LABEL}>ラベル</legend>
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setLabelId(null)}
                aria-pressed={labelId === null}
                className={`h-8 cursor-pointer rounded-full border border-input-line px-3 text-xs text-sub outline-none hover:bg-soft focus-visible:ring-3 focus-visible:ring-ring/50 ${labelId === null ? SELECTED : ''}`}
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
                  className={`flex size-8 cursor-pointer items-center justify-center rounded-full border border-sub/40 text-ink outline-none focus-visible:ring-3 focus-visible:ring-ring/50 ${labelId === label.id ? SELECTED : ''}`}
                  style={{ backgroundColor: label.colorCode }}
                >
                  {labelId === label.id && <Check className="size-4" aria-hidden="true" />}
                </button>
              ))}
            </div>
          </fieldset>
        </div>

        {/* 左に「削除」、右に「保存」（押し間違えないよう離して置く） */}
        <DialogFooter className="justify-between sm:justify-between">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setIsConfirmingDelete(true)}
            disabled={isSaving}
            className="text-danger-dark hover:bg-danger-soft hover:text-danger-dark"
          >
            <Trash2 aria-hidden="true" />
            削除
          </Button>
          <Button type="button" onClick={() => void save()} disabled={isSaving} className="px-5">
            {isSaving ? '保存中…' : '保存'}
          </Button>
        </DialogFooter>

        {isConfirmingDelete && (
          // M-01：削除の確認メッセージ（SC-03）
          <ConfirmDialog
            message={`カード「${card.title}」を削除します。よろしいですか？`}
            confirmLabel="削除"
            onConfirm={() => void remove()}
            onCancel={cancelDelete}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

export default CardEditDialog
