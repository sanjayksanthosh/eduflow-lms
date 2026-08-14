import { useEffect, useRef, useState } from "react"
import { CalendarDays, ClipboardList, FileText, Paperclip, Upload } from "lucide-react"
import { toast } from "sonner"
import { api, getErrorMessage } from "@/lib/api"
import { PageHeader } from "@/components/shared/PageHeader"
import { PageLoader } from "@/components/shared/PageLoader"
import { ErrorState } from "@/components/shared/ErrorState"
import { EmptyState } from "@/components/shared/EmptyState"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { formatDate, formatDateTime, timeAgo } from "@/lib/format"

interface StudentSubmission {
  id: string
  content: string | null
  fileUrl: string | null
  fileName: string | null
  status: string
  marks: number | null
  feedback: string | null
  submittedAt: string
  isLate: boolean
}

interface StudentAssignment {
  id: string
  title: string
  description: string | null
  instructions: string | null
  maxMarks: number
  dueDate: string
  lateSubmissionAllowed: boolean
  status: string
  attachmentUrl: string | null
  attachmentName: string | null
  batch: { id: string; name: string }
  course: { id: string; title: string } | null
  mySubmission: StudentSubmission | null
}

const submissionBadge = (submission: StudentSubmission | null) => {
  if (!submission) return <Badge variant="secondary">Pending</Badge>
  if (submission.marks !== null) return <Badge>Graded · {submission.marks}</Badge>
  if (submission.isLate) return <Badge className="border-amber-500/30 bg-amber-500/15 text-amber-700 dark:text-amber-400">Late</Badge>
  return <Badge className="border-emerald-500/30 bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">Submitted</Badge>
}

export function StudentAssignmentsPage() {
  const [assignments, setAssignments] = useState<StudentAssignment[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [detailId, setDetailId] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const { data } = await api.get("/student/assignments")
      setAssignments(data.data as StudentAssignment[])
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  if (loading && !assignments) return <PageLoader />
  if (error && !assignments) {
    return (
      <div className="space-y-6">
        <PageHeader title="Assignments" description="Your assignments and submissions." />
        <ErrorState message={error} onRetry={load} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Assignments" description="Your assignments and submissions." />

      {assignments && assignments.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No assignments"
          description="Assignments published for your batch will appear here."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {assignments?.map((assignment) => (
            <Card
              key={assignment.id}
              className="transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
            >
              <CardContent className="space-y-4 p-6">
                <div className="flex items-start justify-between gap-3">
                  <p className="font-medium leading-snug">{assignment.title}</p>
                  {submissionBadge(assignment.mySubmission)}
                </div>
                <div className="space-y-1.5 text-sm text-muted-foreground">
                  <p className="truncate">
                    {assignment.course ? assignment.course.title : assignment.batch.name}
                  </p>
                  <div className="flex items-center gap-2">
                    <CalendarDays className="size-4" />
                    <span>Due {formatDate(assignment.dueDate)}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <Badge variant="outline">{assignment.maxMarks} marks</Badge>
                  <Button variant="outline" size="sm" onClick={() => setDetailId(assignment.id)}>
                    {assignment.mySubmission ? "View submission" : "Submit"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AssignmentDialog assignmentId={detailId} onClose={() => setDetailId(null)} onSaved={load} />
    </div>
  )
}

function AssignmentDialog({
  assignmentId,
  onClose,
  onSaved,
}: {
  assignmentId: string | null
  onClose: () => void
  onSaved: () => void
}) {
  const [assignment, setAssignment] = useState<StudentAssignment | null>(null)
  const [loading, setLoading] = useState(false)
  const [content, setContent] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!assignmentId) return
    setAssignment(null)
    setContent("")
    setFile(null)
    setLoading(true)
    api
      .get(`/student/assignments/${assignmentId}`)
      .then(({ data }) => setAssignment(data.data as StudentAssignment))
      .catch((err) => toast.error(getErrorMessage(err)))
      .finally(() => setLoading(false))
  }, [assignmentId])

  const submit = async () => {
    if (!assignment) return
    if (!content.trim() && !file) {
      toast.error("Add some content or attach a file before submitting.")
      return
    }
    setSaving(true)
    try {
      const form = new FormData()
      if (content.trim()) form.append("content", content.trim())
      if (file) form.append("file", file)
      await api.post(`/student/assignments/${assignment.id}/submit`, form)
      toast.success("Submission saved")
      onSaved()
      onClose()
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const canSubmit = assignment?.status === "PUBLISHED"

  return (
    <Dialog open={Boolean(assignmentId)} onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{assignment ? assignment.title : "Assignment"}</DialogTitle>
        </DialogHeader>
        {loading ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Loading...</p>
        ) : assignment ? (
          <div className="space-y-4">
            <div className="space-y-2 text-sm">
              <p className="text-muted-foreground">{assignment.description ?? "No description."}</p>
              {assignment.instructions ? (
                <div className="rounded-lg bg-muted p-3">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Instructions
                  </p>
                  <p className="whitespace-pre-wrap text-sm">{assignment.instructions}</p>
                </div>
              ) : null}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <span>Due {formatDateTime(assignment.dueDate)}</span>
                <span>Max marks {assignment.maxMarks}</span>
                {assignment.lateSubmissionAllowed ? <span>Late submissions allowed</span> : null}
                {assignment.attachmentUrl ? (
                  <a
                    className="inline-flex items-center gap-1 text-primary hover:underline"
                    href={assignment.attachmentUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <Paperclip className="size-3.5" />
                    {assignment.attachmentName ?? "Attachment"}
                  </a>
                ) : null}
              </div>
            </div>

            {assignment.mySubmission ? (
              <div className="rounded-lg border p-3">
                <p className="mb-2 text-sm font-medium">My submission</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Badge variant="outline">{assignment.mySubmission.status}</Badge>
                  <span>{timeAgo(assignment.mySubmission.submittedAt)}</span>
                  {assignment.mySubmission.isLate ? <span>· Late</span> : null}
                </div>
                {assignment.mySubmission.content ? (
                  <p className="mt-2 whitespace-pre-wrap text-sm">{assignment.mySubmission.content}</p>
                ) : null}
                {assignment.mySubmission.fileUrl ? (
                  <a
                    className="mt-2 inline-flex items-center gap-1 text-sm text-primary hover:underline"
                    href={assignment.mySubmission.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <FileText className="size-4" />
                    {assignment.mySubmission.fileName ?? "Download"}
                  </a>
                ) : null}
                {assignment.mySubmission.marks !== null ? (
                  <div className="mt-2 rounded-lg bg-muted p-3">
                    <p className="text-sm font-medium">
                      Marks: {assignment.mySubmission.marks}/{assignment.maxMarks}
                    </p>
                    {assignment.mySubmission.feedback ? (
                      <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">
                        {assignment.mySubmission.feedback}
                      </p>
                    ) : null}
                  </div>
                ) : null}
              </div>
            ) : null}

            {canSubmit && !assignment.mySubmission ? (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="submit-content">Your answer</Label>
                  <Textarea
                    id="submit-content"
                    rows={4}
                    placeholder="Type your answer here..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Attachment (optional)</Label>
                  <input
                    ref={fileRef}
                    type="file"
                    className="hidden"
                    onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  />
                  <Button type="button" variant="outline" className="w-full" onClick={() => fileRef.current?.click()}>
                    <Upload className="size-4" />
                    {file ? file.name : "Choose a file"}
                  </Button>
                </div>
                <Button className="w-full" disabled={saving} onClick={submit}>
                  {saving ? "Submitting..." : "Submit assignment"}
                </Button>
              </div>
            ) : null}
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
