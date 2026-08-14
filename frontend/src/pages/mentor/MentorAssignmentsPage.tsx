import { useEffect, useState } from "react"
import { CheckCircle2, ClipboardList, MoreHorizontal, Pencil, Plus, Trash2, Eye } from "lucide-react"
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
import { Checkbox } from "@/components/ui/checkbox"
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
import { formatDate, formatDateTime, fullName } from "@/lib/format"
import type { Assignment } from "@/lib/types"

interface MentorBatchSummary {
  id: string
  name: string
  code: string
}

interface AssignmentListItem {
  id: string
  title: string
  description: string | null
  instructions: string | null
  batchId: string
  courseId: string
  dueDate: string | null
  status: string
  maxMarks: number
  lateSubmissionAllowed: boolean
  batch: { id: string; name: string; code: string }
  course: { id: string; title: string } | null
  _count: { submissions: number }
}

interface Submission {
  id: string
  assignmentId: string
  status: string
  content: string | null
  attachmentUrl: string | null
  attachmentName: string | null
  submittedAt: string
  marks: number | null
  feedback: string | null
  student: {
    id: string
    admissionNumber: string
    user: { firstName: string; lastName: string; email: string; profileImage: string | null }
  }
}

interface AssignmentDetail extends Assignment {
  maxMarks: number
  batch: { id: string; name: string; code: string }
  submissions: Submission[]
}

const SUBMISSION_STATUS: Record<string, { label: string; className: string }> = {
  SUBMITTED: { label: "Submitted", className: "border-blue-500/30 bg-blue-500/15 text-blue-700 dark:text-blue-400" },
  APPROVED: { label: "Approved", className: "border-emerald-500/30 bg-emerald-500/15 text-emerald-700 dark:text-emerald-400" },
  REJECTED: { label: "Rejected", className: "border-red-500/30 bg-red-500/15 text-red-700 dark:text-red-400" },
}

