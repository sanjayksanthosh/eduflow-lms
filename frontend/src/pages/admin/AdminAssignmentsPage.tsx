import { useEffect, useMemo, useState } from "react"
import { MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { api, getErrorMessage } from "@/lib/api"
import { useListData } from "@/hooks/useListData"
import { PageHeader } from "@/components/shared/PageHeader"
import { DataTable, type Column } from "@/components/shared/DataTable"
import { Pagination } from "@/components/shared/Pagination"
import { ConfirmDialog } from "@/components/shared/ConfirmDialog"
import { StatusBadge } from "@/components/shared/StatusBadge"
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
import { formatDate } from "@/lib/format"
import type { Assignment, Batch } from "@/lib/types"

const PAGE_SIZE = 10

interface AssignmentFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  assignment: Assignment | null
  batches: Batch[]
  onSaved: () => void
}

function AssignmentFormDialog({ open, onOpenChange, assignment, batches, onSaved }: AssignmentFormDialogProps) {
  const isEdit = Boolean(assignment)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [instructions, setInstructions] = useState("")
  const [batchId, setBatchId] = useState("")
  const [maxMarks, setMaxMarks] = useState("100")
  const [dueDate, setDueDate] = useState("")
  const [lateAllowed, setLateAllowed] = useState(false)
  const [status, setStatus] = useState("PUBLISHED")
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!open) return
    setTitle(assignment?.title ?? "")
    setDescription(assignment?.description ?? "")
    setInstructions(assignment?.instructions ?? "")
    setBatchId(assignment?.batchId ?? "")
    setMaxMarks(assignment ? String(assignment.maxMarks) : "100")
    setDueDate(assignment?.dueDate ? assignment.dueDate.slice(0, 10) : "")
    setLateAllowed(assignment?.lateSubmissionAllowed ?? false)
    setStatus(assignment?.status ?? "PUBLISHED")
  }, [open, assignment])

  const handleSubmit = async () => {
    if (!title.trim() || !batchId || !dueDate) {
      toast.error("Title, batch and due date are required.")
      return
    }
    setSubmitting(true)
    try {
      const payload = {
        title,
        batchId,
        maxMarks: Number(maxMarks) || 100,
        dueDate,
        lateSubmissionAllowed: lateAllowed,
        status,
        ...(description.trim() ? { description } : {}),
        ...(instructions.trim() ? { instructions } : {}),
      }
      if (isEdit) {
        await api.patch(`/admin/assignments/${assignment!.id}`, payload)
        toast.success("Assignment updated.")
      } else {
        await api.post("/admin/assignments", payload)
        toast.success("Assignment created.")
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
          <DialogTitle>{isEdit ? "Edit Assignment" : "Create Assignment"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
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
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v ?? "PUBLISHED")}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="PUBLISHED">Published</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="due">Due date</Label>
              <Input
                id="due"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="marks">Max marks</Label>
              <Input
                id="marks"
                type="number"
                min={1}
                value={maxMarks}
                onChange={(e) => setMaxMarks(e.target.value)}
              />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="size-4 accent-primary"
              checked={lateAllowed}
              onChange={(e) => setLateAllowed(e.target.checked)}
            />
            Allow late submissions
          </label>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="instructions">Instructions</Label>
            <Textarea
              id="instructions"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Saving..." : isEdit ? "Save changes" : "Create assignment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function AdminAssignmentsPage() {
  const [page, setPage] = useState(1)
  const [batchId, setBatchId] = useState("")
  const [status, setStatus] = useState("")

  const [formOpen, setFormOpen] = useState(false)
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null)
  const [deletingAssignment, setDeletingAssignment] = useState<Assignment | null>(null)

  const batches = useListData<Batch>("/admin/batches?page=1&limit=100&status=ACTIVE", [])

  const query = useMemo(() => {
    const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) })
    if (batchId) params.set("batchId", batchId)
    if (status) params.set("status", status)
    return `/admin/assignments?${params.toString()}`
  }, [page, batchId, status])

  const { data: assignments, meta, loading, error, refetch } = useListData<Assignment>(query)

  const deleteAssignment = async () => {
    if (!deletingAssignment) return
    try {
      await api.delete(`/admin/assignments/${deletingAssignment.id}`)
      toast.success("Assignment deleted.")
      refetch()
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setDeletingAssignment(null)
    }
  }

  const columns: Column<Assignment>[] = [
    {
      key: "title",
      header: "Assignment",
      cell: (a) => (
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{a.title}</p>
          <p className="truncate text-xs text-muted-foreground">
            Due {formatDate(a.dueDate)}
          </p>
        </div>
      ),
    },
    {
      key: "batch",
      header: "Batch",
      cell: (a) => (
        <Badge variant="outline">
          {a.batch.name} ({a.batch.code})
        </Badge>
      ),
    },
    {
      key: "course",
      header: "Course",
      cell: (a) => <span className="text-sm">{a.course.title}</span>,
    },
    {
      key: "submissions",
      header: "Submissions",
      cell: (a) => (
        <span className="text-sm">
          {a.submissionStats.submitted}/{a.submissionStats.total}{" "}
          <span className="text-xs text-muted-foreground">
            · {a.submissionStats.averageMarks} avg
          </span>
        </span>
      ),
    },
    {
      key: "marks",
      header: "Marks",
      cell: (a) => <span className="text-sm">{a.maxMarks}</span>,
    },
    {
      key: "status",
      header: "Status",
      cell: (a) => <StatusBadge status={a.status} />,
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
                setEditingAssignment(a)
                setFormOpen(true)
              }}
            >
              <Pencil /> Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={() => setDeletingAssignment(a)}>
              <Trash2 /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]

  if (error && assignments.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Assignments"
          description="Create and manage assignments for batches."
          actions={
            <Button onClick={() => setFormOpen(true)}>
              <Plus /> Create assignment
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
        title="Assignments"
        description="Create and manage assignments for batches."
        actions={
          <Button
            onClick={() => {
              setEditingAssignment(null)
              setFormOpen(true)
            }}
          >
            <Plus /> Create assignment
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <Select value={batchId} onValueChange={(v) => { setBatchId(v ?? ""); setPage(1) }}>
          <SelectTrigger>
            <SelectValue placeholder="Batch" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All batches</SelectItem>
            {batches.data.map((batch) => (
              <SelectItem key={batch.id} value={batch.id}>
                {batch.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={(v) => { setStatus(v ?? ""); setPage(1) }}>
          <SelectTrigger>
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All statuses</SelectItem>
            <SelectItem value="DRAFT">Draft</SelectItem>
            <SelectItem value="PUBLISHED">Published</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DataTable
        columns={columns}
        data={assignments}
        keyExtractor={(a) => a.id}
        loading={loading}
        emptyMessage="No assignments found."
        emptyAction={
          <Button variant="outline" onClick={() => { setEditingAssignment(null); setFormOpen(true) }}>
            <Plus /> Create your first assignment
          </Button>
        }
      />

      <Pagination meta={meta} onPageChange={setPage} />

      <AssignmentFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        assignment={editingAssignment}
        batches={batches.data}
        onSaved={refetch}
      />

      <ConfirmDialog
        open={Boolean(deletingAssignment)}
        onOpenChange={(open) => { if (!open) setDeletingAssignment(null) }}
        title="Delete assignment"
        description={
          deletingAssignment
            ? `Delete "${deletingAssignment.title}"? Its submissions will be removed. This action cannot be undone.`
            : undefined
        }
        confirmLabel="Delete"
        destructive
        onConfirm={deleteAssignment}
      />
    </div>
  )
}
