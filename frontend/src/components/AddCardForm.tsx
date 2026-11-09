import { useState, type KeyboardEvent } from 'react'

// M-05：カードのタイトルが空のとき
const EMPTY_TITLE_ERROR = 'タイトルを入力してください。'

type AddCardFormProps = {
  /** カードを追加する。追加できたら true、できなかったら false を返す */
  onAdd: (title: string) => Promise<boolean>
}

/** リストの一番下の「＋カードを追加」。押すと入力欄になり、Enter で追加・Esc でやめる。 */
function AddCardForm({ onAdd }: AddCardFormProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [error, setError] = useState<string | null>(null)
  // 送っている間は、Enter を連打しても二重に追加しないようにする
  const [isSending, setIsSending] = useState(false)

  function close() {
    setIsOpen(false)
    setTitle('')
    setError(null)
  }

  async function submit() {
    // 前後の空白を取り除く（空白だけの入力は「空」として扱う）
    const trimmed = title.trim()
    if (trimmed === '') {
      setError(EMPTY_TITLE_ERROR)
      return
    }
    setIsSending(true)
    const added = await onAdd(trimmed)
    setIsSending(false)
    if (added) {
      // 続けて入力できるように、入力欄は開いたままにして中身だけ空にする
      setTitle('')
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
        className="mt-2 w-full rounded-md px-2 py-1.5 text-left text-sm text-[#44546f] hover:bg-[#dcdfe4]"
      >
        ＋カードを追加
      </button>
    )
  }

  return (
    <div className="mt-2">
      <input
        type="text"
        value={title}
        onChange={(event) => {
          setTitle(event.target.value)
          setError(null)
        }}
        onKeyDown={handleKeyDown}
        onBlur={() => {
          // 何も入力せずに入力欄から離れたら閉じる
          if (title.trim() === '') close()
        }}
        maxLength={100}
        placeholder="タイトルを入力して Enter"
        aria-label="カードのタイトル"
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

export default AddCardForm
