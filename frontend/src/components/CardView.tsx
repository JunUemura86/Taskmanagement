import type { Card, Label } from '../types'
import { type DueStatus, formatDueDate, getDueStatus } from '../utils/dueDate'
import { getPriority } from '../utils/priority'

// 期限の状態ごとの見た目（機能要件「2.3 期限の色分けのルール」）
const DUE_STYLES: Record<DueStatus, string> = {
  overdue: 'font-bold text-[#c9372c]',
  soon: 'rounded-sm bg-[#f8e6a0] px-1 text-[#7f5f01]',
  normal: 'text-[#626f86]',
}

type CardViewProps = {
  card: Card
  /** ラベルなしのときは undefined */
  label?: Label
  /** 完了用リストのカードなら true */
  isDoneList: boolean
}

/**
 * カード1枚の見た目。ラベルの帯・タイトル・優先度のバッジ・期限を表示する。
 * 完了用リストのカードは、期限を色分けしない。
 * ボードの中のカード（CardItem）と、ドラッグ中にマウスについてくるカードの両方で使う。
 */
function CardView({ card, label, isDoneList }: CardViewProps) {
  const priority = getPriority(card.priority)
  const dueStatus: DueStatus = card.dueDate && !isDoneList ? getDueStatus(card.dueDate) : 'normal'

  return (
    <div className={`relative rounded-md bg-white px-2.5 pb-2 shadow-sm ${label ? 'pt-4' : 'pt-2'}`}>
      {label && (
        // ラベル（カテゴリ）：カードの上の端の細い帯。マウスを乗せると名前を表示する
        <div
          className="absolute inset-x-0 top-0 h-1.5 rounded-t-md"
          style={{ backgroundColor: label.colorCode }}
          title={`ラベル：${label.name}`}
        />
      )}

      <div className="flex items-start gap-1.5">
        <p className="min-w-0 flex-1 text-sm break-all">{card.title}</p>
        {/* 優先度：タイトルの右の、文字入りのバッジ */}
        <span
          className={`shrink-0 rounded-full border px-1.5 text-[11px] leading-4 font-bold whitespace-nowrap ${priority.className}`}
        >
          {priority.text}
        </span>
      </div>

      {card.dueDate && (
        <p className="mt-1 text-xs">
          <span className={DUE_STYLES[dueStatus]}>
            {dueStatus === 'overdue' && '期限切れ '}
            {formatDueDate(card.dueDate)}
          </span>
        </p>
      )}
    </div>
  )
}

export default CardView
