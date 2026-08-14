import { CalendarCheck, ClipboardCheck, Users, BookOpen, Plus } from "lucide-react"
import { Link } from "react-router-dom"
import { PageHeader } from "@/components/shared/PageHeader"
import { StatCard } from "@/components/shared/StatCard"
import { PageLoader } from "@/components/shared/PageLoader"
import { ErrorState } from "@/components/shared/ErrorState"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useApi } from "@/hooks/useApi"
import { formatDate, timeAgo } from "@/lib/format"
import type { Announcement } from "@/lib/types"

interface MentorBatchRow {
  id: string
  name: string
  code: string
  course: { id: string; title: string; color: string | null }
  _count: { students: number }
}

interface UpcomingAssignment {
  id: string
  title: string
  dueDate: string | null
  batch: { name: string; code: string }
  _count: { submissions: number }
}

interface MentorProgressRow {
  batch: string
  course: string
  color: string | null
  progressPercent: number
}

interface MentorDashboardData {
  stats: {
    batches: number
    totalStudents: number
    todayAttendanceMarked: number
    pendingReviews: number
    pendingAssignments: number
  }
  batches: MentorBatchRow[]
  assignments: UpcomingAssignment[]
  announcements: Announcement[]
  progressData: MentorProgressRow[]
}

export function MentorDashboardPage() {
  const { data, loading, error, refetch } = useApi<MentorDashboardData>("/mentor/dashboard")

  if (loading) return <PageLoader />
  if (error || !data) {
    return (
      <div className="space-y-6">
        <PageHeader title="Dashboard" description="Overview of your batches and classes." />
        <ErrorState message={error ?? "Dashboard could not be loaded."} onRetry={refetch} />
      </div>
    )
  }

  const { stats, batches, assignments, announcements, progressData } = data

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Overview of your batches, students and classes."
        actions={
          <Link to="/mentor/assignments">
            <Button>
              <Plus /> New assignment
            </Button>
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="My Batches" value={stats.batches} icon={BookOpen} to="/mentor/batches" />
        <StatCard title="Total Students" value={stats.totalStudents} icon={Users} to="/mentor/batches" />
        <StatCard
          title="Attendance Today"
          value={stats.todayAttendanceMarked}
          icon={CalendarCheck}
          hint={stats.todayAttendanceMarked === 0 ? "Not marked yet" : "records saved"}
          to="/mentor/attendance"
        />
        <StatCard
          title="Pending Reviews"
          value={stats.pendingReviews}
          icon={ClipboardCheck}
          hint={stats.pendingReviews === 0 ? "All caught up" : "submissions to grade"}
          to="/mentor/assignments"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Link to="/mentor/batches" className="group">
          <Card className="transition-all group-hover:-translate-y-0.5 group-hover:border-primary/40 group-hover:shadow-md">
            <CardHeader>
              <CardTitle>My Batches</CardTitle>
            </CardHeader>
          <CardContent>
            {batches.length === 0 ? (
              <p className="text-sm text-muted-foreground">No batches assigned yet.</p>
            ) : (
              <ul className="space-y-4">
                {batches.map((batch) => {
                  const progress =
                    progressData.find((p) => p.batch === batch.name)?.progressPercent ?? 0
                  return (
                    <li key={batch.id} className="space-y-2">
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">
                            <span
                              className="mr-2 inline-block size-2.5 rounded-full"
                              style={{ background: batch.course.color ?? "#6366f1" }}
                            />
                            {batch.name}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {batch.course.title} · {batch.code}
                          </p>
                        </div>
                        <Badge variant="outline">
                          {batch._count.students} student{batch._count.students === 1 ? "" : "s"}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${progress}%`,
                              background: batch.course.color ?? "#6366f1",
                            }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground">{progress}%</span>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </CardContent>
          </Card>
        </Link>

        <Link to="/mentor/assignments" className="group">
          <Card className="transition-all group-hover:-translate-y-0.5 group-hover:border-primary/40 group-hover:shadow-md">
            <CardHeader>
              <CardTitle>Upcoming Assignments</CardTitle>
            </CardHeader>
            <CardContent>
              {assignments.length === 0 ? (
                <p className="text-sm text-muted-foreground">No upcoming assignments.</p>
              ) : (
                <ul className="space-y-3">
                  {assignments.map((assignment) => (
                    <li key={assignment.id} className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{assignment.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {assignment.batch.name} · {assignment._count.submissions} submissions
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        <Badge variant="outline">{formatDate(assignment.dueDate)}</Badge>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </Link>
      </div>

      <Link to="/mentor/announcements" className="group">
        <Card className="transition-all group-hover:-translate-y-0.5 group-hover:border-primary/40 group-hover:shadow-md">
          <CardHeader>
            <CardTitle>Recent Announcements</CardTitle>
          </CardHeader>
          <CardContent>
            {announcements.length === 0 ? (
              <p className="text-sm text-muted-foreground">No announcements yet.</p>
            ) : (
              <ul className="space-y-3">
                {announcements.map((announcement) => (
                  <li key={announcement.id} className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{announcement.title}</p>
                      <p className="line-clamp-2 text-xs text-muted-foreground">
                        {announcement.content}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <Badge variant="secondary">{announcement.target}</Badge>
                      <span className="text-xs text-muted-foreground">
                        {timeAgo(announcement.publishedAt ?? announcement.createdAt)}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </Link>
    </div>
  )
}
