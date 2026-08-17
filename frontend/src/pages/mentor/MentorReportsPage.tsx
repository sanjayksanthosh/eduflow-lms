import { useEffect, useMemo, useState } from "react"
import { BarChart3, BookOpen, GraduationCap, Users } from "lucide-react"
import { toast } from "sonner"
import { api, getErrorMessage } from "@/lib/api"
import { PageHeader } from "@/components/shared/PageHeader"
import { PageLoader } from "@/components/shared/PageLoader"
import { ErrorState } from "@/components/shared/ErrorState"
import { EmptyState } from "@/components/shared/EmptyState"
import { StatCard } from "@/components/shared/StatCard"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { fullName, getInitials, formatDate, formatDateTime } from "@/lib/format"

interface ReportBatch {
  id: string
  name: string
  code: string
  course: { id: string; title: string; color: string | null } | null
}

interface ReportStudent {
  id: string
  admissionNumber: string
  gender: string | null
  user: { firstName: string; lastName: string; email: string; phone: string | null; profileImage: string | null }
  batch: { id: string; name: string; code: string } | null
  course: { id: string; title: string; color: string | null } | null
  stats: {
    attendancePercent: number
    attendanceRecords: number
    assignmentsSubmitted: number
    averageMarks: number
    courseProgress: number
  }
}

interface MentorReportsData {
  batches: ReportBatch[]
  totalStudents: number
  students: ReportStudent[]
}

const attendanceColor = (percent: number) => {
  if (percent >= 80) return "text-emerald-600 dark:text-emerald-400"
  if (percent >= 60) return "text-amber-600 dark:text-amber-400"
  return "text-red-600 dark:text-red-400"
}

