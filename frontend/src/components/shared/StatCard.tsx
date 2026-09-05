import type { LucideIcon } from "lucide-react"
import { TrendingDown, TrendingUp } from "lucide-react"
import { Link } from "react-router-dom"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

type StatTone = "primary" | "success" | "warning" | "danger" | "info" | "neutral"

const TONE_STYLES: Record<StatTone, string> = {
  primary: "bg-primary/10 text-primary",
  success: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  warning: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  danger: "bg-red-500/10 text-red-600 dark:text-red-400",
  info: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
  neutral: "bg-muted text-muted-foreground",
}

interface StatCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  /** Small muted caption below the value */
  hint?: string
  /** Trending pill text, e.g. "+12.4%" */
  trend?: string
  trendDirection?: "up" | "down"
  tone?: StatTone
  className?: string
  to?: string
}

export function StatCard({
  title,
  value,
  icon: Icon,
  hint,
  trend,
  trendDirection = "up",
  tone = "primary",
  className,
  to,
}: StatCardProps) {
  const content = (
    <CardContent className="p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="label-micro text-muted-foreground">{title}</p>
        <Icon className={cn("size-9 shrink-0 rounded-xl p-2", TONE_STYLES[tone])} />
      </div>
      <p className="stat-value mt-3 text-foreground">{value}</p>
      <div className="mt-2.5">
        {trend ? (
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide",
              trendDirection === "down"
                ? "bg-red-500/10 text-red-600 dark:text-red-400"
                : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
            )}
          >
            {trendDirection === "down" ? (
              <TrendingDown className="size-3" />
            ) : (
              <TrendingUp className="size-3" />
            )}
            {trend}
          </span>
        ) : hint ? (
          <span className="text-xs text-muted-foreground">{hint}</span>
        ) : null}
      </div>
    </CardContent>
  )

  const cardClass = cn(
    "group transition-all",
    to && "cursor-pointer hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md",
    className
  )

  if (to) {
    return (
      <Link to={to} className={cn("block", className)}>
        <Card className={cardClass}>{content}</Card>
      </Link>
    )
  }

  return <Card className={cardClass}>{content}</Card>
}