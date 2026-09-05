import { useEffect, useState } from "react"
import type { ReactNode } from "react"
import { BarChart3, Download, FileSpreadsheet, FileText, Table2 } from "lucide-react"
import { toast } from "sonner"
import { api, getErrorMessage } from "@/lib/api"
import { PageHeader } from "@/components/shared/PageHeader"
import { PageLoader } from "@/components/shared/PageLoader"
import { ErrorState } from "@/components/shared/ErrorState"
import { EmptyState } from "@/components/shared/EmptyState"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import { cn } from "@/lib/utils"
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

const HEAD_ROW = "bg-muted hover:bg-muted"
const TH_CLASS = "text-xs font-bold uppercase tracking-wider text-muted-foreground"

const SUMMARY_PILLS: Record<string, string> = {
  PRESENT: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  LATE: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  ABSENT: "bg-red-500/10 text-red-700 dark:text-red-400",
  LEAVE: "bg-sky-500/10 text-sky-700 dark:text-sky-400",
}

const percentColor = (value: number) => {
  if (value >= 80) return "text-emerald-600 dark:text-emerald-400"
  if (value >= 60) return "text-amber-600 dark:text-amber-400"
  return "text-red-600 dark:text-red-400"
}

function ReportPanel({
  title,
  meta,
  actions,
  children,
}: {
  title: string
  meta?: ReactNode
  actions?: ReactNode
  children: ReactNode
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 space-y-0 border-b border-border px-5 py-4">
        <div className="flex min-w-0 flex-col gap-1">
          <CardTitle className="text-base">{title}</CardTitle>
          {meta ? <p className="text-xs text-muted-foreground">{meta}</p> : null}
        </div>
        <div className="flex shrink-0 items-center gap-3">{actions}</div>
      </CardHeader>
      <CardContent className="p-0">{children}</CardContent>
    </Card>
  )
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

  const resetFilters = () => {
    setFrom("")
    setTo("")
    setBatchFilter("all")
  }

  if (loading && !attendance && !error) return <PageLoader />

  const attendanceMeta = attendance
    ? [
        `${attendance.total} records`,
        ...Object.entries(attendance.summary).map(([k, v]) => (
          <span
            key={k}
            className={cn(
              "label-micro inline-flex items-center gap-1.5 rounded-full px-2.5 py-1",
              SUMMARY_PILLS[k] ?? "bg-muted text-muted-foreground"
            )}
          >
            <span className="size-1.5 rounded-full bg-current" />
            {k.toLowerCase()} {v}
          </span>
        )),
      ]
    : []

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        description="Institute-wide analytics with export to CSV, Excel and PDF."
      />

      <Card>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap items-end gap-3">
            <div className="grid gap-1.5">
              <Label className="text-xs font-semibold text-muted-foreground">Batch filter</Label>
              <Select value={batchFilter} onValueChange={(v) => setBatchFilter(v ?? "all")}>
                <SelectTrigger className="w-52">
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
            <div className="grid gap-1.5">
              <Label htmlFor="from" className="text-xs font-semibold text-muted-foreground">
                Attendance from
              </Label>
              <Input
                id="from"
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="w-44"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="to" className="text-xs font-semibold text-muted-foreground">
                To
              </Label>
              <Input
                id="to"
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="w-44"
              />
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={() => void load()} disabled={loading}>
                <Download /> Apply
              </Button>
              <Button variant="ghost" onClick={resetFilters} disabled={loading}>
                Reset
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

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
            {!attendance || attendance.rows.length === 0 ? (
              <EmptyState
                icon={BarChart3}
                title="No attendance records"
                description="Records will appear once mentors mark attendance."
              />
            ) : (
              <ReportPanel
                title="Attendance Ledger"
                meta={attendanceMeta}
                actions={
                  <ExportButtons
                    path="/admin/reports/attendance"
                    params={{
                      batchId: batchFilter === "all" ? "" : batchFilter,
                      from,
                      to,
                    }}
                  />
                }
              >
                <div className="max-h-[65vh] overflow-auto">
                  <Table>
                    <TableHeader className="sticky top-0 z-10">
                      <TableRow className={HEAD_ROW}>
                        <TableHead className={TH_CLASS}>Date</TableHead>
                        <TableHead className={TH_CLASS}>Student</TableHead>
                        <TableHead className={TH_CLASS}>Batch</TableHead>
                        <TableHead className={TH_CLASS}>Status</TableHead>
                        <TableHead className={TH_CLASS}>Remarks</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {attendance.rows.slice(0, 200).map((row, i) => (
                        <TableRow key={i}>
                          <TableCell>{formatDate(row.date)}</TableCell>
                          <TableCell className="font-medium">{row.student}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{row.batch}</TableCell>
                          <TableCell>
                            <StatusBadge status={row.status} />
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {row.remarks || "—"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                {attendance.rows.length > 200 ? (
                  <p className="border-t border-border p-3 text-center text-xs text-muted-foreground">
                    Showing latest 200 of {attendance.total} records — export for full data.
                  </p>
                ) : null}
              </ReportPanel>
            )}
          </TabsContent>

          {/* ---------------- Performance ---------------- */}
          <TabsContent value="performance" className="space-y-4">
            {!performance || performance.length === 0 ? (
              <EmptyState
                icon={BarChart3}
                title="No student data"
                description="Performance stats appear once students are enrolled."
              />
            ) : (
              <ReportPanel
                title="Student Performance"
                meta={`${performance.length} students`}
                actions={
                  <ExportButtons
                    path="/admin/reports/performance"
                    params={{ batchId: batchFilter === "all" ? "" : batchFilter }}
                  />
                }
              >
                <div className="max-h-[65vh] overflow-auto">
                  <Table>
                    <TableHeader className="sticky top-0 z-10">
                      <TableRow className={HEAD_ROW}>
                        <TableHead className={TH_CLASS}>Student</TableHead>
                        <TableHead className={TH_CLASS}>Batch</TableHead>
                        <TableHead className={cn(TH_CLASS, "text-center")}>Avg Marks</TableHead>
                        <TableHead className={cn(TH_CLASS, "text-center")}>Submissions</TableHead>
                        <TableHead className={cn(TH_CLASS, "text-center")}>Attendance</TableHead>
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
                          <TableCell className="text-center text-sm">{row.assignmentsSubmitted}</TableCell>
                          <TableCell
                            className={cn(
                              "text-center text-sm font-medium",
                              percentColor(row.attendancePercent)
                            )}
                          >
                            {row.attendancePercent}%
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </ReportPanel>
            )}
          </TabsContent>

          {/* ---------------- Assignments ---------------- */}
          <TabsContent value="assignments" className="space-y-4">
            {!assignments || assignments.length === 0 ? (
              <EmptyState
                icon={BarChart3}
                title="No assignments"
                description="Assignment stats appear once mentors create assignments."
              />
            ) : (
              <ReportPanel
                title="Assignment Overview"
                meta={`${assignments.length} assignments`}
                actions={
                  <ExportButtons
                    path="/admin/reports/assignments"
                    params={{ batchId: batchFilter === "all" ? "" : batchFilter }}
                  />
                }
              >
                <div className="max-h-[65vh] overflow-auto">
                  <Table>
                    <TableHeader className="sticky top-0 z-10">
                      <TableRow className={HEAD_ROW}>
                        <TableHead className={TH_CLASS}>Assignment</TableHead>
                        <TableHead className={TH_CLASS}>Batch</TableHead>
                        <TableHead className={cn(TH_CLASS, "text-center")}>Due</TableHead>
                        <TableHead className={cn(TH_CLASS, "text-center")}>Submissions</TableHead>
                        <TableHead className={cn(TH_CLASS, "text-center")}>Graded</TableHead>
                        <TableHead className={cn(TH_CLASS, "text-center")}>Avg Marks</TableHead>
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
              </ReportPanel>
            )}
          </TabsContent>

          {/* ---------------- Batches ---------------- */}
          <TabsContent value="batches" className="space-y-4">
            {!batchRows || batchRows.length === 0 ? (
              <EmptyState
                icon={BarChart3}
                title="No batches"
                description="Create batches to see analytics here."
              />
            ) : (
              <ReportPanel
                title="Batch Overview"
                meta={`${batchRows.length} batches`}
                actions={<ExportButtons path="/admin/reports/batches" params={{}} />}
              >
                <div className="max-h-[65vh] overflow-auto">
                  <Table>
                    <TableHeader className="sticky top-0 z-10">
                      <TableRow className={HEAD_ROW}>
                        <TableHead className={TH_CLASS}>Batch</TableHead>
                        <TableHead className={TH_CLASS}>Course</TableHead>
                        <TableHead className={TH_CLASS}>Mentor</TableHead>
                        <TableHead className={cn(TH_CLASS, "text-center")}>Students</TableHead>
                        <TableHead className={cn(TH_CLASS, "text-center")}>Capacity</TableHead>
                        <TableHead className={cn(TH_CLASS, "text-center")}>Attendance</TableHead>
                        <TableHead className={cn(TH_CLASS, "text-center")}>Avg Marks</TableHead>
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
                            className={cn(
                              "text-center text-sm font-medium",
                              percentColor(row.attendancePercent)
                            )}
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
              </ReportPanel>
            )}
          </TabsContent>

          {/* ---------------- Mentors ---------------- */}
          <TabsContent value="mentors" className="space-y-4">
            {!mentorRows || mentorRows.length === 0 ? (
              <EmptyState
                icon={BarChart3}
                title="No mentors"
                description="Add mentors to see their activity here."
              />
            ) : (
              <ReportPanel
                title="Mentor Activity"
                meta={`${mentorRows.length} mentors`}
                actions={<ExportButtons path="/admin/reports/mentors" params={{}} />}
              >
                <div className="max-h-[65vh] overflow-auto">
                  <Table>
                    <TableHeader className="sticky top-0 z-10">
                      <TableRow className={HEAD_ROW}>
                        <TableHead className={TH_CLASS}>Mentor</TableHead>
                        <TableHead className={TH_CLASS}>Batches</TableHead>
                        <TableHead className={cn(TH_CLASS, "text-center")}>Students</TableHead>
                        <TableHead className={cn(TH_CLASS, "text-center")}>Assignments</TableHead>
                        <TableHead className={cn(TH_CLASS, "text-center")}>Graded</TableHead>
                        <TableHead className={cn(TH_CLASS, "text-center")}>Attendance Marked</TableHead>
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
                          <TableCell className="max-w-48 truncate text-sm">
                            {row.batches || "—"}
                          </TableCell>
                          <TableCell className="text-center text-sm">{row.students}</TableCell>
                          <TableCell className="text-center text-sm">{row.assignmentsCreated}</TableCell>
                          <TableCell className="text-center text-sm">{row.submissionsGraded}</TableCell>
                          <TableCell className="text-center text-sm">{row.attendanceMarked}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </ReportPanel>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}