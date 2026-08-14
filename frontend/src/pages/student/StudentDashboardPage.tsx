import { CalendarCheck, GraduationCap, TrendingUp } from "lucide-react"
import { PageHeader } from "@/components/shared/PageHeader"
import { StatCard } from "@/components/shared/StatCard"
import { PageLoader } from "@/components/shared/PageLoader"
import { ErrorState } from "@/components/shared/ErrorState"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useApi } from "@/hooks/useApi"
import { formatDate, timeAgo } from "@/lib/format"

interface StudentUpcomingAssignment {
  id: string
  title: string
  dueDate: string | null
  batch: { name: string }
  mySubmission: { id: string; status: string } | null
}

interface StudentNotice {
  id: string
  title: string
  content: string
  target: string
  publishedAt: string | null
}

interface StudentDashboardData {
  batch: { id: string; name: string; code: string } | null
  stats: {
    attendancePercent: number
    attendanceToday: string | null
    courseProgressPercent: number
    upcomingAssignments: number
    averageMarks: number
  }
  upcomingAssignments: StudentUpcomingAssignment[]
  recentNotices: StudentNotice[]
  latestMarks: { id: string; marks: number; assignment: { title: string; maxMarks: number } }[]
  courseProgress: { courseId: string; title: string; color: string | null; progressPercent: number }[]
}

const todayLabel = (status: string | null) => {
  switch (status) {
    case "PRESENT":
      return "Present"
    case "LATE":
      return "Late"
    case "ABSENT":
      return "Absent"
    case "LEAVE":
      return "On leave"
    default:
      return "—"
  }
}

export function StudentDashboardPage() {
  const { data, loading, error, refetch } = useApi<StudentDashboardData>("/student/dashboard")

  if (loading) return <PageLoader />
  if (error || !data) {
    return (
      <div className="space-y-6">
        <PageHeader title="Dashboard" description="Your learning overview." />
        <ErrorState message={error ?? "Dashboard could not be loaded."} onRetry={refetch} />
      </div>
    )
  }

  const { batch, stats, upcomingAssignments, recentNotices, latestMarks, courseProgress } = data

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description={batch ? `${batch.name} (${batch.code})` : "Your learning overview."}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Attendance" value={`${stats.attendancePercent}%`} icon={CalendarCheck} to="/student/attendance" />
        <StatCard
          title="Attendance Today"
          value={todayLabel(stats.attendanceToday)}
          icon={CalendarCheck}
          hint="Today"
        />
        <StatCard
          title="Course Progress"
          value={`${stats.courseProgressPercent}%`}
          icon={GraduationCap}
          to="/student/courses"
        />
        <StatCard
          title="Average Marks"
          value={stats.averageMarks}
          icon={TrendingUp}
          hint={`${stats.upcomingAssignments} upcoming assignment${stats.upcomingAssignments === 1 ? "" : "s"}`}
          to="/student/assignments"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Course Progress</CardTitle>
          </CardHeader>
          <CardContent>
            {courseProgress.length === 0 ? (
              <p className="text-sm text-muted-foreground">You are not enrolled in any courses yet.</p>
            ) : (
              <ul className="space-y-4">
                {courseProgress.map((course) => (
                  <li key={course.courseId} className="space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <p className="truncate text-sm font-medium">
                        <span
                          className="mr-2 inline-block size-2.5 rounded-full"
                          style={{ background: course.color ?? "#6366f1" }}
                        />
                        {course.title}
                      </p>
                      <span className="text-xs text-muted-foreground">{course.progressPercent}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${course.progressPercent}%` }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming Assignments</CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingAssignments.length === 0 ? (
              <p className="text-sm text-muted-foreground">No upcoming assignments.</p>
            ) : (
              <ul className="space-y-3">
                {upcomingAssignments.map((assignment) => (
                  <li key={assignment.id} className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{assignment.title}</p>
                      <p className="text-xs text-muted-foreground">{assignment.batch.name}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {assignment.mySubmission ? (
                        <Badge variant="outline">Submitted</Badge>
                      ) : (
                        <Badge variant="secondary">Pending</Badge>
                      )}
                      <Badge variant="outline">{formatDate(assignment.dueDate)}</Badge>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Notices</CardTitle>
          </CardHeader>
          <CardContent>
            {recentNotices.length === 0 ? (
              <p className="text-sm text-muted-foreground">No notices yet.</p>
            ) : (
              <ul className="space-y-3">
                {recentNotices.map((notice) => (
                  <li key={notice.id} className="space-y-1">
                    <p className="truncate text-sm font-medium">{notice.title}</p>
                    <p className="line-clamp-2 text-xs text-muted-foreground">{notice.content}</p>
                    <p className="text-xs text-muted-foreground">{timeAgo(notice.publishedAt)}</p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Latest Marks</CardTitle>
          </CardHeader>
          <CardContent>
            {latestMarks.length === 0 ? (
              <p className="text-sm text-muted-foreground">No graded submissions yet.</p>
            ) : (
              <ul className="space-y-3">
                {latestMarks.map((submission) => (
                  <li key={submission.id} className="flex items-center justify-between gap-3">
                    <p className="truncate text-sm font-medium">{submission.assignment.title}</p>
                    <Badge variant="outline">
                      {submission.marks}/{submission.assignment.maxMarks}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
