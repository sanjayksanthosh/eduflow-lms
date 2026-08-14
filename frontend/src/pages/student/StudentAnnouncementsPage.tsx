import { useEffect, useState } from "react"
import { BellRing } from "lucide-react"
import { api, getErrorMessage } from "@/lib/api"
import { PageHeader } from "@/components/shared/PageHeader"
import { PageLoader } from "@/components/shared/PageLoader"
import { ErrorState } from "@/components/shared/ErrorState"
import { EmptyState } from "@/components/shared/EmptyState"
import { Badge } from "@/components/ui/badge"
import { formatDateTime, fullName } from "@/lib/format"

interface StudentAnnouncement {
  id: string
  title: string
  content: string
  target: string
  publishedAt: string | null
  author: { firstName: string; lastName: string; role: string } | null
  batch: { id: string; name: string } | null
}

const targetBadge = (target: string, batchName?: string | null) => {
  if (target === "ALL") return <Badge variant="outline">Everyone</Badge>
  if (target === "BATCH") return <Badge variant="outline">{batchName ?? "Batch"}</Badge>
  return <Badge variant="outline">Me</Badge>
}

export function StudentAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<StudentAnnouncement[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const { data } = await api.get("/student/announcements")
      setAnnouncements(data.data as StudentAnnouncement[])
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  if (loading && !announcements) return <PageLoader />
  if (error && !announcements) {
    return (
      <div className="space-y-6">
        <PageHeader title="Announcements" description="Notices for you." />
        <ErrorState message={error} onRetry={load} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Announcements" description="Notices for you." />

      {announcements && announcements.length === 0 ? (
        <EmptyState
          icon={BellRing}
          title="No announcements"
          description="New announcements will appear here."
        />
      ) : (
        <div className="space-y-3">
          {announcements?.map((announcement) => (
            <div
              key={announcement.id}
              className="rounded-lg border bg-card p-5 transition-colors hover:border-primary/40"
            >
              <div className="flex items-start justify-between gap-3">
                <p className="font-medium leading-snug">{announcement.title}</p>
                {targetBadge(announcement.target, announcement.batch?.name)}
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">
                {announcement.content}
              </p>
              <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                {announcement.author ? (
                  <span>{fullName(announcement.author.firstName, announcement.author.lastName)}</span>
                ) : null}
                {announcement.publishedAt ? (
                  <span>· {formatDateTime(announcement.publishedAt)}</span>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
