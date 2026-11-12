import { AlertTriangle } from 'lucide-react'

export default function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-center gap-3 px-6 py-14 text-center">
      <AlertTriangle className="h-8 w-8 text-rose-400" aria-hidden="true" />
      <div>
        <p className="font-medium text-zinc-100">Something went wrong</p>
        <p className="mt-1 text-sm text-zinc-400">{message}</p>
      </div>
      {onRetry && (
        <button type="button" className="btn-secondary" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  )
}
