// リストの並べ替え（F-18）の計算。
import type { List } from '../types'

/**
 * リストを、listIds の順番（左から）に並べ替えた、新しいボードを返す（元のボードは変えない）。
 * 並び順（position）も 0, 1, 2… と振り直す。listIds にないリストは入らない。
 */
export function orderLists(lists: List[], listIds: number[]): List[] {
  const listsById = new Map(lists.map((list) => [list.id, list]))
  return listIds.flatMap((id, index) => {
    const list = listsById.get(id)
    return list ? [{ ...list, position: index }] : []
  })
}
