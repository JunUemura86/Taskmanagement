import { Calendar, CalendarClock, CalendarX2, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import type { Card, Label } from '../types'
import { type DueStatus, formatDueDate, getDueStatus } from '../utils/dueDate'
import { getPriority } from '../utils/priority'

// 期限の状態ごとの見た目とアイコン（機能要件「2.3 期限の色分けのルール」）
const DUE_STYLES: Record<DueStatus, { className: string; icon: LucideIcon }> = {
  overdue: { className: 'font-semibold text-danger-dark', icon: CalendarX2 },
  soon: { className: 'rounded-sm bg-warn-soft px-1.5 font-medium text-warn', icon: CalendarClock },
  normal: { className: 'text-sub', icon: Calendar },
}

type CardViewProps = {
  card: Card
  /** ラベルなしのときは undefined */
  label?: Label
  /** 完了用リストのカードなら true */
  isDoneList: boolean
  /** タイトルの左に置くもの（チェックボックス） */
  leading?: ReactNode
}

/**
 * カード1枚の見た目。ラベルの短い帯・タイトルと、その下の1行に優先度のバッジ・期限を表示する。
 * 完了用リストのカードは、期限を色分けしない。
 * ボードの中のカード（CardItem）と、ドラッグ中にマウスについてくるカードの両方で使う。
 */
function CardView({ card, label, isDoneList, leading }: CardViewProps) {
  const priority = getPriority(card.priority)
  const dueStatus: DueStatus = card.dueDate && !isDoneList ? getDueStatus(card.dueDate) : 'normal'
  const due = DUE_STYLES[dueStatus]

  return (
    <div className="rounded-lg border border-line bg-white p-3 shadow-xs">
      {label && (
        // ラベル（カテゴリ）：タイトルの上の短い帯。マウスを乗せると名前を表示する
        <div
          className="mb-2 h-1.5 w-10 rounded-full"
          style={{ backgroundColor: label.colorCode }}
          title={`ラベル：${label.name}`}
        />
      )}

      <div className="flex items-start gap-2">
        {leading}
        <div className="min-w-0 flex-1">
          <p className="text-sm leading-5 break-all">{card.title}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs leading-5">
            {/* 優先度：文字入りのバッジ */}
            <span className={`rounded-sm border px-1.5 font-semibold whitespace-nowrap ${priority.className}`}>
              {priority.text}
            </span>
            {card.dueDate && (
              <span className={`inline-flex items-center gap-1 tabular-nums ${due.className}`}>
                <due.icon className="size-3.5 shrink-0" aria-hidden="true" />
                {dueStatus === 'overdue' && '期限切れ '}
                {formatDueDate(card.dueDate)}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default CardView
