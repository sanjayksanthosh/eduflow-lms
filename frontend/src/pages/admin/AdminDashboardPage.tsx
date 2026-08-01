import { BookOpen, Library, UserCheck, Users } from "lucide-react"
import { PageHeader } from "@/components/shared/PageHeader"
import { StatCard } from "@/components/shared/StatCard"
import { PageLoader } from "@/components/shared/PageLoader"
import { ErrorState } from "@/components/shared/ErrorState"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useApi } from "@/hooks/useApi"
import { timeAgo } from "@/lib/format"
import type { DashboardStats } from "@/lib/types"

interface DashboardActivity {
  id: string
  type: string
  action: string
  createdAt: string
  user: { firstName: string; lastName: string; role: string } | null
}

interface AdminDashboardData {
  stats: DashboardStats
  recentActivities: DashboardActivity[]
}

export function AdminDashboardPage() {
  const { data, loading, error, refetch } = useApi<AdminDashboardData>("/admin/dashboard")

  if (loading) return <PageLoader />
  if (error || !data) {
    return (
      <div className="space-y-6">
        <PageHeader title="Dashboard" description="Overview of the institution." />
        <ErrorState message={error ?? "Dashboard could not be loaded."} onRetry={refetch} />
      </div>
    )
  }

  const { stats, recentActivities } = data

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" description="Overview of your institution." />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total Students" value={stats.totalStudents} icon={Users} />
        <StatCard title="Total Mentors" value={stats.totalMentors} icon={UserCheck} />
        <StatCard title="Batches" value={stats.totalBatches} icon={BookOpen} />
        <StatCard title="Courses" value={stats.totalCourses} icon={Library} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent activity</CardTitle>
          </CardHeader>
          <CardContent>
            {recentActivities.length === 0 ? (
              <p className="text-sm text-muted-foreground">No recent activity.</p>
            ) : (
              <ul className="space-y-3">
                {recentActivities.slice(0, 8).map((activity) => (
                  <li key={activity.id} className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm">{activity.action}</p>
                      <p className="text-xs text-muted-foreground">
                        {activity.user
                          ? `${activity.user.firstName} ${activity.user.lastName} (${activity.user.role.toLowerCase()})`
                          : "System"}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <Badge variant="outline">{activity.type}</Badge>
                      <span className="text-xs text-muted-foreground">
                        {timeAgo(activity.createdAt)}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Institution health</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Assignments submitted</span>
              <span className="text-sm font-medium">
                {stats.assignmentSubmissionCount} ({stats.assignmentSubmissionRate}%)
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Submissions graded</span>
              <span className="text-sm font-medium">{stats.submissionGradingRate}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Attendance today</span>
              <span className="text-sm font-medium">{stats.todayAttendance} records</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
