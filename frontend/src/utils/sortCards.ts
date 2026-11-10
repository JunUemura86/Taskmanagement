// 条件での並べ替え（F-17）の計算。機能要件「2.6 並べ替えのルール」を参照。
import type { Card } from '../types'

/** 並べ替えの条件。'priority'：優先度順、'dueDate'：期限順、'label'：カテゴリ別、'created'：追加した順 */
export type SortKey = 'priority' | 'dueDate' | 'label' | 'created'

/** プルダウンに並べる選択肢（並ぶ順もこのとおり） */
export const SORT_OPTIONS: { key: SortKey; text: string }[] = [
  { key: 'priority', text: '優先度順' },
  { key: 'dueDate', text: '期限順' },
  { key: 'label', text: 'カテゴリ別' },
  { key: 'created', text: '追加した順' },
]

/** 2枚のカードを比べる関数。a を上にするならマイナス、b を上にするならプラス、同じなら 0 */
type Compare = (a: Card, b: Card) => number

/** 優先度の高い順（1：高 → 2：中 → 3：低） */
const byPriority: Compare = (a, b) => a.priority - b.priority

/** 期限の早い順。期限なしは一番下（"2026-11-10" の形なので、文字のまま比べられる） */
const byDueDate: Compare = (a, b) => {
  if (a.dueDate === b.dueDate) return 0
  if (a.dueDate === null) return 1
  if (b.dueDate === null) return -1
  return a.dueDate < b.dueDate ? -1 : 1
}

/** 追加した順（カードの ID は作った順に増えるので、ID の小さい順。別のリストから来たカードも、作った時点で決まる） */
const byCreated: Compare = (a, b) => a.id - b.id

/** ラベルの順（ラベルの並び順 position の小さい順：赤 → 黄 → 緑 → 青 → 紫）。ラベルなしは一番下 */
function byLabel(labelPositions: ReadonlyMap<number, number>): Compare {
  const rank = (card: Card) =>
    card.labelId === null ? Number.POSITIVE_INFINITY : (labelPositions.get(card.labelId) ?? Number.POSITIVE_INFINITY)
  return (a, b) => {
    const diff = rank(a) - rank(b)
    return Number.isNaN(diff) ? 0 : diff
  }
}

/** 前の比べ方で同じ順位のときは、次の比べ方で決める */
function chain(...compares: Compare[]): Compare {
  return (a, b) => {
    for (const compare of compares) {
      const result = compare(a, b)
      if (result !== 0) return result
    }
    return 0
  }
}

/**
 * カードを、条件で並べ替えた新しい配列を返す（もとの配列は書き換えない）。
 * 並び順（position）も、上から 0, 1, 2… に振り直す。
 *
 * @param labelPositions ラベルの ID から、ラベルの並び順（position）を引けるようにしたもの（カテゴリ別で使う）
 */
export function sortCards(cards: Card[], key: SortKey, labelPositions: ReadonlyMap<number, number>): Card[] {
  const compares: Record<SortKey, Compare> = {
    // 優先度順：高 → 中 → 低。同じなら期限の早い順 → 追加した順
    priority: chain(byPriority, byDueDate, byCreated),
    // 期限順：期限の早い順（なしは一番下）。同じなら優先度の高い順 → 追加した順
    dueDate: chain(byDueDate, byPriority, byCreated),
    // カテゴリ別：ラベルの順（なしは一番下）。同じなら優先度の高い順 → 追加した順
    label: chain(byLabel(labelPositions), byPriority, byCreated),
    // 追加した順：古いものが上
    created: byCreated,
  }
  return [...cards]
    .sort(compares[key])
    .map((card, index) => (card.position === index ? card : { ...card, position: index }))
}
