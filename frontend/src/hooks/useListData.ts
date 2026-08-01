import { useCallback, useEffect, useState } from "react"
import { api, getErrorMessage } from "@/lib/api"
import type { PaginationMeta } from "@/lib/types"

const DEFAULT_META: PaginationMeta = { page: 1, limit: 10, total: 0, totalPages: 1 }

interface UseListDataResult<T> {
  data: T[]
  meta: PaginationMeta
  loading: boolean
  error: string | null
  refetch: () => void
  setData: (data: T[]) => void
}

export function useListData<T>(path: string, deps: unknown[] = []): UseListDataResult<T> {
  const [data, setData] = useState<T[]>([])
  const [meta, setMeta] = useState<PaginationMeta>(DEFAULT_META)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const refetch = useCallback(() => setRefreshKey((key) => key + 1), [])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    api
      .get(path)
      .then((response) => {
        if (cancelled) return
        setData(response.data.data as T[])
        setMeta(response.data.meta ?? DEFAULT_META)
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
  }, [path, refreshKey, ...deps])

  return { data, meta, loading, error, refetch, setData }
}
