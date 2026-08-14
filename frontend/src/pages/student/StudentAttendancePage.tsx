import { useEffect, useState } from "react"
import { CalendarCheck, CalendarDays, CalendarX, Clock, X } from "lucide-react"
import { api, getErrorMessage } from "@/lib/api"
import { PageHeader } from "@/components/shared/PageHeader"
import { PageLoader } from "@/components/shared/PageLoader"
import { ErrorState } from "@/components/shared/ErrorState"
import { EmptyState } from "@/components/shared/EmptyState"
import { AttendanceHeatmap } from "@/components/shared/AttendanceHeatmap"
import { StatCard } from "@/components/shared/StatCard"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatDate } from "@/lib/format"

interface AttendanceRecord {
  id: string
  date: string
  status: string
  batch: { id: string; name: string }
}

interface AttendanceHistory {
  studentId: string
  records: AttendanceRecord[]
  summary: Record<string, number>
  total: number
  attendancePercent: number
}

const statusBadge = (status: string) => {
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

export function StudentAttendancePage() {
  const [month, setMonth] = useState("")
  const [data, setData] = useState<AttendanceHistory | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = async (monthValue: string) => {
    setLoading(true)
    setError(null)
    try {
      const { data: res } = await api.get("/student/attendance", {
        params: monthValue ? { month: monthValue } : {},
      })
      setData(res.data as AttendanceHistory)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load(month)
  }, [])

  if (loading && !data) return <PageLoader />
  if (error && !data) {
    return (
      <div className="space-y-6">
        <PageHeader title="Attendance" description="Your attendance records." />
        <ErrorState message={error} onRetry={() => load(month)} />
      </div>
    )
  }

  const summary = data?.summary ?? {}
  const present = (summary.PRESENT ?? 0) + (summary.LATE ?? 0)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Attendance"
        description="Your attendance records."
        actions={
          <div className="flex items-center gap-2">
            <Input
              type="month"
              value={month}
              onChange={(e) => {
                setMonth(e.target.value)
                void load(e.target.value)
              }}
              className="w-auto"
            />
            {month ? (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setMonth("")
                  void load("")
                }}
                title="Show all time"
              >
                <X className="size-4" />
              </Button>
            ) : null}
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Attendance" value={`${data?.attendancePercent ?? 0}%`} icon={CalendarCheck} />
        <StatCard title="Present" value={present} icon={CalendarCheck} hint={`of ${data?.total ?? 0} records`} />
        <StatCard title="Late" value={summary.LATE ?? 0} icon={Clock} />
        <StatCard title="Absent" value={summary.ABSENT ?? 0} icon={CalendarX} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Attendance Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <AttendanceHeatmap records={data?.records ?? []} />
          <p className="mt-3 text-xs text-muted-foreground">
            Hover a box to see the date and status. Last 26 weeks shown.
          </p>
        </CardContent>
      </Card>

      {data && data.records.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="No records for this period"
          description="Attendance marked for this period will appear here."
        />
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Batch</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.records.map((record) => (
                <TableRow key={record.id}>
                  <TableCell>{formatDate(record.date)}</TableCell>
                  <TableCell>{record.batch.name}</TableCell>
                  <TableCell className="text-right">{statusBadge(record.status)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
