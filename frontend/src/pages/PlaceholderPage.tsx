import { useNavigate } from "react-router-dom"
import { ArrowLeft, Construction } from "lucide-react"
import { PageHeader } from "@/components/shared/PageHeader"
import { EmptyState } from "@/components/shared/EmptyState"
import { Button } from "@/components/ui/button"

export function PlaceholderPage({ title }: { title: string }) {
  const navigate = useNavigate()
  return (
    <div className="space-y-6">
      <PageHeader title={title} />
      <EmptyState
        icon={Construction}
        title={`${title} module coming soon`}
        description="This section is part of the next build module."
        action={
          <Button variant="outline" onClick={() => navigate(-1)}>
            <ArrowLeft /> Go back
          </Button>
        }
      />
    </div>
  )
}
