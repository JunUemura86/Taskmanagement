import { CalendarDays } from 'lucide-react'
import { useRef, useState } from 'react'
import { ja } from 'react-day-picker/locale/ja'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { toDateString, toLocalDate } from '../utils/dueDate'
import { isImeEscape } from '../utils/ime'

/** 年のプルダウンに出す範囲（今年の前後の年数） */
const YEAR_RANGE = 10

type DueDatePickerProps = {
  /** 見出しの id（読み上げ用） */
  labelId: string
  /** "2026-11-10" の形。期限なしのときは空の文字（''） */
  value: string
  onChange: (value: string) => void
}

/** 期限の欄。押すとカレンダーを開き、日付を選ぶと閉じる。「クリア」で期限なしにできる。 */
function DueDatePicker({ labelId, value, onChange }: DueDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const calendarRef = useRef<HTMLDivElement>(null)
  const selected = value === '' ? undefined : toLocalDate(value)
  const [thisYear] = useState(() => new Date().getFullYear())
  // 選んである日付が範囲の外でも、表示できるようにする
  const selectedYear = selected?.getFullYear() ?? thisYear

  return (
    <div className="flex gap-2">
      <Popover
        open={isOpen}
        onOpenChange={(open, details) => {
          if (!open && isImeEscape(details.event)) details.cancel()
          else setIsOpen(open)
        }}
      >
        <PopoverTrigger
          id="card-edit-due-date"
          aria-labelledby={`${labelId} card-edit-due-date`}
          render={
            <Button
              type="button"
              variant="outline"
              className={`w-44 justify-start border-input font-normal tabular-nums ${value === '' ? 'text-sub' : ''}`}
            />
          }
        >
          <CalendarDays className="text-sub" aria-hidden="true" />
          {value === '' ? '期限なし' : value.replaceAll('-', '/')}
        </PopoverTrigger>
        <PopoverContent
          ref={calendarRef}
          align="start"
          className="w-auto p-1"
          // 開いたら、選んである日（なければ今日）にフォーカスを移し、矢印キーで日付を動かせるようにする
          initialFocus={() => calendarRef.current?.querySelector<HTMLElement>('button[data-day][tabindex="0"]') ?? true}
        >
          <Calendar
            mode="single"
            // 同じ日をもう一度押しても、選択を外さない（外すのは「クリア」）
            required
            locale={ja}
            captionLayout="dropdown"
            startMonth={new Date(Math.min(thisYear - YEAR_RANGE, selectedYear), 0)}
            endMonth={new Date(Math.max(thisYear + YEAR_RANGE, selectedYear), 11)}
            defaultMonth={selected}
            selected={selected}
            onSelect={(date) => {
              onChange(toDateString(date))
              setIsOpen(false)
            }}
          />
        </PopoverContent>
      </Popover>
      <Button type="button" variant="ghost" onClick={() => onChange('')} disabled={value === ''} className="text-sub">
        クリア
      </Button>
    </div>
  )
}

export default DueDatePicker
