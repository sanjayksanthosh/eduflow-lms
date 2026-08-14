import { useEffect, useState } from "react"
import { Users, BookOpen, ClipboardList } from "lucide-react"
import { toast } from "sonner"
import { api, getErrorMessage } from "@/lib/api"
import { PageHeader } from "@/components/shared/PageHeader"
import { PageLoader } from "@/components/shared/PageLoader"
import { ErrorState } from "@/components/shared/ErrorState"
import { EmptyState } from "@/components/shared/EmptyState"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { formatDate, getInitials, fullName } from "@/lib/format"
import type { BatchDetail } from "@/lib/types"

interface MentorBatch {
  id: string
  name: string
  code: string
  description: string | null
  startDate: string | null
  endDate: string | null
  status: string
  course: { id: string; title: string; code: string; color: string | null }
  _count: { students: number; assignments: number }
}

export function MentorBatchesPage() {
  const [batches, setBatches] = useState<MentorBatch[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [detailId, setDetailId] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const { data } = await api.get("/mentor/batches")
      setBatches(data.data as MentorBatch[])
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  if (loading && !batches) return <PageLoader />
  if (error && !batches) {
    return (
      <div className="space-y-6">
        <PageHeader title="My Batches" description="Batches assigned to you." />
        <ErrorState message={error} onRetry={load} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader title="My Batches" description="Batches assigned to you." />

      {batches && batches.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No batches yet"
          description="Batches assigned to you will appear here."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {batches?.map((batch) => (
            <Card key={batch.id} className="transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md">
              <CardContent className="space-y-4 p-6">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex size-11 shrink-0 items-center justify-center rounded-lg text-sm font-semibold text-white"
                      style={{ background: batch.course.color ?? "#6366f1" }}
                    >
                      {batch.code.slice(0, 3).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-medium">{batch.name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {batch.course.title}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline">{batch.status}</Badge>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Users className="size-4" /> {batch._count.students} students
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <ClipboardList className="size-4" /> {batch._count.assignments} assignments
                  </div>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs text-muted-foreground">
                    {batch.startDate ? `Starts ${formatDate(batch.startDate)}` : "No start date"}
                  </span>
                  <Button variant="outline" size="sm" onClick={() => setDetailId(batch.id)}>
                    View students
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <BatchDetailDialog batchId={detailId} onClose={() => setDetailId(null)} />
    </div>
  )
}

function BatchDetailDialog({ batchId, onClose }: { batchId: string | null; onClose: () => void }) {
  const [batch, setBatch] = useState<BatchDetail | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!batchId) return
    setBatch(null)
    setLoading(true)
    api
      .get(`/mentor/batches/${batchId}`)
      .then(({ data }) => setBatch(data.data as BatchDetail))
      .catch((err) => toast.error(getErrorMessage(err)))
      .finally(() => setLoading(false))
  }, [batchId])

  return (
    <Dialog open={Boolean(batchId)} onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{batch ? `${batch.name} · Students` : "Batch"}</DialogTitle>
        </DialogHeader>
        {loading ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Loading...</p>
        ) : batch ? (
          batch.students.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No students in this batch yet.
            </p>
          ) : (
            <ul className="divide-y">
              {batch.students.map((student) => (
                <li key={student.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar size="sm">
                      <AvatarImage
                        src={student.user.profileImage ?? undefined}
                        alt={fullName(student.user.firstName, student.user.lastName)}
                      />
                      <AvatarFallback>
                        {getInitials(student.user.firstName, student.user.lastName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {fullName(student.user.firstName, student.user.lastName)}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {student.user.email}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline">{student.admissionNumber}</Badge>
                </li>
              ))}
            </ul>
          )
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
