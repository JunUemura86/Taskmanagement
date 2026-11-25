// 日本語入力（IME）の変換中のキーの判定。

/** 変換中に押された Esc（変換の取り消し）なら true。 */
export function isImeEscape(event: Event): boolean {
  // Safari などでは isComposing が false になることがあるため、keyCode 229（変換中のキー）でも判定する
  return event instanceof KeyboardEvent && event.key === 'Escape' && (event.isComposing || event.keyCode === 229)
}
