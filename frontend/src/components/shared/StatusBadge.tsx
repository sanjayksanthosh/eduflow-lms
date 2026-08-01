import { Badge } from "@/components/ui/badge"
import { capitalize } from "@/lib/format"

const STATUS_STYLES: Record<string, string> = {
  ACTIVE: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30 dark:text-emerald-400",
  INACTIVE: "bg-muted text-muted-foreground border-border",
  SUSPENDED: "bg-amber-500/15 text-amber-700 border-amber-500/30 dark:text-amber-400",
  COMPLETED: "bg-sky-500/15 text-sky-700 border-sky-500/30 dark:text-sky-400",
  ARCHIVED: "bg-muted text-muted-foreground border-border",
  DRAFT: "bg-muted text-muted-foreground border-border",
  PUBLISHED: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30 dark:text-emerald-400",
  PENDING: "bg-amber-500/15 text-amber-700 border-amber-500/30 dark:text-amber-400",
  SUBMITTED: "bg-sky-500/15 text-sky-700 border-sky-500/30 dark:text-sky-400",
  GRADED: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30 dark:text-emerald-400",
  PRESENT: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30 dark:text-emerald-400",
  ABSENT: "bg-destructive/10 text-destructive border-destructive/30",
  LATE: "bg-amber-500/15 text-amber-700 border-amber-500/30 dark:text-amber-400",
  LEAVE: "bg-sky-500/15 text-sky-700 border-sky-500/30 dark:text-sky-400",
}

interface StatusBadgeProps {
  status: string
  label?: string
}

export function StatusBadge({ status, label }: StatusBadgeProps) {
  return (
    <Badge variant="outline" className={STATUS_STYLES[status]}>
      {label ?? capitalize(status)}
    </Badge>
  )
}
