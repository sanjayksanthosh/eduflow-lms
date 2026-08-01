import { useCallback, useEffect, useState } from "react"
import { CalendarCheck, Save } from "lucide-react"
import { toast } from "sonner"
import { api, getErrorMessage } from "@/lib/api"
import { useListData } from "@/hooks/useListData"
import { PageHeader } from "@/components/shared/PageHeader"
import { EmptyState } from "@/components/shared/EmptyState"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { formatDate, getInitials } from "@/lib/format"
import type { AttendanceSummary, Batch, BatchAttendance } from "@/lib/types"

const ATTENDANCE_STATUSES = ["PRESENT", "ABSENT", "LATE", "LEAVE"]

function todayLocalDate(): string {
  const d = new Date()
  const month = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${d.getFullYear()}-${month}-${day}`
}

export function AdminAttendancePage() {
  const [batchId, setBatchId] = useState("")
  const [date, setDate] = useState(todayLocalDate())
  const [summary, setSummary] = useState<AttendanceSummary | null>(null)
  const [data, setData] = useState<BatchAttendance | null>(null)
  const [loading, setLoading] = useState(false)
  const [statuses, setStatuses] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  const batches = useListData<Batch>("/admin/batches?page=1&limit=100&status=ACTIVE", [])

  const load = useCallback(async () => {
    if (!batchId) return
    setLoading(true)
    try {
      const params = new URLSearchParams({ batchId })
      if (date) params.set("date", date)
      const { data: res } = await api.get(`/admin/attendance?${params.toString()}`)
      const result = res.data as BatchAttendance
      setData(result)
      const initial: Record<string, string> = {}
      result.students.forEach((student) => {
        initial[student.id] = student.attendance?.status ?? "PRESENT"
      })
      setStatuses(initial)
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [batchId, date])

  const loadSummary = useCallback(async () => {
    try {
      const { data: res } = await api.get("/admin/attendance")
      setSummary(res.data as AttendanceSummary)
    } catch {
      setSummary(null)
    }
  }, [])

  useEffect(() => {
    loadSummary()
  }, [loadSummary])

  useEffect(() => {
    if (batchId) {
      load()
    } else {
      setData(null)
    }
  }, [batchId, date, load])

  const save = async () => {
    if (!batchId || !data) return
    setSaving(true)
    try {
      await api.post("/admin/attendance", {
        batchId,
        date,
        records: data.students.map((student) => ({
          studentId: student.id,
          status: statuses[student.id] ?? "PRESENT",
        })),
      })
      toast.success("Attendance saved.")
      await load()
      await loadSummary()
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const counts = data
    ? data.students.reduce<Record<string, number>>((acc, student) => {
        const status = statuses[student.id] ?? student.attendance?.status ?? "PRESENT"
        acc[status] = (acc[status] ?? 0) + 1
        return acc
      }, {})
    : null

  return (
    <div className="space-y-6">
      <PageHeader
        title="Attendance"
        description="Record and review attendance for batches."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <CalendarCheck className="size-4 text-muted-foreground" />
              Today's attendance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {summary ? (
              <>
                <p className="text-2xl font-semibold">
                  {summary.marked} <span className="text-sm font-normal text-muted-foreground">of {summary.total} marked</span>
                </p>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${summary.percent}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">{summary.percent}% covered</p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Loading summary...</p>
            )}
          </CardContent>
        </Card>

        <Card className="sm:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm">Select batch & date</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap items-end gap-3">
            <div className="w-64 space-y-2">
              <Label>Batch</Label>
              <Select value={batchId} onValueChange={(v) => setBatchId(v ?? "")}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select batch" />
                </SelectTrigger>
                <SelectContent>
                  {batches.data.map((batch) => (
                    <SelectItem key={batch.id} value={batch.id}>
                      {batch.name} ({batch.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            {counts ? (
              <div className="flex flex-wrap gap-1 pb-0.5">
                {ATTENDANCE_STATUSES.map((status) =>
                  counts[status] ? (
                    <Badge key={status} variant="outline">
                      {status[0] + status.slice(1).toLowerCase()}: {counts[status]}
                    </Badge>
                  ) : null
                )}
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>

      {!batchId ? (
        <EmptyState
          icon={CalendarCheck}
          title="Select a batch"
          description="Choose a batch and date above to record or review attendance."
        />
      ) : loading && !data ? (
        <p className="py-12 text-center text-sm text-muted-foreground">Loading attendance...</p>
      ) : data ? (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-sm font-medium">
                {data.batch.name} <span className="text-muted-foreground">({data.batch.code})</span>
              </p>
              <p className="text-xs text-muted-foreground">
                {data.students.length} students · {formatDate(data.date)}
                {data.marked ? " · Already marked" : " · Not marked yet"}
              </p>
            </div>
            <Button onClick={save} disabled={saving}>
              <Save /> {saving ? "Saving..." : data.marked ? "Update attendance" : "Save attendance"}
            </Button>
          </div>

          <div className="overflow-hidden rounded-lg border">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50">
                  <th className="px-3 py-2 text-left font-medium">Student</th>
                  <th className="px-3 py-2 text-left font-medium">Admission</th>
                  <th className="px-3 py-2 text-left font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {data.students.map((student) => (
                  <tr key={student.id}>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <Avatar className="size-7">
                          <AvatarImage src={student.profileImage ?? undefined} />
                          <AvatarFallback className="text-xs">
                            {getInitials(...student.name.split(" "))}
                          </AvatarFallback>
                        </Avatar>
                        <span className="truncate">{student.name}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {student.admissionNumber}
                    </td>
                    <td className="px-3 py-2">
                      <Select
                        value={statuses[student.id] ?? "PRESENT"}
                        onValueChange={(value) =>
                          setStatuses((prev) => ({ ...prev, [student.id]: value ?? "PRESENT" }))
                        }
                      >
                        <SelectTrigger className="w-36">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ATTENDANCE_STATUSES.map((status) => (
                            <SelectItem key={status} value={status}>
                              {status[0] + status.slice(1).toLowerCase()}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  )
}
