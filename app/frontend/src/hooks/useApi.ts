import { useCallback, useEffect, useRef, useState } from 'react'
import { getErrorMessage } from '../api/client'

interface ApiState<T> {
  data: T | null
  loading: boolean
  error: string | null
  reload: () => void
}

/** Runs `fetcher` on mount and whenever `deps` change; ignores responses from superseded requests. */
export function useApi<T>(fetcher: () => Promise<T>, deps: unknown[]): ApiState<T> {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tick, setTick] = useState(0)
  const latest = useRef(0)

  useEffect(() => {
    const requestId = ++latest.current
    setLoading(true)
    setError(null)
    fetcher()
      .then((result) => {
        if (requestId === latest.current) setData(result)
      })
      .catch((err) => {
        if (requestId === latest.current) setError(getErrorMessage(err))
      })
      .finally(() => {
        if (requestId === latest.current) setLoading(false)
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick])

  const reload = useCallback(() => setTick((t) => t + 1), [])
  return { data, loading, error, reload }
}
