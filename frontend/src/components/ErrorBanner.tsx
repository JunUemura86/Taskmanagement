import { CircleAlert } from 'lucide-react'
import { Alert, AlertTitle } from '@/components/ui/alert'

type ErrorBannerProps = {
  message: string
}

/** 画面上部のお知らせ欄。上限・接続エラー（M-06〜M-08）を表示する。 */
function ErrorBanner({ message }: ErrorBannerProps) {
  return (
    <Alert className="rounded-none border-x-0 border-t-0 border-danger/40 bg-danger-soft px-6 py-2.5 text-danger-dark">
      <CircleAlert aria-hidden="true" />
      <AlertTitle>{message}</AlertTitle>
    </Alert>
  )
}

export default ErrorBanner
