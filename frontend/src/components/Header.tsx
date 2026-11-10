type HeaderProps = {
  /** チェックボックスで選んだカードの枚数 */
  selectedCount: number
  /** 「選択したカードを削除」を押したとき */
  onDeleteSelected: () => void
}

/**
 * 画面上部のヘッダー。アプリ名と、「選択したカードを削除（○件）」ボタンを表示する。
 * 複数のリストにまたがって選べるため、ボタンは画面上部に1つだけ置く。1枚も選んでいないときは押せない。
 */
function Header({ selectedCount, onDeleteSelected }: HeaderProps) {
  return (
    <header className="flex h-14 items-center justify-between bg-white px-4 shadow-sm">
      <h1 className="text-lg font-bold">タスク管理</h1>
      <button
        type="button"
        onClick={onDeleteSelected}
        disabled={selectedCount === 0}
        className="rounded-md bg-[#c9372c] px-3 py-1.5 text-sm font-bold text-white hover:bg-[#ae2e24] disabled:cursor-not-allowed disabled:bg-[#dcdfe4] disabled:text-[#8590a2]"
      >
        選択したカードを削除（{selectedCount}件）
      </button>
    </header>
  )
}

export default Header
