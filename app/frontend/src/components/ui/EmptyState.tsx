import type { ReactNode } from 'react'
import { Inbox } from 'lucide-react'

export default function EmptyState({ title, description, action }: {
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
      <Inbox className="h-8 w-8 text-zinc-600" aria-hidden="true" />
      <div>
        <p className="font-medium text-zinc-100">{title}</p>
        {description && <p className="mt-1 text-sm text-zinc-400">{description}</p>}
      </div>
      {action}
    </div>
  )
}
