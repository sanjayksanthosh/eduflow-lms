import { useEffect, useState } from "react"
import { BarChart3, Download, FileSpreadsheet, FileText, Table2 } from "lucide-react"
import { toast } from "sonner"
import { api, getErrorMessage } from "@/lib/api"
import { PageHeader } from "@/components/shared/PageHeader"
import { PageLoader } from "@/components/shared/PageLoader"
import { ErrorState } from "@/components/shared/ErrorState"
import { EmptyState } from "@/components/shared/EmptyState"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatDate } from "@/lib/format"

interface BatchOption {
  id: string
  name: string
  code: string
}

interface AttendanceRow {
  date: string
  student: string
  batch: string
  status: string
  remarks: string
}

interface AttendanceReport {
  summary: Record<string, number>
  total: number
  rows: AttendanceRow[]
}

interface PerformanceRow {
  student: string
  email: string
  batch: string
  averageMarks: number
  assignmentsSubmitted: number
  attendancePercent: number
  totalAttendance: number
}

interface AssignmentRow {
  title: string
  batch: string
  maxMarks: number
  dueDate: string
  submissions: number
  graded: number
  averageMarks: number
}

interface BatchRow {
  name: string
  code: string
  course: string
  mentor: string
  status: string
  capacity: number
  students: number
  assignments: number
  attendancePercent: number
  averageMarks: number
}

interface MentorRow {
  name: string
  email: string
  department: string
  batches: string
  students: number
  assignmentsCreated: number
  submissionsGraded: number
  attendanceMarked: number
}

const statusBadge = (status: string) => {
  switch (status) {
    case "PRESENT":
      return <Badge className="border-emerald-500/30 bg-emerald-500/15 text-emerald-700">Present</Badge>
    case "LATE":
      return <Badge className="border-amber-500/30 bg-amber-500/15 text-amber-700">Late</Badge>
    case "ABSENT":
      return <Badge className="border-red-500/30 bg-red-500/15 text-red-700">Absent</Badge>
    case "LEAVE":
      return <Badge className="border-blue-500/30 bg-blue-500/15 text-blue-700">On leave</Badge>
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}

const percentColor = (value: number) => {
  if (value >= 80) return "text-emerald-600"
  if (value >= 60) return "text-amber-600"
  return "text-red-600"
}

function ExportButtons({ path, params }: { path: string; params: Record<string, string> }) {
  const [busy, setBusy] = useState(false)

  const download = async (format: string) => {
    setBusy(true)
    try {
      const response = await api.get(path, {
        params: { ...params, format },
        responseType: "blob",
      })
      const disposition = response.headers["content-disposition"] ?? ""
      const match = /filename="?([^";]+)"?/.exec(disposition)
      const url = URL.createObjectURL(response.data as Blob)
      const link = document.createElement("a")
      link.href = url
      link.download = match?.[1] ?? `report.${format}`
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
      toast.success(`Exported as ${format.toUpperCase()}`)
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" disabled={busy} onClick={() => void download("csv")}>
        <FileSpreadsheet /> CSV
      </Button>
      <Button variant="outline" size="sm" disabled={busy} onClick={() => void download("xlsx")}>
        <Table2 /> Excel
      </Button>
      <Button variant="outline" size="sm" disabled={busy} onClick={() => void download("pdf")}>
        <FileText /> PDF
      </Button>
    </div>
  )
}

