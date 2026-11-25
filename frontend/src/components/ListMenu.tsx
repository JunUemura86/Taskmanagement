import { type LucideIcon, MoreHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

/** メニューの項目1つ */
export type ListMenuItem = {
  label: string
  icon: LucideIcon
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
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="text-sub hover:bg-hover hover:text-ink aria-expanded:bg-hover"
          />
        }
        aria-label={`リスト「${listName}」のメニュー`}
      >
        <MoreHorizontal aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {items.map((item) => (
          <DropdownMenuItem
            key={item.label}
            variant={item.isDanger ? 'destructive' : 'default'}
            onClick={item.onSelect}
            className="cursor-pointer gap-2 px-2 py-1.5"
          >
            <item.icon aria-hidden="true" />
            {item.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default ListMenu
