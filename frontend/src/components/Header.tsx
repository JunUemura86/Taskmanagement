import { SquareKanban, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

type HeaderProps = {
  /** ボードにあるリストとカードの数（読み込めていないときは null で、表示しない） */
  counts: { lists: number; cards: number } | null
  /** チェックボックスで選んだカードの枚数 */
  selectedCount: number
  /** 「選択したカードを削除」を押したとき */
  onDeleteSelected: () => void
}

/**
 * 画面上部のヘッダー。アプリ名と、リスト・カードの数と、「選択したカードを削除（○件）」ボタンを表示する。
 * 複数のリストにまたがって選べるため、ボタンは画面上部に1つだけ置く。1枚も選んでいないときは押せない。
 */
function Header({ counts, selectedCount, onDeleteSelected }: HeaderProps) {
  return (
    <header className="flex h-14 items-center justify-between border-b border-line bg-white px-6">
      <div className="flex items-center gap-3">
        <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-white" aria-hidden="true">
          <SquareKanban className="size-5" />
        </span>
        <h1 className="text-base font-semibold tracking-tight">タスク管理</h1>
        {counts && (
          <p className="border-l border-line pl-3 text-xs text-sub tabular-nums">
            {counts.lists}リスト・{counts.cards}カード
          </p>
        )}
      </div>
      <Button
        type="button"
        // 選んでいないときは目立たせず、選んだときだけ赤くする
        variant={selectedCount === 0 ? 'outline' : 'destructive'}
        onClick={onDeleteSelected}
        disabled={selectedCount === 0}
      >
        <Trash2 aria-hidden="true" />
        選択したカードを削除（{selectedCount}件）
      </Button>
    </header>
  )
}

export default Header
