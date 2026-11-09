import { useEffect } from 'react'

type ConfirmDialogProps = {
  /** 確認のメッセージ（M-01〜M-03） */
  message: string
  /** 「OK」のボタンの文字（例：「削除」） */
  confirmLabel: string
  /** 「OK」を押したとき */
  onConfirm: () => void
  /** 「キャンセル」・Esc を押したとき */
  onCancel: () => void
}

/**
 * 確認メッセージ（SC-03）。ほかの画面の上に重ねて表示する。
 * ブラウザ標準の確認画面（window.confirm）は、ブラウザによっては出ないことがあるため、アプリの中に作る。
 */
function ConfirmDialog({ message, confirmLabel, onConfirm, onCancel }: ConfirmDialogProps) {
  // Esc キーで「キャンセル」にする（日本語入力の変換中の Esc は無視する）
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.isComposing || event.keyCode === 229) return
      if (event.key === 'Escape') {
        // うしろの編集画面まで閉じないように、ここで止める
        event.stopImmediatePropagation()
        onCancel()
      }
    }
    // 編集画面の Esc より先に受け取るため、capture（先に受け取る設定）で登録する
    window.addEventListener('keydown', handleKeyDown, true)
    return () => window.removeEventListener('keydown', handleKeyDown, true)
  }, [onCancel])

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/40 p-4">
      <div
        role="alertdialog"
        aria-modal="true"
        aria-describedby="confirm-message"
        className="w-full max-w-xs rounded-lg bg-white p-4 shadow-xl"
      >
        <p id="confirm-message" className="text-sm break-all">
          {message}
        </p>
        <div className="mt-4 flex justify-end gap-2">
          {/* 間違えて削除しないよう、最初は「キャンセル」を選んだ状態にする */}
          <button
            type="button"
            onClick={onCancel}
            autoFocus
            className="rounded-md bg-[#f1f2f4] px-3 py-1.5 text-sm text-[#44546f] hover:bg-[#dcdfe4]"
          >
            キャンセル
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-md bg-[#c9372c] px-3 py-1.5 text-sm font-bold text-white hover:bg-[#ae2e24]"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmDialog
