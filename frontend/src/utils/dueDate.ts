// 期限（dueDate）の表示ルール。機能要件「2.3 期限の色分けのルール」を参照。

const ONE_DAY = 24 * 60 * 60 * 1000

/**
 * 期限の状態。
 * - 'overdue'：期限切れ（今日より前）
 * - 'soon'：期限が近い（今日または明日）
 * - 'normal'：通常（明後日以降）
 */
export type DueStatus = 'overdue' | 'soon' | 'normal'

/**
 * "2026-11-10" の形の文字を、パソコンの時刻での「その日の 0 時」の Date にする。
 * new Date("2026-11-10") は世界標準時（UTC）の 0 時として扱われ、日本では日付がずれることがあるため、
 * 年・月・日に分けて作る。
 */
function toLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number)
  return new Date(year, month - 1, day)
}

/** 今日（パソコンの日付）の 0 時。 */
function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

/** 期限の状態を返す。 */
export function getDueStatus(dateStr: string, today: Date = new Date()): DueStatus {
  const days = Math.round((toLocalDate(dateStr).getTime() - startOfDay(today).getTime()) / ONE_DAY)
  if (days < 0) return 'overdue'
  if (days <= 1) return 'soon'
  return 'normal'
}

/** 期限の日付を表示用の文字にする。今年なら「11/10」、今年以外なら「2027/1/10」。 */
export function formatDueDate(dateStr: string, today: Date = new Date()): string {
  const date = toLocalDate(dateStr)
  const monthDay = `${date.getMonth() + 1}/${date.getDate()}`
  return date.getFullYear() === today.getFullYear() ? monthDay : `${date.getFullYear()}/${monthDay}`
}