export function MentorReportsPage() {
  const [data, setData] = useState<MentorReportsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState("")
  const [batchId, setBatchId] = useState("all")
  const [detailId, setDetailId] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const { data: res } = await api.get("/mentor/reports")
      setData(res.data as MentorReportsData)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const filtered = useMemo(() => {
    if (!data) return []
    const q = query.trim().toLowerCase()
    return data.students.filter((s) => {
      if (batchId !== "all" && s.batch?.id !== batchId) return false
      if (!q) return true
      const name = `${s.user.firstName} ${s.user.lastName}`.toLowerCase()
      return (
        name.includes(q) ||
        s.user.email.toLowerCase().includes(q) ||
        s.admissionNumber.toLowerCase().includes(q)
      )
    })
  }, [data, query, batchId])

  const avgAttendance = useMemo(() => {
    if (!data || data.students.length === 0) return 0
    return Math.round(
      data.students.reduce((acc, s) => acc + s.stats.attendancePercent, 0) / data.students.length
    )
  }, [data])

  const avgMarks = useMemo(() => {
    if (!data || data.students.length === 0) return 0
    return Math.round(
      data.students.reduce((acc, s) => acc + s.stats.averageMarks, 0) / data.students.length
    )
  }, [data])

  if (loading && !data) return <PageLoader />
  if (error && !data) {
    return (
      <div className="space-y-6">
        <PageHeader title="Reports" description="Student performance reports." />
        <ErrorState message={error} onRetry={load} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Reports" description="Student performance reports across your batches." />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Students" value={data?.totalStudents ?? 0} icon={Users} />
        <StatCard title="Batches" value={data?.batches.length ?? 0} icon={BookOpen} />
        <StatCard title="Avg Attendance" value={`${avgAttendance}%`} icon={BarChart3} />
        <StatCard title="Avg Marks" value={avgMarks} icon={GraduationCap} />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input
          placeholder="Search by name or email..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="sm:max-w-xs"
        />
        <Select value={batchId} onValueChange={(value) => setBatchId(value ?? "all")}>
          <SelectTrigger className="sm:w-56">
            <SelectValue placeholder="All batches" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All batches</SelectItem>
            {data?.batches.map((batch) => (
              <SelectItem key={batch.id} value={batch.id}>
                {batch.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {data && data.students.length === 0 ? (
        <EmptyState
          icon={BarChart3}
          title="No students yet"
          description="Students in your batches will appear here."
        />
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Batch</TableHead>
                <TableHead className="text-center">Attendance</TableHead>
                <TableHead className="text-center">Avg Marks</TableHead>
                <TableHead className="text-center">Submissions</TableHead>
                <TableHead className="min-w-36">Course Progress</TableHead>
                <TableHead className="text-right">Report</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((student) => (
                <TableRow key={student.id} className="hover:bg-muted/50">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
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
                  </TableCell>
                  <TableCell>
                    <p className="text-sm">{student.batch?.name ?? "—"}</p>
                    <p className="text-xs text-muted-foreground">{student.course?.title ?? ""}</p>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className={`text-sm font-medium ${attendanceColor(student.stats.attendancePercent)}`}>
                      {student.stats.attendancePercent}%
                    </span>
                  </TableCell>
                  <TableCell className="text-center text-sm font-medium">
                    {student.stats.averageMarks}
                  </TableCell>
                  <TableCell className="text-center text-sm text-muted-foreground">
                    {student.stats.assignmentsSubmitted}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 min-w-16 flex-1 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${student.stats.courseProgress}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {student.stats.courseProgress}%
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" onClick={() => setDetailId(student.id)}>
                      View report
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filtered.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No students match your filters.
            </p>
          ) : null}
        </div>
      )}

      <StudentReportDialog studentId={detailId} onClose={() => setDetailId(null)} />
    </div>
  )
}

// ---------------- Report sheet ----------------

interface StudentReport {
  id: string
  admissionNumber: string
  parentName: string | null
  parentPhone: string | null
  emergencyContact: string | null
  dateOfBirth: string | null
  gender: string | null
  createdAt: string
  user: {
    firstName: string
    lastName: string
    email: string
    phone: string | null
    address: string | null
    profileImage: string | null
  }
  batch: { id: string; name: string; code: string; course: { title: string } | null } | null
  attendance: { id: string; date: string; status: string; batch: { name: string } }[]
  submissions: {
    id: string
    status: string
    marks: number | null
    feedback: string | null
    submittedAt: string
    isLate: boolean
    assignment: { id: string; title: string; maxMarks: number; dueDate: string }
  }[]
  stats: {
    attendancePercent: number
    attendanceRecords: number
    assignmentsSubmitted: number
    averageMarks: number
    courseProgress: number
  }
}

const reportStatusBadge = (status: string) => {
  switch (status) {
    case "PRESENT":
      return <Badge className="border-emerald-500/30 bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">Present</Badge>
    case "LATE":
      return <Badge className="border-amber-500/30 bg-amber-500/15 text-amber-700 dark:text-amber-400">Late</Badge>
    case "ABSENT":
      return <Badge className="border-red-500/30 bg-red-500/15 text-red-700 dark:text-red-400">Absent</Badge>
    case "LEAVE":
      return <Badge className="border-blue-500/30 bg-blue-500/15 text-blue-700 dark:text-blue-400">On leave</Badge>
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="text-right text-sm font-medium">{value ?? "—"}</dd>
    </div>
  )
}

function StudentReportDialog({ studentId, onClose }: { studentId: string | null; onClose: () => void }) {
  const [report, setReport] = useState<StudentReport | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!studentId) return
    setReport(null)
    setLoading(true)
    api
      .get(`/mentor/students/${studentId}`)
      .then(({ data }) => setReport(data.data as StudentReport))
      .catch((err) => toast.error(getErrorMessage(err)))
      .finally(() => setLoading(false))
  }, [studentId])

  return (
    <Dialog open={Boolean(studentId)} onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Student Report</DialogTitle>
        </DialogHeader>
        {loading ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Loading report...</p>
        ) : report ? (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 rounded-lg border bg-muted/30 p-5 sm:flex-row sm:items-center">
              <Avatar size="lg">
                <AvatarImage
                  src={report.user.profileImage ?? undefined}
                  alt={fullName(report.user.firstName, report.user.lastName)}
                />
                <AvatarFallback>
                  {getInitials(report.user.firstName, report.user.lastName)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-lg font-semibold">
                    {fullName(report.user.firstName, report.user.lastName)}
                  </h3>
                  <Badge variant="outline">{report.user.email}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {report.batch ? `${report.batch.name} · ${report.batch.code}` : "No batch assigned"}
                  {report.batch?.course?.title ? ` · ${report.batch.course.title}` : ""}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-lg bg-background p-3 text-center">
                  <p className="text-xl font-semibold">{report.stats.attendancePercent}%</p>
                  <p className="text-xs text-muted-foreground">Attendance</p>
                </div>
                <div className="rounded-lg bg-background p-3 text-center">
                  <p className="text-xl font-semibold">{report.stats.averageMarks}</p>
                  <p className="text-xs text-muted-foreground">Avg marks</p>
                </div>
                <div className="rounded-lg bg-background p-3 text-center">
                  <p className="text-xl font-semibold">{report.stats.assignmentsSubmitted}</p>
                  <p className="text-xs text-muted-foreground">Submitted</p>
                </div>
                <div className="rounded-lg bg-background p-3 text-center">
                  <p className="text-xl font-semibold">{report.stats.courseProgress}%</p>
                  <p className="text-xs text-muted-foreground">Progress</p>
                </div>
              </div>
            </div>

            {/* Personal info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Personal Information</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="divide-y">
                  <InfoRow label="Email" value={report.user.email} />
                  <InfoRow label="Phone" value={report.user.phone} />
                  <InfoRow label="Address" value={report.user.address} />
                  <InfoRow label="Gender" value={report.gender} />
                  <InfoRow
                    label="Date of birth"
                    value={report.dateOfBirth ? formatDate(report.dateOfBirth) : null}
                  />
                  <InfoRow label="Parent / guardian" value={report.parentName} />
                  <InfoRow label="Parent phone" value={report.parentPhone} />
                  <InfoRow label="Emergency contact" value={report.emergencyContact} />
                  <InfoRow label="Enrolled" value={formatDate(report.createdAt)} />
                </dl>
              </CardContent>
            </Card>

            {/* Assignment results */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Assignment Results</CardTitle>
              </CardHeader>
              <CardContent>
                {report.submissions.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No submissions yet.</p>
                ) : (
                  <ul className="divide-y">
                    {report.submissions.map((sub) => (
                      <li key={sub.id} className="space-y-1 py-3">
                        <div className="flex items-center justify-between gap-3">
                          <p className="truncate text-sm font-medium">{sub.assignment.title}</p>
                          <div className="flex shrink-0 items-center gap-2">
                            {sub.marks !== null ? (
                              <Badge>
                                {sub.marks}/{sub.assignment.maxMarks}
                              </Badge>
                            ) : (
                              <Badge variant="secondary">Pending grade</Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>Submitted {formatDateTime(sub.submittedAt)}</span>
                          {sub.isLate ? <span>· Late</span> : null}
                        </div>
                        {sub.feedback ? (
                          <p className="rounded-lg bg-muted p-2 text-sm">{sub.feedback}</p>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            {/* Attendance history */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Recent Attendance</CardTitle>
              </CardHeader>
              <CardContent>
                {report.attendance.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No attendance records.</p>
                ) : (
                  <ul className="space-y-2">
                    {report.attendance.slice(0, 12).map((record) => (
                      <li key={record.id} className="flex items-center justify-between gap-3 text-sm">
                        <span className="text-muted-foreground">{formatDate(record.date)}</span>
                        {reportStatusBadge(record.status)}
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
