import { useRef, useState, type KeyboardEvent } from 'react'

type ListNameEditorProps = {
  /** 今のリスト名 */
  name: string
  /** 新しいリスト名を保存する（前後の空白を取り除いたもの。変わったときだけ呼ばれる） */
  onRename: (name: string) => void
}

/**
 * リストの見出しのリスト名。クリックすると入力欄になり、名前を変えられる（UC-08）。
 * Enter か、入力欄から離れると保存する。Esc でやめる。
 * 空のまま確定したとき・Esc のときは、元の名前に戻す（メッセージは出さない）。
 */
function ListNameEditor({ name, onRename }: ListNameEditorProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [text, setText] = useState(name)
  // Enter で確定したあとに、入力欄から離れた扱いでもう一度確定しないようにするための印
  const isFinishedRef = useRef(false)

  function startEditing() {
    setText(name)
    isFinishedRef.current = false
    setIsEditing(true)
  }

  /** 入力した名前で確定する。空・変わっていないときは、保存せずに元の名前に戻す */
  function commit() {
    if (isFinishedRef.current) return
    isFinishedRef.current = true
    setIsEditing(false)
    // 前後の空白を取り除く（空白だけの入力は「空」として扱う）
    const trimmed = text.trim()
    if (trimmed !== '' && trimmed !== name) onRename(trimmed)
  }

  /** 保存せずにやめる */
  function cancel() {
    isFinishedRef.current = true
    setIsEditing(false)
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    // 日本語入力（IME）で変換を確定・取り消すためのキーは無視する
    if (event.nativeEvent.isComposing || event.keyCode === 229) return
    if (event.key === 'Enter') {
      event.preventDefault()
      commit()
    } else if (event.key === 'Escape') {
      cancel()
    }
  }

  if (!isEditing) {
    return (
      <button
        type="button"
        onClick={startEditing}
        title="クリックしてリスト名を変更"
        className="min-w-0 flex-1 cursor-text rounded px-1 text-left break-all hover:bg-[#dcdfe4]"
      >
        {name}
      </button>
    )
  }

  return (
    <input
      type="text"
      value={text}
      onChange={(event) => setText(event.target.value)}
      onKeyDown={handleKeyDown}
      onBlur={commit}
      // 開いたときに、名前を全部選んだ状態にする（すぐに打ち直せるように）
      onFocus={(event) => event.target.select()}
      maxLength={30}
      aria-label="リスト名"
      autoFocus
      className="min-w-0 flex-1 rounded border border-[#0c66e4] bg-white px-1 font-bold outline-none"
    />
  )
}

export default ListNameEditor
