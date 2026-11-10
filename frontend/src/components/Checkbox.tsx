import { useEffect, useRef, type SyntheticEvent } from 'react'

type CheckboxProps = {
  checked: boolean
  /** 一部だけ選んでいるとき（「すべて選択」で使う）。「－」の表示になる */
  indeterminate?: boolean
  disabled?: boolean
  /** 読み上げ用の説明 */
  label: string
  /** 押したとき。ないときは、見せるだけ（ドラッグ中にマウスについてくるカードなど） */
  onToggle?: () => void
}

/** 押した操作を、外側（カード）に伝えない。カードの編集画面が開いたり、ドラッグが始まったりしないようにする */
function stop(event: SyntheticEvent) {
  event.stopPropagation()
}

/**
 * カードやリストの見出しに置くチェックボックス（F-12）。
 * カードの中に置くので、押してもカードの編集画面は開かず、ドラッグも始まらない。
 */
function Checkbox({ checked, indeterminate = false, disabled = false, label, onToggle }: CheckboxProps) {
  const ref = useRef<HTMLInputElement>(null)

  // 「－」の表示（indeterminate）は、HTML の属性では指定できないので、ここで設定する
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate
  }, [indeterminate])

  return (
    <input
      ref={ref}
      type="checkbox"
      checked={checked}
      disabled={disabled || !onToggle}
      onChange={() => onToggle?.()}
      onClick={stop}
      onPointerDown={stop}
      onKeyDown={stop}
      aria-label={label}
      className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-[#0c66e4] disabled:cursor-default"
    />
  )
}

export default Checkbox
