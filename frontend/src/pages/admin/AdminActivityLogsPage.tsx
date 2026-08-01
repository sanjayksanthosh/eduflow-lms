import { useMemo, useState } from "react"
import { Activity } from "lucide-react"
import { useListData } from "@/hooks/useListData"
import { PageHeader } from "@/components/shared/PageHeader"
import { DataTable, type Column } from "@/components/shared/DataTable"
import { Pagination } from "@/components/shared/Pagination"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { EmptyState } from "@/components/shared/EmptyState"
import { ErrorState } from "@/components/shared/ErrorState"
import { SearchInput } from "@/components/shared/SearchInput"
import { Badge } from "@/components/ui/badge"
import { timeAgo } from "@/lib/format"
import type { ActivityLog } from "@/lib/types"

const PAGE_SIZE = 20

export function AdminActivityLogsPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")

  const query = useMemo(() => {
    const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) })
    if (debouncedSearch) params.set("search", debouncedSearch)
    return `/admin/activity-logs?${params.toString()}`
  }, [page, debouncedSearch])

  const { data: logs, meta, loading, error, refetch } = useListData<ActivityLog>(query)

  const debounce = useMemo(() => {
    let timer: ReturnType<typeof setTimeout> | undefined
    return (value: string) => {
      if (timer) clearTimeout(timer)
      timer = setTimeout(() => setDebouncedSearch(value), 300)
    }
  }, [])

  const filtered = useMemo(
    () =>
      logs.filter((log) => {
        const haystack = `${log.description} ${log.type} ${log.user?.firstName ?? ""} ${log.user?.lastName ?? ""} ${log.user?.email ?? ""}`.toLowerCase()
        return haystack.includes(debouncedSearch.toLowerCase())
      }),
    [logs, debouncedSearch]
  )

  const columns: Column<ActivityLog>[] = [
    {
      key: "description",
      header: "Activity",
      cell: (log) => (
        <div className="min-w-0">
          <p className="truncate text-sm">{log.description}</p>
          <p className="text-xs text-muted-foreground">{log.ip ? `IP ${log.ip}` : "System"}</p>
        </div>
      ),
    },
    {
      key: "type",
      header: "Type",
      cell: (log) => <StatusBadge status={log.type} />,
    },
    {
      key: "user",
      header: "User",
      cell: (log) =>
        log.user ? (
          <div className="min-w-0">
            <p className="truncate text-sm">
              {log.user.firstName} {log.user.lastName}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {log.user.email} · {log.user.role.toLowerCase()}
            </p>
          </div>
        ) : (
          <Badge variant="outline">System</Badge>
        ),
    },
    {
      key: "time",
      header: "Time",
      cell: (log) => <span className="text-sm text-muted-foreground">{timeAgo(log.createdAt)}</span>,
    },
  ]

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader title="Activity Logs" description="Audit trail of actions across the system." />
        <ErrorState message={error} onRetry={refetch} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Activity Logs" description="Audit trail of actions across the system." />

      <div className="flex flex-wrap items-center gap-2">
        <SearchInput
          value={search}
          onChange={(value) => {
            setSearch(value)
            debounce(value)
          }}
          placeholder="Filter logs..."
          className="w-full sm:w-72"
        />
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        keyExtractor={(log) => log.id}
        loading={loading}
        emptyMessage="No activity recorded yet."
        emptyAction={<EmptyState icon={Activity} title="No activity yet" />}
      />

      <Pagination meta={meta} onPageChange={setPage} />
    </div>
  )
}