export function MentorAssignmentsPage() {
  const [assignments, setAssignments] = useState<AssignmentListItem[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<AssignmentListItem | null>(null)
  const [deleting, setDeleting] = useState<AssignmentListItem | null>(null)
  const [detailId, setDetailId] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const { data } = await api.get("/mentor/assignments")
      setAssignments((data.data as AssignmentListItem[]) ?? [])
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const deleteAssignment = async () => {
    if (!deleting) return
    try {
      await api.delete(`/mentor/assignments/${deleting.id}`)
      toast.success("Assignment deleted.")
      void load()
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setDeleting(null)
    }
  }

  if (loading && !assignments) return <PageLoader />
  if (error && !assignments) {
    return (
      <div className="space-y-6">
        <PageHeader title="Assignments" description="Create and manage assignments for your batches." />
        <ErrorState message={error} onRetry={load} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Assignments"
        description="Create and manage assignments for your batches."
        actions={
          <Button onClick={() => { setEditing(null); setFormOpen(true) }}>
            <Plus /> New assignment
          </Button>
        }
      />

      {assignments && assignments.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No assignments"
          description="Create your first assignment to get started."
          action={
            <Button onClick={() => { setEditing(null); setFormOpen(true) }}>
              <Plus /> Create your first assignment
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {assignments?.map((assignment) => (
            <Card key={assignment.id} className="transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md">
              <CardContent className="space-y-3 p-6">
                <div className="flex items-start justify-between gap-2">
                  <p className="truncate font-medium">{assignment.title}</p>
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={<Button variant="ghost" size="icon-sm" aria-label="Actions" />}
                    >
                      <MoreHorizontal />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setDetailId(assignment.id)}>
                        <Eye /> View submissions
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => { setEditing(assignment); setFormOpen(true) }}
                      >
                        <Pencil /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem variant="destructive" onClick={() => setDeleting(assignment)}>
                        <Trash2 /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="flex flex-wrap gap-1">
                  <Badge variant="outline">{assignment.batch.name}</Badge>
                  {assignment.course ? (
                    <Badge variant="secondary">{assignment.course.title}</Badge>
                  ) : null}
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                  <span>Due {formatDate(assignment.dueDate)}</span>
                  <span>{assignment._count.submissions} submissions</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AssignmentFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        assignment={editing}
        onSaved={load}
      />

      <SubmissionsDialog assignmentId={detailId} onClose={() => setDetailId(null)} onSaved={load} />

      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => { if (!open) setDeleting(null) }}
        title="Delete assignment"
        description={
          deleting ? `Delete "${deleting.title}"? This action cannot be undone.` : undefined
        }
        confirmLabel="Delete"
        destructive
        onConfirm={deleteAssignment}
      />
    </div>
  )
}

interface AssignmentFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  assignment: AssignmentListItem | null
  onSaved: () => void
}

function AssignmentFormDialog({ open, onOpenChange, assignment, onSaved }: AssignmentFormDialogProps) {
  const isEdit = Boolean(assignment)
  const [batches, setBatches] = useState<MentorBatchSummary[]>([])
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [instructions, setInstructions] = useState("")
  const [maxMarks, setMaxMarks] = useState("100")
  const [dueDate, setDueDate] = useState("")
  const [lateSubmission, setLateSubmission] = useState(false)
  const [batchId, setBatchId] = useState("")
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    api
      .get("/mentor/batches")
      .then(({ data }) => setBatches((data.data as MentorBatchSummary[]) ?? []))
      .catch(() => setBatches([]))
  }, [])

  useEffect(() => {
    if (!open) return
    setTitle(assignment?.title ?? "")
    setDescription(assignment?.description ?? "")
    setInstructions(assignment?.instructions ?? "")
    setMaxMarks(assignment ? String(assignment.maxMarks) : "100")
    setDueDate(assignment?.dueDate ? assignment.dueDate.slice(0, 16) : "")
    setLateSubmission(Boolean(assignment?.lateSubmissionAllowed))
    setBatchId(assignment?.batchId ?? "")
  }, [open, assignment])

  const handleSubmit = async () => {
    if (!title.trim() || !dueDate) {
      toast.error("Title and due date are required.")
      return
    }
    if (!batchId) {
      toast.error("Select a batch.")
      return
    }
    setSubmitting(true)
    try {
      const payload = {
        title,
        description: description.trim() || undefined,
        instructions: instructions.trim() || undefined,
        maxMarks: Number(maxMarks) || 100,
        dueDate,
        lateSubmissionAllowed: lateSubmission,
        batchId,
      }
      if (isEdit) {
        await api.patch(`/mentor/assignments/${assignment!.id}`, payload)
        toast.success("Assignment updated.")
      } else {
        await api.post("/mentor/assignments", payload)
        toast.success("Assignment published.")
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
          <DialogTitle>{isEdit ? "Edit Assignment" : "New Assignment"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="batch">Batch</Label>
              <Select value={batchId} onValueChange={(v) => setBatchId(v ?? "")}>
                <SelectTrigger id="batch">
                  <SelectValue placeholder="Select batch" />
                </SelectTrigger>
                <SelectContent>
                  {batches.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name} ({b.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="dueDate">Due date</Label>
              <Input
                id="dueDate"
                type="datetime-local"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="maxMarks">Max marks</Label>
              <Input
                id="maxMarks"
                type="number"
                min={1}
                value={maxMarks}
                onChange={(e) => setMaxMarks(e.target.value)}
              />
            </div>
            <div className="flex items-end pb-1">
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={lateSubmission}
                  onCheckedChange={(checked) => setLateSubmission(Boolean(checked))}
                />
                Allow late submissions
              </label>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="instructions">Instructions</Label>
            <Textarea
              id="instructions"
              rows={3}
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
            {submitting ? "Saving..." : isEdit ? "Save changes" : "Publish assignment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

interface SubmissionsDialogProps {
  assignmentId: string | null
  onClose: () => void
  onSaved: () => void
}

function SubmissionsDialog({ assignmentId, onClose, onSaved }: SubmissionsDialogProps) {
  const [detail, setDetail] = useState<AssignmentDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [grading, setGrading] = useState<Submission | null>(null)

  useEffect(() => {
    if (!assignmentId) return
    setDetail(null)
    setLoading(true)
    api
      .get(`/mentor/assignments/${assignmentId}`)
      .then(({ data }) => setDetail(data.data as AssignmentDetail))
      .catch((err) => toast.error(getErrorMessage(err)))
      .finally(() => setLoading(false))
  }, [assignmentId])

  const onGraded = () => {
    setGrading(null)
    if (assignmentId) {
      api
        .get(`/mentor/assignments/${assignmentId}`)
        .then(({ data }) => setDetail(data.data as AssignmentDetail))
        .catch(() => undefined)
    }
    onSaved()
  }

  const statusLabel = (status: string) => SUBMISSION_STATUS[status]?.label ?? status
  const statusClass = (status: string) => SUBMISSION_STATUS[status]?.className ?? ""

  return (
    <Dialog open={Boolean(assignmentId)} onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {detail ? `${detail.title} · Submissions` : "Submissions"}
          </DialogTitle>
        </DialogHeader>
        {loading ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Loading...</p>
        ) : detail ? (
          detail.submissions.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No submissions yet.
            </p>
          ) : (
            <ul className="divide-y">
              {detail.submissions.map((submission) => (
                <li key={submission.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {fullName(submission.student.user.firstName, submission.student.user.lastName)}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      Submitted {formatDateTime(submission.submittedAt)}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Badge variant="outline" className={statusClass(submission.status)}>
                      {statusLabel(submission.status)}
                    </Badge>
                    {submission.marks != null ? (
                      <Badge variant="secondary">{submission.marks}/{detail.maxMarks}</Badge>
                    ) : null}
                    {submission.status === "SUBMITTED" ? (
                      <Button size="sm" variant="outline" onClick={() => setGrading(submission)}>
                        <CheckCircle2 /> Grade
                      </Button>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )
        ) : null}
      </DialogContent>

      <GradeDialog
        submission={grading}
        maxMarks={detail?.maxMarks ?? 100}
        onClose={() => setGrading(null)}
        onGraded={onGraded}
      />
    </Dialog>
  )
}

interface GradeDialogProps {
  submission: Submission | null
  maxMarks: number
  onClose: () => void
  onGraded: () => void
}

function GradeDialog({ submission, maxMarks, onClose, onGraded }: GradeDialogProps) {
  const [marks, setMarks] = useState("")
  const [feedback, setFeedback] = useState("")
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!submission) return
    setMarks(submission.marks != null ? String(submission.marks) : "")
    setFeedback(submission.feedback ?? "")
  }, [submission])

  const handleSubmit = async () => {
    if (!submission) return
    const value = Number(marks)
    if (Number.isNaN(value) || value < 0 || value > maxMarks) {
      toast.error(`Marks must be between 0 and ${maxMarks}.`)
      return
    }
    setSubmitting(true)
    try {
      await api.post(
        `/mentor/assignments/${submission.assignmentId}/submissions/${submission.id}/grade`,
        { marks: value, feedback: feedback.trim() || undefined, status: "APPROVED" }
      )
      toast.success("Submission graded.")
      onGraded()
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={Boolean(submission)} onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Grade submission</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="space-y-2">
            <Label htmlFor="marks">Marks (max {maxMarks})</Label>
            <Input
              id="marks"
              type="number"
              min={0}
              max={maxMarks}
              value={marks}
              onChange={(e) => setMarks(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="feedback">Feedback</Label>
            <Textarea
              id="feedback"
              rows={3}
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Saving..." : "Submit grade"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
