import {
  Activity,
  BookOpen,
  BookPlus,
  ClipboardCheck,
  FileSpreadsheet,
  Library,
  PackagePlus,
  Plus,
  UserCheck,
  UserPlus,
  Users,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { Link } from "react-router-dom"
import { PageHeader } from "@/components/shared/PageHeader"
import { StatCard } from "@/components/shared/StatCard"
import { PageLoader } from "@/components/shared/PageLoader"
import { ErrorState } from "@/components/shared/ErrorState"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useApi } from "@/hooks/useApi"
import { timeAgo } from "@/lib/format"
import { cn } from "@/lib/utils"
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

const ACTIVITY_STYLES: Record<string, { icon: LucideIcon; className: string }> = {
  LOGIN: { icon: Activity, className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
  CREATE: { icon: Plus, className: "bg-primary/10 text-primary" },
  UPDATE: { icon: ClipboardCheck, className: "bg-sky-500/10 text-sky-600 dark:text-sky-400" },
  DELETE: { icon: UserCheck, className: "bg-red-500/10 text-red-600 dark:text-red-400" },
}

const quickActions = [
  { label: "Add Student", sub: "Enroll learner", icon: UserPlus, to: "/admin/students", tile: "bg-primary/10 text-primary" },
  { label: "Create Batch", sub: "Setup cohort", icon: PackagePlus, to: "/admin/batches", tile: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
  { label: "New Course", sub: "Curriculum draft", icon: BookPlus, to: "/admin/courses", tile: "bg-sky-500/10 text-sky-600 dark:text-sky-400" },
  { label: "Ledger Export", sub: "PDF / XLSX data", icon: FileSpreadsheet, to: "/admin/reports", tile: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
]

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
    <div className="animate-page space-y-6">
      <PageHeader
        title="Institution Dashboard"
        description="Real-time pulse of students, mentors, batches and courses."
        actions={
          <Link to="/admin/students">
            <Button>
              <Plus /> Add student
            </Button>
          </Link>
        }
      />

      <div className="stagger grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Students"
          value={stats.totalStudents}
          icon={Users}
          tone="primary"
          hint="Across all active cohorts"
          to="/admin/students"
        />
        <StatCard
          title="Total Mentors"
          value={stats.totalMentors}
          icon={UserCheck}
          tone="info"
          hint="On faculty"
          to="/admin/mentors"
        />
        <StatCard
          title="Batches"
          value={stats.totalBatches}
          icon={BookOpen}
          tone="success"
          hint="Running cohorts"
          to="/admin/batches"
        />
        <StatCard
          title="Courses"
          value={stats.totalCourses}
          icon={Library}
          tone="warning"
          hint="Curriculum catalog"
          to="/admin/courses"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3 xl:grid-cols-4">
        <Card className="lg:col-span-1 xl:col-span-1">
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle>Direct Dispatch</CardTitle>
            <span className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
              Quick actions
            </span>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            {quickActions.map((action) => (
              <Link
                key={action.to}
                to={action.to}
                className="group flex flex-col gap-2 rounded-xl border border-border bg-muted/40 p-3 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md active:scale-[0.98]"
              >
                <action.icon className={cn("size-8 rounded-lg p-1.5", action.tile)} />
                <span className="text-sm font-semibold leading-tight">{action.label}</span>
                <span className="text-xs text-muted-foreground">{action.sub}</span>
              </Link>
            ))}
          </CardContent>
        </Card>

        <Link to="/admin/activity" className="group lg:col-span-2">
          <Card className="h-full transition-all group-hover:-translate-y-0.5 group-hover:border-primary/40 group-hover:shadow-md">
            <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle>Operational Audit Log</CardTitle>
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
                <span className="size-1.5 animate-pulse rounded-full bg-emerald-500" />
                Stream active
              </span>
            </CardHeader>
            <CardContent className="space-y-1">
              {recentActivities.length === 0 ? (
                <p className="text-sm text-muted-foreground">No recent activity.</p>
              ) : (
                recentActivities.slice(0, 6).map((activity) => {
                  const activityStyle = ACTIVITY_STYLES[activity.type] ?? {
                    icon: Activity,
                    className: "bg-slate-500/10 text-slate-600 dark:text-slate-400",
                  }
                  return (
                    <div
                      key={activity.id}
                      className="flex items-center justify-between gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-muted/40"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-xl", activityStyle.className)}>
                          <activityStyle.icon className="size-4" />
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{activity.action}</p>
                          <p className="truncate text-xs text-muted-foreground">
                            {activity.user
                              ? `${activity.user.firstName} ${activity.user.lastName} · ${activity.user.role.toLowerCase()}`
                              : "System"}
                          </p>
                        </div>
                      </div>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {timeAgo(activity.createdAt)}
                      </span>
                    </div>
                  )
                })
              )}
            </CardContent>
          </Card>
        </Link>

        <Card className="lg:col-span-3 xl:col-span-1 xl:col-start-4">
          <CardHeader className="pb-3">
            <CardTitle>Institution Health</CardTitle>
          </CardHeader>
          <CardContent className="flex h-full flex-col justify-between gap-5">
            <div className="space-y-4">
              <div>
                <div className="mb-1.5 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Assignments submitted</span>
                  <span className="font-semibold">
                    {stats.assignmentSubmissionCount} ({stats.assignmentSubmissionRate}%)
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${stats.assignmentSubmissionRate}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="mb-1.5 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Submissions graded</span>
                  <span className="font-semibold">{stats.submissionGradingRate}%</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all"
                    style={{ width: `${stats.submissionGradingRate}%` }}
                  />
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-border bg-muted/40 px-3 py-2.5">
              <span className="text-sm text-muted-foreground">Attendance today</span>
              <span className="text-sm font-bold">{stats.todayAttendance} records</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}