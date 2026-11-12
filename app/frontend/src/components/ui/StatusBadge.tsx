import type { ServerStatus } from '../../types/server'
import { formatEnum } from '../../lib/format'

const STYLES: Record<ServerStatus, { dot: string; text: string }> = {
  ACTIVE: { dot: 'bg-emerald-400', text: 'text-emerald-300' },
  INACTIVE: { dot: 'bg-zinc-500', text: 'text-zinc-400' },
  MAINTENANCE: { dot: 'bg-amber-400', text: 'text-amber-300' },
}

export default function StatusBadge({ status }: { status: ServerStatus }) {
  const style = STYLES[status]
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${style.text}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} aria-hidden="true" />
      {formatEnum(status)}
    </span>
  )
}
