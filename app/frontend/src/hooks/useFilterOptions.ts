import { useEffect, useState } from 'react'
import { getFilterOptions } from '../api/servers'
import type { FilterOptions } from '../types/server'

let cached: FilterOptions | null = null

/** Enum values come from the backend (single source of truth) and are cached for the session. */
export function useFilterOptions(): FilterOptions | null {
  const [options, setOptions] = useState<FilterOptions | null>(cached)

  useEffect(() => {
    if (cached) return
    getFilterOptions()
      .then((o) => {
        cached = o
        setOptions(o)
      })
      .catch(() => undefined)
  }, [])

  return options
}
