import { ChevronLeft, ChevronRight } from 'lucide-react'

interface Props {
  page: number // zero-based
  size: number
  totalElements: number
  totalPages: number
  onPageChange: (page: number) => void
}

export default function Pagination({ page, size, totalElements, totalPages, onPageChange }: Props) {
  const from = totalElements === 0 ? 0 : page * size + 1
  const to = Math.min((page + 1) * size, totalElements)
  return (
    <nav aria-label="Pagination" className="flex items-center justify-between gap-4 border-t border-zinc-800 px-4 py-3 text-sm">
      <p className="text-zinc-400">
        Showing <span className="text-zinc-200">{from}–{to}</span> of <span className="text-zinc-200">{totalElements}</span>
      </p>
      <div className="flex items-center gap-2">
        <span className="text-zinc-400">Page {totalPages === 0 ? 0 : page + 1} of {totalPages}</span>
        <button type="button" className="btn-secondary px-2!" aria-label="Previous page"
                disabled={page <= 0} onClick={() => onPageChange(page - 1)}>
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button type="button" className="btn-secondary px-2!" aria-label="Next page"
                disabled={page + 1 >= totalPages} onClick={() => onPageChange(page + 1)}>
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </nav>
  )
}
