import { useNavigate } from "react-router-dom"
import { ArrowRight, GraduationCap } from "lucide-react"
import { PageHeader } from "@/components/shared/PageHeader"
import { EmptyState } from "@/components/shared/EmptyState"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/context/AuthContext"

export function StudentDashboardPage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome back, ${user?.firstName ?? "Student"}`}
        description="Track your courses, attendance and assignments."
      />
      <EmptyState
        icon={GraduationCap}
        title="Student dashboard coming soon"
        description="Your courses, progress and notifications will appear here in the next module."
        action={
          <Button onClick={() => navigate("/student/courses")}>
            Go to courses <ArrowRight />
          </Button>
        }
      />
    </div>
  )
}
