/** 画面上部のヘッダー。アプリ名を表示する。 */
function Header() {
  return (
    <header className="flex h-14 items-center bg-white px-4 shadow-sm">
      <h1 className="text-lg font-bold">タスク管理</h1>
    </header>
  )
}

export default Header
