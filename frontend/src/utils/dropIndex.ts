// ドラッグ中のカードを、リストの何番目に差し込むかの計算。

/**
 * ドラッグ中のカードの「基準の高さ」（上へ動かしているときは上の端、下へ動かしているときは下の端）より
 * 上に真ん中があるカードの枚数を数えて、差し込む位置（0 から数える）にする。
 * つまり、ドラッグ中のカードの端が、となりのカードの真ん中を越えたら、そのカードの向こう側に差し込む。
 *
 * @param cardCenters 差し込む先のリストのカード（ドラッグ中のカード自身を除く）の、真ん中の高さ
 * @param referenceY  ドラッグ中のカードの基準の高さ
 */
export function countCardsAbove(cardCenters: number[], referenceY: number): number {
  return cardCenters.filter((center) => center < referenceY).length
}

/**
 * ドラッグ中のカードの基準の高さを決める。
 * 上へ動かしているときは上の端、下へ動かしているときは下の端を使う
 * （動かしている向きの端で決めると、となりのカードに半分ほど重なったところで線が移る）。
 *
 * @param top    ドラッグ中のカードの上の端の高さ
 * @param bottom ドラッグ中のカードの下の端の高さ
 * @param deltaY ドラッグを始めてから縦に動いた量（マイナスなら上へ動かしている）
 */
export function referenceY(top: number, bottom: number, deltaY: number): number {
  return deltaY < 0 ? top : bottom
}
