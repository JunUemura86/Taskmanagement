// サーバーの API が返すデータの形。API の詳しい内容は docs/api-design.md を参照。

/** 優先度。1（高）・2（中）・3（低） */
export type Priority = 1 | 2 | 3

/** カード1枚（A-01 の cards の中身・A-02） */
export type Card = {
  id: number
  listId: number
  /** ラベルなしのときは null */
  labelId: number | null
  title: string
  priority: Priority
  /** "2026-11-10" の形。期限なしのときは null */
  dueDate: string | null
  position: number
}

/** リスト1つと、その中のカード（A-01） */
export type List = {
  id: number
  name: string
  position: number
  /** 完了用リストなら true */
  isDone: boolean
  cards: Card[]
}

/** ラベル（A-03） */
export type Label = {
  id: number
  name: string
  /** "#E5484D" の形 */
  colorCode: string
  position: number
}
