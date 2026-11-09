import { useState, type KeyboardEvent } from 'react'

type AddItemFormProps = {
  /** 閉じているときのボタンの文字（例：「＋カードを追加」） */
  buttonLabel: string
  /** 入力欄の説明（読み上げ用。例：「カードのタイトル」） */
  inputLabel: string
  /** 入力欄に薄く出す案内 */
  placeholder: string
  /** 入力できる文字数の上限 */
  maxLength: number
  /** 空のまま Enter を押したときのメッセージ（例：M-05） */
  emptyError: string
  /** 追加する。追加できたら true、できなかったら false を返す */
  onAdd: (text: string) => Promise<boolean>
}

/**
 * 「＋〇〇を追加」のボタン。押すと入力欄になり、Enter で追加・Esc でやめる。
 * カードの追加（リストの一番下）とリストの追加（ボードの一番右）で使う。
 */
function AddItemForm({ buttonLabel, inputLabel, placeholder, maxLength, emptyError, onAdd }: AddItemFormProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [text, setText] = useState('')
  const [error, setError] = useState<string | null>(null)
  // 送っている間は、Enter を連打しても二重に追加しないようにする
  const [isSending, setIsSending] = useState(false)

  function close() {
    setIsOpen(false)
    setText('')
    setError(null)
  }

  async function submit() {
    // 前後の空白を取り除く（空白だけの入力は「空」として扱う）
    const trimmed = text.trim()
    if (trimmed === '') {
      setError(emptyError)
      return
    }
    setIsSending(true)
    const added = await onAdd(trimmed)
    setIsSending(false)
    if (added) {
      // 続けて入力できるように、入力欄は開いたままにして中身だけ空にする
      setText('')
      setError(null)
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    // 日本語入力（IME）で変換を確定するための Enter は無視する
    if (event.nativeEvent.isComposing || event.keyCode === 229) return

    if (event.key === 'Enter') {
      event.preventDefault()
      if (!isSending) void submit()
    } else if (event.key === 'Escape') {
      close()
    }
  }

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="w-full rounded-md px-2 py-1.5 text-left text-sm text-[#44546f] hover:bg-[#dcdfe4]"
      >
        {buttonLabel}
      </button>
    )
  }

  return (
    <div>
      <input
        type="text"
        value={text}
        onChange={(event) => {
          setText(event.target.value)
          setError(null)
        }}
        onKeyDown={handleKeyDown}
        onBlur={() => {
          // 何も入力せずに入力欄から離れたら閉じる
          if (text.trim() === '') close()
        }}
        maxLength={maxLength}
        placeholder={placeholder}
        aria-label={inputLabel}
        aria-invalid={error !== null}
        // disabled にすると入力欄から離れてしまうので、readOnly で書き換えだけを止める
        readOnly={isSending}
        autoFocus
        className="w-full rounded-md border border-[#0c66e4] bg-white px-2 py-1.5 text-sm outline-none"
      />
      {error && <p className="mt-1 px-1 text-xs text-[#ae2e24]">{error}</p>}
    </div>
  )
}

export default AddItemForm
