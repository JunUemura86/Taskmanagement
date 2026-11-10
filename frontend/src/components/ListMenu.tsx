import { useEffect, useRef, useState } from 'react'

/** メニューの項目1つ */
export type ListMenuItem = {
  label: string
  onSelect: () => void
  /** 削除など、気をつけて押す項目なら true（赤い文字にする） */
  isDanger?: boolean
}

type ListMenuProps = {
  /** どのリストのメニューか（読み上げ用） */
  listName: string
  items: ListMenuItem[]
}

/**
 * リストの見出しの「…」メニュー。押すと項目を開き、項目を押すか、外を押すか、Esc で閉じる。
 * 押し間違いを防ぐため、リストの削除はこのメニューの中に置く（画面設計書 SC-01）。
 */
function ListMenu({ listName, items }: ListMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // 開いている間は、メニューの外を押したとき・Esc を押したときに閉じる
  useEffect(() => {
    if (!isOpen) return
    function handlePointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setIsOpen(false)
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.isComposing || event.keyCode === 229) return
      if (event.key === 'Escape') setIsOpen(false)
    }
    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  return (
    <div ref={containerRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-label={`リスト「${listName}」のメニュー`}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        className="rounded px-2 leading-6 text-[#44546f] hover:bg-[#dcdfe4]"
      >
        …
      </button>
      {isOpen && (
        <ul role="menu" className="absolute right-0 z-20 mt-1 w-44 rounded-md bg-white py-1 text-sm font-normal shadow-lg">
          {items.map((item) => (
            <li key={item.label} role="none">
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setIsOpen(false)
                  item.onSelect()
                }}
                className={`w-full px-3 py-1.5 text-left hover:bg-[#f1f2f4] ${item.isDanger ? 'text-[#ae2e24]' : 'text-[#172b4d]'}`}
              >
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default ListMenu
