import type { LucideIcon } from "lucide-react"
import { ArrowUpRight } from "lucide-react"
import { Link } from "react-router-dom"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface StatCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  hint?: string
  className?: string
  to?: string
}

export function StatCard({ title, value, icon: Icon, hint, className, to }: StatCardProps) {
  const content = (
    <CardContent className="p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1.5">
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-3xl font-semibold tracking-tight">{value}</p>
          {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
        </div>
        <div className="relative rounded-lg bg-muted p-2.5">
          <Icon className="size-5 text-muted-foreground" />
          {to ? (
            <ArrowUpRight className="absolute -right-1 -top-1 size-3.5 text-primary opacity-0 transition-opacity group-hover:opacity-100" />
          ) : null}
        </div>
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
