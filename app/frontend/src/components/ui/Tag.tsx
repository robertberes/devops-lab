import type { ReactNode } from 'react'

/** Neutral pill used for environment / location / purpose values. */
export default function Tag({ children, highlight = false }: { children: ReactNode; highlight?: boolean }) {
  const tone = highlight
    ? 'border-indigo-500/40 bg-indigo-500/10 text-indigo-300'
    : 'border-zinc-700 bg-zinc-800/60 text-zinc-300'
  return (
    <span className={`inline-block rounded border px-1.5 py-0.5 text-xs font-medium ${tone}`}>{children}</span>
  )
}
