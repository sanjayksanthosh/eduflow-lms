import { useEffect, useState } from "react"
import { CalendarCheck, Save } from "lucide-react"
import { toast } from "sonner"
import { api, getErrorMessage } from "@/lib/api"
import { PageHeader } from "@/components/shared/PageHeader"
import { PageLoader } from "@/components/shared/PageLoader"
import { ErrorState } from "@/components/shared/ErrorState"
import { EmptyState } from "@/components/shared/EmptyState"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { getInitials } from "@/lib/format"
import type { BatchAttendance, BatchAttendanceStudent } from "@/lib/types"

interface MentorBatchSummary {
  id: string
  name: string
  code: string
  course: { id: string; title: string; color: string | null }
}

const STATUSES = [
  { value: "PRESENT", label: "Present", className: "border-emerald-500/30 bg-emerald-500/15 text-emerald-700 dark:text-emerald-400" },
  { value: "ABSENT", label: "Absent", className: "border-red-500/30 bg-red-500/15 text-red-700 dark:text-red-400" },
  { value: "LATE", label: "Late", className: "border-amber-500/30 bg-amber-500/15 text-amber-700 dark:text-amber-400" },
  { value: "LEAVE", label: "On leave", className: "border-blue-500/30 bg-blue-500/15 text-blue-700 dark:text-blue-400" },
]

const today = () => new Date().toISOString().slice(0, 10)

export function MentorAttendancePage() {
  const [batches, setBatches] = useState<MentorBatchSummary[]>([])
  const [batchId, setBatchId] = useState("")
  const [date, setDate] = useState(today)
  const [data, setData] = useState<BatchAttendance | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [statuses, setStatuses] = useState<Record<string, string>>({})

  useEffect(() => {
    api
      .get("/mentor/batches")
      .then(({ data: res }) => setBatches((res.data as MentorBatchSummary[]) ?? []))
      .catch(() => setBatches([]))
  }, [])

  const loadAttendance = async (id: string, d: string) => {
    if (!id || !d) return
    setLoading(true)
    setError(null)
    try {
      const { data: res } = await api.get(
        `/mentor/batches/${id}/attendance?date=${encodeURIComponent(d)}`
      )
      const payload = res.data as BatchAttendance
      setData(payload)
      setStatuses(
        Object.fromEntries(
          payload.students.map((s) => [s.id, s.attendance?.status ?? "PRESENT"])
        )
      )
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  const handleBatchChange = (value: string) => {
    setBatchId(value)
    setData(null)
    void loadAttendance(value, date)
  }

  const handleDateChange = (value: string) => {
    setDate(value)
    if (batchId) void loadAttendance(batchId, value)
  }

  const saveAttendance = async () => {
    if (!batchId || !data) return
    setSaving(true)
    try {
      const records = data.students.map((s) => ({
        studentId: s.id,
        status: statuses[s.id] ?? "PRESENT",
      }))
      await api.post(`/mentor/batches/${batchId}/attendance`, {
        batchId,
        date,
        records,
      })
      toast.success("Attendance saved.")
      void loadAttendance(batchId, date)
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const markedCount =
    data?.students.filter((s) => statuses[s.id] === "PRESENT").length ?? 0

  return (
    <div className="space-y-6">
      <PageHeader
        title="Attendance"
        description="Mark and review attendance for your batches."
      />

      <div className="flex flex-wrap items-end gap-4">
        <div className="grid gap-2">
          <Label htmlFor="batch">Batch</Label>
          <Select value={batchId} onValueChange={(v) => handleBatchChange(v ?? "")}>
            <SelectTrigger id="batch" className="w-64">
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
        <div className="grid gap-2">
          <Label htmlFor="date">Date</Label>
          <Input
            id="date"
            type="date"
            className="w-44"
            value={date}
            onChange={(e) => handleDateChange(e.target.value)}
          />
        </div>
      </div>

      {error && !data ? (
        <ErrorState message={error} onRetry={() => batchId && loadAttendance(batchId, date)} />
      ) : null}

      {loading && !data ? <PageLoader /> : null}

      {!batchId ? (
        <EmptyState
          icon={CalendarCheck}
          title="Select a batch"
          description="Choose a batch and date to mark attendance."
        />
      ) : data && data.students.length === 0 ? (
        <EmptyState
          icon={CalendarCheck}
          title="No students"
          description="This batch has no students yet."
        />
      ) : data ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{data.batch.name}</span>
              <span className="text-sm font-normal text-muted-foreground">
                {data.date} · {markedCount} present
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="divide-y">
              {data.students.map((student) => (
                <li key={student.id} className="flex items-center justify-between gap-3 py-3">
                  <StudentInfo student={student} />
                  <Select
                    value={statuses[student.id] ?? "PRESENT"}
                    onValueChange={(v) => setStatuses((prev) => ({ ...prev, [student.id]: v ?? "PRESENT" }))}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUSES.map((s) => (
                        <SelectItem key={s.value} value={s.value}>
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </li>
              ))}
            </ul>
            <div className="mt-4 flex justify-end">
              <Button onClick={saveAttendance} disabled={saving}>
                <Save /> {saving ? "Saving..." : data.marked ? "Update attendance" : "Save attendance"}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}

function StudentInfo({ student }: { student: BatchAttendanceStudent }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <Avatar size="sm">
        <AvatarImage src={student.profileImage ?? undefined} alt={student.name} />
        <AvatarFallback>{getInitials(...student.name.split(" "))}</AvatarFallback>
      </Avatar>
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{student.name}</p>
        <p className="truncate text-xs text-muted-foreground">
          {student.email}
        </p>
      </div>
    </div>
  )
}
