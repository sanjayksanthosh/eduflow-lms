import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { capitalize } from "@/lib/format"

/**
 * Status pills per the EduPulse design system: label-xs uppercase,
 * 0.04em tracked, washed 10% container + strong matching text, no border.
 */
const STATUS_STYLES: Record<string, string> = {
  // Positive / fulfillment
  ACTIVE: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  PUBLISHED: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  PRESENT: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  GRADED: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  COMPLETED: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  APPROVED: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  ACCEPTED: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  SYNCED: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",

  // In progress
  IN_PROGRESS: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-400",
  ONGOING: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-400",
  ENROLLED: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-400",
  SUBMITTED: "bg-sky-500/10 text-sky-700 dark:text-sky-400",
  RECEIVED: "bg-sky-500/10 text-sky-700 dark:text-sky-400",
  LEAVE: "bg-sky-500/10 text-sky-700 dark:text-sky-400",

  // Attention / outstanding
  PENDING: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  DUE: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  LATE: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  OVERDUE: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  SUSPENDED: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  FLAGGED: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  UNDER_REVIEW: "bg-amber-500/10 text-amber-700 dark:text-amber-400",

  // Failure / limit
  ABSENT: "bg-red-500/10 text-red-700 dark:text-red-400",
  REJECTED: "bg-red-500/10 text-red-700 dark:text-red-400",
  DISQUALIFIED: "bg-red-500/10 text-red-700 dark:text-red-400",

  // Neutral
  INACTIVE: "bg-slate-500/10 text-slate-600 dark:text-slate-400",
  DRAFT: "bg-slate-500/10 text-slate-600 dark:text-slate-400",
  ARCHIVED: "bg-slate-500/10 text-slate-600 dark:text-slate-400",
  NOT_STARTED: "bg-slate-500/10 text-slate-600 dark:text-slate-400",
  UNASSIGNED: "bg-slate-500/10 text-slate-600 dark:text-slate-400",
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