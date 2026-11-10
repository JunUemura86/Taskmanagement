// 完了用リスト（F-15）の計算。完了用リストは1つ以下にする。
import type { List } from '../types'

/**
 * 完了用リストを指定（isDone が true）・解除（false）した、新しいボードのデータを返す。
 * 指定するときは、それまで完了用だったリストの指定を外す。変わらないリストは、そのまま使う。
 */
export function setDoneList(lists: List[], listId: number, isDone: boolean): List[] {
  return lists.map((list) => {
    const next = list.id === listId ? isDone : isDone ? false : list.isDone
    return next === list.isDone ? list : { ...list, isDone: next }
  })
}
