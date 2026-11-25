type ErrorBannerProps = {
  message: string
}

/** 画面上部のお知らせ欄。上限・接続エラー（M-06〜M-08）を表示する。 */
function ErrorBanner({ message }: ErrorBannerProps) {
  return (
    <div role="alert" className="border-b border-danger bg-danger-soft px-4 py-2 text-sm text-danger-dark">
      {message}
    </div>
  )
}

export default ErrorBanner
