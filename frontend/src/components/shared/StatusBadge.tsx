import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { capitalize } from "@/lib/format"

/**
 * Status pills per the Berry (CodedThemes) design language:
 * soft-tinted backgrounds with strong matching text.
 */
const STATUS_STYLES: Record<string, string> = {
  // Positive / fulfillment (Berry success: light #b9f6ca / dark #00c853)
  ACTIVE: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400",
  PUBLISHED: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400",
  PRESENT: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400",
  GRADED: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400",
  COMPLETED: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400",
  APPROVED: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400",
  ACCEPTED: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400",
  SYNCED: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400",

  // In progress (Berry primary: light #e3f2fd / main #2196f3)
  IN_PROGRESS: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400",
  ONGOING: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400",
  ENROLLED: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400",
  SUBMITTED: "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-400",
  RECEIVED: "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-400",
  LEAVE: "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-400",

  // Attention / outstanding (Berry warning: light #fff8e1 / dark #ffc107)
  PENDING: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
  DUE: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
  LATE: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
  OVERDUE: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
  SUSPENDED: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
  FLAGGED: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
  UNDER_REVIEW: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",

  // Failure / limit (Berry error: light #ef9a9a / dark #c62828)
  ABSENT: "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400",
  REJECTED: "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400",
  DISQUALIFIED: "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400",

  // Neutral (Berry grey: 100 #eef2f6 / 600 #4b5565)
  INACTIVE: "bg-slate-200/60 text-slate-600 dark:bg-slate-500/15 dark:text-slate-400",
  DRAFT: "bg-slate-200/60 text-slate-600 dark:bg-slate-500/15 dark:text-slate-400",
  ARCHIVED: "bg-slate-200/60 text-slate-600 dark:bg-slate-500/15 dark:text-slate-400",
  NOT_STARTED: "bg-slate-200/60 text-slate-600 dark:bg-slate-500/15 dark:text-slate-400",
  UNASSIGNED: "bg-slate-200/60 text-slate-600 dark:bg-slate-500/15 dark:text-slate-400",
}

interface StatusBadgeProps {
  status: string
  label?: string
  className?: string
}

export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "rounded-full border-transparent px-2 py-1 text-[11px] font-bold uppercase tracking-wide",
        STATUS_STYLES[status] ?? "bg-muted text-muted-foreground",
        className
      )}
    >
      {label ?? capitalize(status).replace(/_/g, " ")}
    </Badge>
  )
}