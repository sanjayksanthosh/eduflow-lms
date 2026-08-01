import { useNavigate } from "react-router-dom"
import { ArrowRight, LayoutDashboard } from "lucide-react"
import { PageHeader } from "@/components/shared/PageHeader"
import { EmptyState } from "@/components/shared/EmptyState"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/context/AuthContext"
import { fullName } from "@/lib/format"

export function MentorDashboardPage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome back, ${user?.firstName ?? "Mentor"}`}
        description={`Here is your dashboard, ${fullName(user?.firstName, user?.lastName)}.`}
      />
      <EmptyState
        icon={LayoutDashboard}
        title="Mentor dashboard coming soon"
        description="Batches, attendance, assignments and announcements will appear here in the next module."
        action={
          <Button onClick={() => navigate("/mentor/batches")}>
            Go to batches <ArrowRight />
          </Button>
        }
      />
    </div>
  )
}
