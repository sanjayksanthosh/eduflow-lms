import { useEffect, useMemo, useState } from "react"
import { Clock, MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { api, getErrorMessage } from "@/lib/api"
import { useListData } from "@/hooks/useListData"
import { PageHeader } from "@/components/shared/PageHeader"
import { DataTable, type Column } from "@/components/shared/DataTable"
import { Pagination } from "@/components/shared/Pagination"
import { ConfirmDialog } from "@/components/shared/ConfirmDialog"
import { ErrorState } from "@/components/shared/ErrorState"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
import { formatDateTime, fullName } from "@/lib/format"
import type { Announcement, Batch, Student } from "@/lib/types"

const PAGE_SIZE = 10

const TARGETS: { value: string; label: string }[] = [
  { value: "ALL", label: "Everyone" },
  { value: "BATCH", label: "Specific batch" },
  { value: "STUDENT", label: "Specific student" },
]

interface AnnouncementFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  announcement: Announcement | null
  batches: Batch[]
  students: Student[]
  onSaved: () => void
}

function AnnouncementFormDialog({
  open,
  onOpenChange,
  announcement,
  batches,
  students,
  onSaved,
}: AnnouncementFormDialogProps) {
  const isEdit = Boolean(announcement)
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [target, setTarget] = useState("ALL")
  const [batchId, setBatchId] = useState("")
  const [studentId, setStudentId] = useState("")
  const [scheduledAt, setScheduledAt] = useState("")
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!open) return
    setTitle(announcement?.title ?? "")
    setContent(announcement?.content ?? "")
    setTarget(announcement?.target ?? "ALL")
    setBatchId(announcement?.batchId ?? "")
    setStudentId(announcement?.studentId ?? "")
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
    if (target === "STUDENT" && !studentId) {
      toast.error("Select a student.")
      return
    }
    setSubmitting(true)
    try {
      const payload = {
        title,
        content,
        target,
        ...(target === "BATCH" ? { batchId } : {}),
        ...(target === "STUDENT" ? { studentId } : {}),
        ...(scheduledAt ? { scheduledAt } : {}),
      }
      if (isEdit) {
        await api.patch(`/admin/announcements/${announcement!.id}`, payload)
        toast.success("Announcement updated.")
      } else {
        await api.post("/admin/announcements", payload)
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
          {target === "STUDENT" ? (
            <div className="space-y-2">
              <Label>Student</Label>
              <Select value={studentId} onValueChange={(v) => setStudentId(v ?? "")}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select student" />
                </SelectTrigger>
                <SelectContent>
                  {students.map((student) => (
                    <SelectItem key={student.userId} value={student.userId}>
                      {fullName(student.user.firstName, student.user.lastName)}
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

export function AdminAnnouncementsPage() {
  const [page, setPage] = useState(1)
  const [target, setTarget] = useState("")

  const [formOpen, setFormOpen] = useState(false)
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null)
  const [deletingAnnouncement, setDeletingAnnouncement] = useState<Announcement | null>(null)

  const batches = useListData<Batch>("/admin/batches?page=1&limit=100&status=ACTIVE", [])
  const students = useListData<Student>("/admin/students?page=1&limit=100", [])

  const query = useMemo(() => {
    const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) })
    if (target) params.set("target", target)
    return `/admin/announcements?${params.toString()}`
  }, [page, target])

  const { data: announcements, meta, loading, error, refetch } =
    useListData<Announcement>(query)

  const deleteAnnouncement = async () => {
    if (!deletingAnnouncement) return
    try {
      await api.delete(`/admin/announcements/${deletingAnnouncement.id}`)
      toast.success("Announcement deleted.")
      refetch()
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setDeletingAnnouncement(null)
    }
  }

  const targetLabel = (value: string) => TARGETS.find((t) => t.value === value)?.label ?? value

  const columns: Column<Announcement>[] = [
    {
      key: "announcement",
      header: "Announcement",
      cell: (a) => (
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{a.title}</p>
          <p className="line-clamp-1 text-xs text-muted-foreground">{a.content}</p>
        </div>
      ),
    },
    {
      key: "audience",
      header: "Audience",
      cell: (a) => (
        <div className="flex flex-wrap gap-1">
          <Badge variant="outline">{targetLabel(a.target)}</Badge>
          {a.batch ? <Badge variant="secondary">{a.batch.name}</Badge> : null}
        </div>
      ),
    },
    {
      key: "author",
      header: "Author",
      cell: (a) => (
        <span className="text-sm">
          {fullName(a.author.firstName, a.author.lastName)}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (a) => {
        if (a.scheduledAt && !a.publishedAt) {
          return (
            <Badge variant="outline" className="border-amber-500/30 bg-amber-500/15 text-amber-700 dark:text-amber-400">
              <Clock /> Scheduled
            </Badge>
          )
        }
        if (!a.isActive) return <Badge variant="outline">Inactive</Badge>
        return (
          <Badge
            variant="outline"
            className="border-emerald-500/30 bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
          >
            Published
          </Badge>
        )
      },
    },
    {
      key: "published",
      header: "Published",
      cell: (a) => (
        <span className="text-sm">
          {a.publishedAt ? formatDateTime(a.publishedAt) : "—"}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      className: "w-12 text-right",
      cell: (a) => (
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label="Actions" />}>
            <MoreHorizontal />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => {
                setEditingAnnouncement(a)
                setFormOpen(true)
              }}
            >
              <Pencil /> Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={() => setDeletingAnnouncement(a)}>
              <Trash2 /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]

  if (error && announcements.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Announcements"
          description="Broadcast updates to students and mentors."
          actions={
            <Button onClick={() => setFormOpen(true)}>
              <Plus /> New announcement
            </Button>
          }
        />
        <ErrorState message={error} onRetry={refetch} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Announcements"
        description="Broadcast updates to students and mentors."
        actions={
          <Button
            onClick={() => {
              setEditingAnnouncement(null)
              setFormOpen(true)
            }}
          >
            <Plus /> New announcement
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <Select value={target} onValueChange={(v) => { setTarget(v ?? ""); setPage(1) }}>
          <SelectTrigger>
            <SelectValue placeholder="Audience" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All audiences</SelectItem>
            {TARGETS.map((t) => (
              <SelectItem key={t.value} value={t.value}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <DataTable
        columns={columns}
        data={announcements}
        keyExtractor={(a) => a.id}
        loading={loading}
        emptyMessage="No announcements found."
        emptyAction={
          <Button variant="outline" onClick={() => { setEditingAnnouncement(null); setFormOpen(true) }}>
            <Plus /> Create your first announcement
          </Button>
        }
      />

      <Pagination meta={meta} onPageChange={setPage} />

      <AnnouncementFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        announcement={editingAnnouncement}
        batches={batches.data}
        students={students.data}
        onSaved={refetch}
      />

      <ConfirmDialog
        open={Boolean(deletingAnnouncement)}
        onOpenChange={(open) => { if (!open) setDeletingAnnouncement(null) }}
        title="Delete announcement"
        description={
          deletingAnnouncement
            ? `Delete "${deletingAnnouncement.title}"? This action cannot be undone.`
            : undefined
        }
        confirmLabel="Delete"
        destructive
        onConfirm={deleteAnnouncement}
      />
    </div>
  )
}
