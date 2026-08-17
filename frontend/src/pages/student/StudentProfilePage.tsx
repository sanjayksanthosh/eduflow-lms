import { useEffect, useState } from "react"
import { BadgeCheck, CalendarDays, Mail, MapPin, Phone, Users } from "lucide-react"
import { api, getErrorMessage } from "@/lib/api"
import { PageHeader } from "@/components/shared/PageHeader"
import { PageLoader } from "@/components/shared/PageLoader"
import { ErrorState } from "@/components/shared/ErrorState"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { fullName, getInitials, formatDate, formatDateTime } from "@/lib/format"
import { cn } from "@/lib/utils"

interface StudentProfile {
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
  batch: { id: string; name: string; code: string; course: { title: string; color: string | null } | null } | null
  attendance: { id: string; date: string; status: string }[]
  submissions: {
    id: string
    status: string
    marks: number | null
    feedback: string | null
    submittedAt: string
    assignment: { id: string; title: string; maxMarks: number }
  }[]
  stats: {
    attendancePercent: number
    attendanceRecords: number
    assignmentsSubmitted: number
    averageMarks: number
    courseProgress: number
  }
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

function DetailItem({ label, value, icon: Icon }: { label: string; value: React.ReactNode; icon: React.ElementType }) {
  return (
    <div className="flex items-start gap-3 py-3">
      <div className="rounded-md bg-muted p-2">
        <Icon className="size-4 text-muted-foreground" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="truncate text-sm font-medium">{value ?? "—"}</p>
      </div>
    </div>
  )
}

export function StudentProfilePage() {
  const [profile, setProfile] = useState<StudentProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const { data } = await api.get("/student/me")
      setProfile(data.data as StudentProfile)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  if (loading && !profile) return <PageLoader />
  if (error && !profile) {
    return (
      <div className="space-y-6">
        <PageHeader title="My Profile" description="Your personal and academic details." />
        <ErrorState message={error} onRetry={load} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader title="My Profile" description="Your personal and academic details." />

      <Card className="overflow-hidden">
        {/* Cover */}
        <div className="h-28 bg-gradient-to-r from-primary/80 via-primary/60 to-violet-400/60" />
        <CardContent className="pt-0">
          <div className="relative -mt-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-end gap-4">
              <div className="rounded-full ring-4 ring-background">
                <Avatar size="lg" className="size-20">
                  <AvatarImage
                    src={profile?.user.profileImage ?? undefined}
                    alt={profile ? fullName(profile.user.firstName, profile.user.lastName) : ""}
                  />
                  <AvatarFallback>
                    {profile ? getInitials(profile.user.firstName, profile.user.lastName) : ""}
                  </AvatarFallback>
                </Avatar>
              </div>
              <div className="pb-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl font-semibold tracking-tight">
                    {profile ? fullName(profile.user.firstName, profile.user.lastName) : ""}
                  </h2>
                  <BadgeCheck className="size-5 text-primary" />
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                  <Badge>{profile?.batch?.name ?? "No batch"}</Badge>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <SummaryTile
              label="Attendance"
              value={`${profile?.stats.attendancePercent ?? 0}%`}
              sub={`${profile?.stats.attendanceRecords ?? 0} records`}
            />
            <SummaryTile
              label="Average Marks"
              value={profile?.stats.averageMarks ?? 0}
              sub={`${profile?.stats.assignmentsSubmitted ?? 0} submitted`}
            />
            <SummaryTile
              label="Course Progress"
              value={`${profile?.stats.courseProgress ?? 0}%`}
              sub={profile?.batch?.course?.title ?? "—"}
            />
            <SummaryTile
              label="Batch"
              value={profile?.batch?.code ?? "—"}
              sub={profile?.batch?.name ?? "Not assigned"}
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Personal info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="divide-y">
            <DetailItem label="Email" value={profile?.user.email} icon={Mail} />
            <DetailItem label="Phone" value={profile?.user.phone} icon={Phone} />
            <DetailItem label="Address" value={profile?.user.address} icon={MapPin} />
            <DetailItem label="Gender" value={profile?.gender} icon={BadgeCheck} />
            <DetailItem
              label="Date of birth"
              value={profile?.dateOfBirth ? formatDate(profile.dateOfBirth) : null}
              icon={CalendarDays}
            />
            <DetailItem label="Parent / guardian" value={profile?.parentName} icon={Users} />
            <DetailItem label="Parent phone" value={profile?.parentPhone} icon={Phone} />
            <DetailItem label="Emergency contact" value={profile?.emergencyContact} icon={Phone} />
          </CardContent>
        </Card>

        <div className="space-y-4">
          {/* Recent marks */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recent Results</CardTitle>
            </CardHeader>
            <CardContent>
              {profile && profile.submissions.length === 0 ? (
                <p className="text-sm text-muted-foreground">No submissions yet.</p>
              ) : (
                <ul className="divide-y">
                  {profile?.submissions.slice(0, 6).map((sub) => (
                    <li key={sub.id} className="flex items-center justify-between gap-3 py-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{sub.assignment.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDateTime(sub.submittedAt)}
                        </p>
                      </div>
                      {sub.marks !== null ? (
                        <Badge>
                          {sub.marks}/{sub.assignment.maxMarks}
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Pending grade</Badge>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {/* Recent attendance */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recent Attendance</CardTitle>
            </CardHeader>
            <CardContent>
              {profile && profile.attendance.length === 0 ? (
                <p className="text-sm text-muted-foreground">No attendance records.</p>
              ) : (
                <ul className="divide-y">
                  {profile?.attendance.slice(0, 6).map((record) => (
                    <li key={record.id} className="flex items-center justify-between gap-3 py-3">
                      <span className="text-sm text-muted-foreground">{formatDate(record.date)}</span>
                      {statusBadge(record.status)}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function SummaryTile({ label, value, sub }: { label: string; value: React.ReactNode; sub?: string }) {
  return (
    <div className={cn("rounded-lg border p-4")}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight">{value}</p>
      {sub ? <p className="mt-0.5 truncate text-xs text-muted-foreground">{sub}</p> : null}
    </div>
  )
}
