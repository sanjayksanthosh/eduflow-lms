import { useEffect, useState } from "react"
import { Bell, CheckCheck } from "lucide-react"
import { toast } from "sonner"
import { api, getErrorMessage } from "@/lib/api"
import { PageHeader } from "@/components/shared/PageHeader"
import { PageLoader } from "@/components/shared/PageLoader"
import { ErrorState } from "@/components/shared/ErrorState"
import { EmptyState } from "@/components/shared/EmptyState"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { timeAgo } from "@/lib/format"

interface StudentNotification {
  id: string
  title: string
  body: string
  type: string
  isRead: boolean
  link: string | null
  createdAt: string
}

interface NotificationsMeta {
  page: number
  limit: number
  total: number
  totalPages: number
  unread: number
}

export function StudentNotificationsPage() {
  const [notifications, setNotifications] = useState<StudentNotification[] | null>(null)
  const [meta, setMeta] = useState<NotificationsMeta | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [busyId, setBusyId] = useState<string | null>(null)

  const load = async (pageValue = 1) => {
    setLoading(true)
    setError(null)
    try {
      const { data } = await api.get("/student/notifications", { params: { page: pageValue, limit: 20 } })
      setNotifications(data.data as StudentNotification[])
      setMeta(data.meta as NotificationsMeta)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load(page)
  }, [page])

  const markRead = async (id: string) => {
    setBusyId(id)
    try {
      await api.patch(`/student/notifications/${id}/read`)
      setNotifications((prev) => prev?.map((n) => (n.id === id ? { ...n, isRead: true } : n)) ?? prev)
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setBusyId(null)
    }
  }

  const markAll = async () => {
    try {
      await api.patch("/student/notifications/read-all")
      setNotifications((prev) => prev?.map((n) => ({ ...n, isRead: true })) ?? prev)
      toast.success("All notifications marked as read")
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  if (loading && !notifications) return <PageLoader />
  if (error && !notifications) {
    return (
      <div className="space-y-6">
        <PageHeader title="Notifications" description="Your notifications." />
        <ErrorState message={error} onRetry={() => load(page)} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        description={meta && meta.unread > 0 ? `${meta.unread} unread` : "You're all caught up."}
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={markAll}
            disabled={!meta || meta.unread === 0}
          >
            <CheckCheck className="size-4" />
            Mark all read
          </Button>
        }
      />

      {notifications && notifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No notifications"
          description="New notifications will appear here."
        />
      ) : (
        <div className="space-y-2">
          {notifications?.map((notification) => (
            <button
              key={notification.id}
              type="button"
              disabled={busyId === notification.id || notification.isRead}
              onClick={() => markRead(notification.id)}
              className={cn(
                "block w-full rounded-lg border bg-card p-4 text-left transition-colors",
                !notification.isRead && "border-primary/30 hover:border-primary/50",
                notification.isRead && "opacity-70",
                busyId === notification.id && "cursor-wait"
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    {!notification.isRead ? <span className="size-2 shrink-0 rounded-full bg-primary" /> : null}
                    <p className="truncate text-sm font-medium">{notification.title}</p>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{notification.body}</p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <Badge variant="outline">{notification.type}</Badge>
                  <span className="text-xs text-muted-foreground">{timeAgo(notification.createdAt)}</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {meta && meta.totalPages > 1 ? (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Page {meta.page} of {meta.totalPages}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= meta.totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