export function AdminReportsPage() {
  const [batches, setBatches] = useState<BatchOption[]>([])
  const [batchFilter, setBatchFilter] = useState("all")
  const [from, setFrom] = useState("")
  const [to, setTo] = useState("")

  const [attendance, setAttendance] = useState<AttendanceReport | null>(null)
  const [performance, setPerformance] = useState<PerformanceRow[] | null>(null)
  const [assignments, setAssignments] = useState<AssignmentRow[] | null>(null)
  const [batchRows, setBatchRows] = useState<BatchRow[] | null>(null)
  const [mentorRows, setMentorRows] = useState<MentorRow[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api
      .get("/admin/batches", { params: { page: 1, limit: 100 } })
      .then(({ data }) =>
        setBatches(((data.data as { items?: BatchOption[] })?.items ?? []) as BatchOption[])
      )
      .catch(() => setBatches([]))
  }, [])

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const batchParam = batchFilter === "all" ? undefined : batchFilter
      const [att, perf, asg, bat, men] = await Promise.all([
        api.get("/admin/reports/attendance", {
          params: {
            batchId: batchParam,
            from: from || undefined,
            to: to || undefined,
          },
        }),
        api.get("/admin/reports/performance", { params: { batchId: batchParam } }),
        api.get("/admin/reports/assignments", { params: { batchId: batchParam } }),
        api.get("/admin/reports/batches"),
        api.get("/admin/reports/mentors"),
      ])
      setAttendance(att.data.data as AttendanceReport)
      setPerformance((perf.data.data as { rows: PerformanceRow[] }).rows)
      setAssignments((asg.data.data as { rows: AssignmentRow[] }).rows)
      setBatchRows((bat.data.data as { rows: BatchRow[] }).rows)
      setMentorRows((men.data.data as { rows: MentorRow[] }).rows)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [batchFilter])

  if (loading && !attendance && !error) return <PageLoader />

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        description="Institute-wide analytics with export to CSV, Excel and PDF."
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="grid gap-2">
          <Label>Batch filter</Label>
          <Select value={batchFilter} onValueChange={(v) => setBatchFilter(v ?? "all")}>
            <SelectTrigger className="w-56">
              <SelectValue placeholder="All batches" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All batches</SelectItem>
              {batches.map((b) => (
                <SelectItem key={b.id} value={b.id}>
                  {b.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="from">Attendance from</Label>
          <Input
            id="from"
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="w-44"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="to">To</Label>
          <Input
            id="to"
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="w-44"
          />
        </div>
        <Button onClick={() => void load()} disabled={loading}>
          <Download /> Apply
        </Button>
      </div>

      {error ? (
        <ErrorState message={error} onRetry={load} />
      ) : (
        <Tabs defaultValue="attendance" className="space-y-4">
          <TabsList className="flex-wrap">
            <TabsTrigger value="attendance">Attendance</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="assignments">Assignments</TabsTrigger>
            <TabsTrigger value="batches">Batches</TabsTrigger>
            <TabsTrigger value="mentors">Mentors</TabsTrigger>
          </TabsList>

          {/* ---------------- Attendance ---------------- */}
          <TabsContent value="attendance" className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">
                {attendance?.total ?? 0} records
                {attendance
                  ? Object.entries(attendance.summary)
                      .map(([k, v]) => ` · ${k.toLowerCase()} ${v}`)
                      .join("")
                  : ""}
              </p>
              <ExportButtons
                path="/admin/reports/attendance"
                params={{
                  batchId: batchFilter === "all" ? "" : batchFilter,
                  from,
                  to,
                }}
              />
            </div>
            {!attendance || attendance.rows.length === 0 ? (
              <EmptyState
                icon={BarChart3}
                title="No attendance records"
                description="Records will appear once mentors mark attendance."
              />
            ) : (
              <Card>
                <CardContent className="p-0">
                  <div className="max-h-[60vh] overflow-auto rounded-lg">
                    <Table>
                      <TableHeader className="sticky top-0 bg-background">
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Student</TableHead>
                          <TableHead>Batch</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Remarks</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {attendance.rows.slice(0, 200).map((row, i) => (
                          <TableRow key={i}>
                            <TableCell>{formatDate(row.date)}</TableCell>
                            <TableCell>{row.student}</TableCell>
                            <TableCell>{row.batch}</TableCell>
                            <TableCell>{statusBadge(row.status)}</TableCell>
                            <TableCell className="text-muted-foreground">{row.remarks || "—"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  {attendance.rows.length > 200 ? (
                    <p className="border-t p-3 text-center text-xs text-muted-foreground">
                      Showing latest 200 of {attendance.total} records — export for full data.
                    </p>
                  ) : null}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* ---------------- Performance ---------------- */}
          <TabsContent value="performance" className="space-y-4">
            <div className="flex justify-end">
              <ExportButtons
                path="/admin/reports/performance"
                params={{ batchId: batchFilter === "all" ? "" : batchFilter }}
              />
            </div>
            {!performance || performance.length === 0 ? (
              <EmptyState
                icon={BarChart3}
                title="No student data"
                description="Performance stats appear once students are enrolled."
              />
            ) : (
              <Card>
                <CardContent className="p-0">
                  <div className="max-h-[60vh] overflow-auto rounded-lg">
                    <Table>
                      <TableHeader className="sticky top-0 bg-background">
                        <TableRow>
                          <TableHead>Student</TableHead>
                          <TableHead>Batch</TableHead>
                          <TableHead className="text-center">Avg Marks</TableHead>
                          <TableHead className="text-center">Submissions</TableHead>
                          <TableHead className="text-center">Attendance</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {performance.map((row, i) => (
                          <TableRow key={i}>
                            <TableCell>
                              <p className="text-sm font-medium">{row.student}</p>
                              <p className="text-xs text-muted-foreground">{row.email}</p>
                            </TableCell>
                            <TableCell className="text-sm">{row.batch}</TableCell>
                            <TableCell className="text-center text-sm font-medium">
                              {row.averageMarks}
                            </TableCell>
                            <TableCell className="text-center text-sm">
                              {row.assignmentsSubmitted}
                            </TableCell>
                            <TableCell
                              className={`text-center text-sm font-medium ${percentColor(row.attendancePercent)}`}
                            >
                              {row.attendancePercent}%
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* ---------------- Assignments ---------------- */}
          <TabsContent value="assignments" className="space-y-4">
            <div className="flex justify-end">
              <ExportButtons
                path="/admin/reports/assignments"
                params={{ batchId: batchFilter === "all" ? "" : batchFilter }}
              />
            </div>
            {!assignments || assignments.length === 0 ? (
              <EmptyState
                icon={BarChart3}
                title="No assignments"
                description="Assignment stats appear once mentors create assignments."
              />
            ) : (
              <Card>
                <CardContent className="p-0">
                  <div className="max-h-[60vh] overflow-auto rounded-lg">
                    <Table>
                      <TableHeader className="sticky top-0 bg-background">
                        <TableRow>
                          <TableHead>Assignment</TableHead>
                          <TableHead>Batch</TableHead>
                          <TableHead className="text-center">Due</TableHead>
                          <TableHead className="text-center">Submissions</TableHead>
                          <TableHead className="text-center">Graded</TableHead>
                          <TableHead className="text-center">Avg Marks</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {assignments.map((row, i) => (
                          <TableRow key={i}>
                            <TableCell className="text-sm font-medium">{row.title}</TableCell>
                            <TableCell className="text-sm">{row.batch}</TableCell>
                            <TableCell className="text-center text-sm">
                              {formatDate(row.dueDate)}
                            </TableCell>
                            <TableCell className="text-center text-sm">{row.submissions}</TableCell>
                            <TableCell className="text-center text-sm">{row.graded}</TableCell>
                            <TableCell className="text-center text-sm font-medium">
                              {row.averageMarks}/{row.maxMarks}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* ---------------- Batches ---------------- */}
          <TabsContent value="batches" className="space-y-4">
            <div className="flex justify-end">
              <ExportButtons path="/admin/reports/batches" params={{}} />
            </div>
            {!batchRows || batchRows.length === 0 ? (
              <EmptyState
                icon={BarChart3}
                title="No batches"
                description="Create batches to see analytics here."
              />
            ) : (
              <Card>
                <CardContent className="p-0">
                  <div className="max-h-[60vh] overflow-auto rounded-lg">
                    <Table>
                      <TableHeader className="sticky top-0 bg-background">
                        <TableRow>
                          <TableHead>Batch</TableHead>
                          <TableHead>Course</TableHead>
                          <TableHead>Mentor</TableHead>
                          <TableHead className="text-center">Students</TableHead>
                          <TableHead className="text-center">Capacity</TableHead>
                          <TableHead className="text-center">Attendance</TableHead>
                          <TableHead className="text-center">Avg Marks</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {batchRows.map((row, i) => (
                          <TableRow key={i}>
                            <TableCell>
                              <p className="text-sm font-medium">{row.name}</p>
                              <p className="text-xs text-muted-foreground">{row.code}</p>
                            </TableCell>
                            <TableCell className="text-sm">{row.course}</TableCell>
                            <TableCell className="text-sm">{row.mentor}</TableCell>
                            <TableCell className="text-center text-sm">{row.students}</TableCell>
                            <TableCell className="text-center text-sm text-muted-foreground">
                              {row.capacity}
                            </TableCell>
                            <TableCell
                              className={`text-center text-sm font-medium ${percentColor(row.attendancePercent)}`}
                            >
                              {row.attendancePercent}%
                            </TableCell>
                            <TableCell className="text-center text-sm font-medium">
                              {row.averageMarks}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* ---------------- Mentors ---------------- */}
          <TabsContent value="mentors" className="space-y-4">
            <div className="flex justify-end">
              <ExportButtons path="/admin/reports/mentors" params={{}} />
            </div>
            {!mentorRows || mentorRows.length === 0 ? (
              <EmptyState
                icon={BarChart3}
                title="No mentors"
                description="Add mentors to see their activity here."
              />
            ) : (
              <Card>
                <CardContent className="p-0">
                  <div className="max-h-[60vh] overflow-auto rounded-lg">
                    <Table>
                      <TableHeader className="sticky top-0 bg-background">
                        <TableRow>
                          <TableHead>Mentor</TableHead>
                          <TableHead>Batches</TableHead>
                          <TableHead className="text-center">Students</TableHead>
                          <TableHead className="text-center">Assignments</TableHead>
                          <TableHead className="text-center">Graded</TableHead>
                          <TableHead className="text-center">Attendance Marked</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {mentorRows.map((row, i) => (
                          <TableRow key={i}>
                            <TableCell>
                              <p className="text-sm font-medium">{row.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {row.email} · {row.department}
                              </p>
                            </TableCell>
                            <TableCell className="max-w-48 truncate text-sm">{row.batches || "—"}</TableCell>
                            <TableCell className="text-center text-sm">{row.students}</TableCell>
                            <TableCell className="text-center text-sm">{row.assignmentsCreated}</TableCell>
                            <TableCell className="text-center text-sm">{row.submissionsGraded}</TableCell>
                            <TableCell className="text-center text-sm">{row.attendanceMarked}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
