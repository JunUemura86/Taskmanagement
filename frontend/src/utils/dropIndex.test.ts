import { describe, expect, it } from 'vitest'
import { countCardsAbove, referenceY } from './dropIndex'

// 高さ 40 のカードが、すき間 8 で3枚並んでいる（真ん中は 20・68・116）
const centers = [20, 68, 116]

describe('countCardsAbove', () => {
  it('一番上より上なら 0（一番上に差し込む）', () => {
    expect(countCardsAbove(centers, 5)).toBe(0)
  })

  it('1枚目の真ん中を越えたら 1', () => {
    expect(countCardsAbove(centers, 21)).toBe(1)
  })

  it('全部の真ん中より下なら、一番下', () => {
    expect(countCardsAbove(centers, 200)).toBe(3)
  })

  it('カードがないリストなら 0', () => {
    expect(countCardsAbove([], 100)).toBe(0)
  })
})

describe('referenceY', () => {
  it('上へ動かしているときは、上の端を使う', () => {
    expect(referenceY(100, 140, -10)).toBe(100)
  })

  it('下へ動かしているときは、下の端を使う', () => {
    expect(referenceY(100, 140, 10)).toBe(140)
  })
})

describe('一番下のカードを、真上へ動かしたとき', () => {
  // 4枚目（上の端 144・下の端 184）を、上の3枚（真ん中 20・68・116）の上へ動かす
  it('上の端が3枚目の真ん中に届く前は、元の位置（3）のまま', () => {
    const y = referenceY(144 - 20, 184 - 20, -20) // 20 上へ → 上の端 124
    expect(countCardsAbove(centers, y)).toBe(3)
  })

  it('3枚目に半分ほど重なったら、3枚目の上（2）に差し込む', () => {
    const y = referenceY(144 - 30, 184 - 30, -30) // 30 上へ → 上の端 114（3枚目の真ん中 116 を越えた）
    expect(countCardsAbove(centers, y)).toBe(2)
  })
})
