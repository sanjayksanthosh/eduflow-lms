import { useCallback, useEffect, useState } from "react"
import { api, getErrorMessage } from "@/lib/api"

interface UseApiOptions {
  enabled?: boolean
  deps?: unknown[]
}

interface UseApiResult<T> {
  data: T | undefined
  loading: boolean
  error: string | null
  refetch: () => void
}

export function useApi<T>(path: string, options: UseApiOptions = {}): UseApiResult<T> {
  const { enabled = true, deps = [] } = options
  const [data, setData] = useState<T | undefined>(undefined)
  const [loading, setLoading] = useState<boolean>(enabled)
  const [error, setError] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const refetch = useCallback(() => setRefreshKey((key) => key + 1), [])

  useEffect(() => {
    if (!enabled) return
    let cancelled = false
    setLoading(true)
    setError(null)
    api
      .get(path)
      .then((response) => {
        if (!cancelled) setData(response.data.data as T)
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(getErrorMessage(err))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, refreshKey, enabled, ...deps])

  return { data, loading, error, refetch }
}
