import { useEffect, useState } from "react"
import { Clock, Megaphone, MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { api, getErrorMessage } from "@/lib/api"
import { PageHeader } from "@/components/shared/PageHeader"
import { PageLoader } from "@/components/shared/PageLoader"
import { ErrorState } from "@/components/shared/ErrorState"
import { EmptyState } from "@/components/shared/EmptyState"
import { ConfirmDialog } from "@/components/shared/ConfirmDialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { formatDateTime, timeAgo } from "@/lib/format"
import type { Announcement } from "@/lib/types"

interface MentorBatchSummary {
  id: string
  name: string
  code: string
}

interface AnnouncementListItem extends Announcement {
  batch: { id: string; name: string } | null
}

const TARGETS = [
  { value: "ALL", label: "Everyone" },
  { value: "BATCH", label: "Specific batch" },
]

export function MentorAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<AnnouncementListItem[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<AnnouncementListItem | null>(null)
  const [deleting, setDeleting] = useState<AnnouncementListItem | null>(null)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const { data } = await api.get("/mentor/announcements?page=1&limit=50")
      setAnnouncements((data.data as AnnouncementListItem[]) ?? [])
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const deleteAnnouncement = async () => {
    if (!deleting) return
    try {
      await api.delete(`/mentor/announcements/${deleting.id}`)
      toast.success("Announcement deleted.")
      void load()
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setDeleting(null)
    }
  }

  if (loading && !announcements) return <PageLoader />
  if (error && !announcements) {
    return (
      <div className="space-y-6">
        <PageHeader title="Announcements" description="Broadcast updates to students." />
        <ErrorState message={error} onRetry={load} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Announcements"
        description="Broadcast updates to students."
        actions={
          <Button onClick={() => { setEditing(null); setFormOpen(true) }}>
            <Plus /> New announcement
          </Button>
        }
      />

      {announcements && announcements.length === 0 ? (
        <EmptyState
          icon={Megaphone}
          title="No announcements"
          description="Create your first announcement to share updates."
          action={
            <Button onClick={() => { setEditing(null); setFormOpen(true) }}>
              <Plus /> Create your first announcement
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {announcements?.map((announcement) => (
            <Card key={announcement.id} className="transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md">
              <CardContent className="space-y-3 p-6">
                <div className="flex items-start justify-between gap-2">
                  <p className="truncate font-medium">{announcement.title}</p>
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={<Button variant="ghost" size="icon-sm" aria-label="Actions" />}
                    >
                      <MoreHorizontal />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => { setEditing(announcement); setFormOpen(true) }}
                      >
                        <Pencil /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem variant="destructive" onClick={() => setDeleting(announcement)}>
                        <Trash2 /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <p className="line-clamp-3 text-sm text-muted-foreground">
                  {announcement.content}
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline">
                    {announcement.target === "BATCH" && announcement.batch
                      ? announcement.batch.name
                      : announcement.target === "BATCH"
                        ? "Batch"
                        : "Everyone"}
                  </Badge>
                  {announcement.scheduledAt && !announcement.publishedAt ? (
                    <Badge variant="outline" className="border-amber-500/30 bg-amber-500/15 text-amber-700 dark:text-amber-400">
                      <Clock /> Scheduled
                    </Badge>
                  ) : (
                    <Badge variant="secondary">Published</Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {announcement.publishedAt
                    ? `${formatDateTime(announcement.publishedAt)} · ${timeAgo(announcement.publishedAt)}`
                    : "Not published yet"}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AnnouncementFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        announcement={editing}
        onSaved={load}
      />

      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => { if (!open) setDeleting(null) }}
        title="Delete announcement"
        description={
          deleting ? `Delete "${deleting.title}"? This action cannot be undone.` : undefined
        }
        confirmLabel="Delete"
        destructive
        onConfirm={deleteAnnouncement}
      />
    </div>
  )
}

interface AnnouncementFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  announcement: AnnouncementListItem | null
  onSaved: () => void
}

function AnnouncementFormDialog({
  open,
  onOpenChange,
  announcement,
  onSaved,
}: AnnouncementFormDialogProps) {
  const isEdit = Boolean(announcement)
  const [batches, setBatches] = useState<MentorBatchSummary[]>([])
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [target, setTarget] = useState("ALL")
  const [batchId, setBatchId] = useState("")
  const [scheduledAt, setScheduledAt] = useState("")
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    api
      .get("/mentor/batches")
      .then(({ data }) => setBatches((data.data as MentorBatchSummary[]) ?? []))
      .catch(() => setBatches([]))
  }, [])

  useEffect(() => {
    if (!open) return
    setTitle(announcement?.title ?? "")
    setContent(announcement?.content ?? "")
    setTarget(announcement?.target ?? "ALL")
    setBatchId(announcement?.batchId ?? "")
    setScheduledAt(announcement?.scheduledAt ? announcement.scheduledAt.slice(0, 16) : "")
  }, [open, announcement])

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) {
      toast.error("Title and content are required.")
      return
    }
    if (target === "BATCH" && !batchId) {
      toast.error("Select a batch.")
      return
    }
    setSubmitting(true)
    try {
      const payload = {
        title,
        content,
        target,
        ...(target === "BATCH" ? { batchId } : {}),
        ...(scheduledAt ? { scheduledAt } : {}),
      }
      if (isEdit) {
        await api.patch(`/mentor/announcements/${announcement!.id}`, payload)
        toast.success("Announcement updated.")
      } else {
        await api.post("/mentor/announcements", payload)
        toast.success("Announcement created.")
      }
      onOpenChange(false)
      onSaved()
    } catch (error) {
      toast.error(getErrorMessage(error))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Announcement" : "New Announcement"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Audience</Label>
            <Select value={target} onValueChange={(v) => setTarget(v ?? "ALL")}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TARGETS.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {target === "BATCH" ? (
            <div className="space-y-2">
              <Label>Batch</Label>
              <Select value={batchId} onValueChange={(v) => setBatchId(v ?? "")}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select batch" />
                </SelectTrigger>
                <SelectContent>
                  {batches.map((batch) => (
                    <SelectItem key={batch.id} value={batch.id}>
                      {batch.name} ({batch.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}
          <div className="space-y-2">
            <Label htmlFor="scheduled">Schedule (optional)</Label>
            <Input
              id="scheduled"
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="content">Content</Label>
            <Textarea
              id="content"
              rows={5}
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Saving..." : isEdit ? "Save changes" : "Publish announcement"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
