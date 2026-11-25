import { Trash2 } from 'lucide-react'
import { useRef } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { isImeEscape } from '../utils/ime'

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
 * 確認メッセージ（SC-03）。ほかの画面の上に重ねて表示する。背景を押しても閉じない。
 * ブラウザ標準の確認画面（window.confirm）は、ブラウザによっては出ないことがあるため、アプリの中に作る。
 * 編集画面の上に出したときの Esc は、この画面だけを閉じる（うしろの編集画面は閉じない）。
 */
function ConfirmDialog({ message, confirmLabel, onConfirm, onCancel }: ConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null)

  return (
    <AlertDialog
      open
      onOpenChange={(open, details) => {
        if (open) return
        // 日本語入力の変換中の Esc は、変換の取り消しなので無視する
        if (isImeEscape(details.event)) details.cancel()
        else onCancel()
      }}
    >
      {/* 間違えて削除しないよう、最初は「キャンセル」を選んだ状態にする */}
      <AlertDialogContent initialFocus={cancelRef}>
        <AlertDialogHeader>
          <AlertDialogMedia className="rounded-full bg-danger-soft text-danger-dark *:[svg]:size-5!">
            <Trash2 aria-hidden="true" />
          </AlertDialogMedia>
          <AlertDialogTitle className="text-sm leading-6 break-all">{message}</AlertDialogTitle>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel ref={cancelRef}>キャンセル</AlertDialogCancel>
          <AlertDialogAction type="button" variant="destructive" onClick={onConfirm}>
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export default ConfirmDialog
