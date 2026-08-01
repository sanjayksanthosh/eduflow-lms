import { NavLink } from "react-router-dom"
import { GraduationCap } from "lucide-react"
import { cn } from "@/lib/utils"
import type { NavEntry } from "@/lib/nav"

interface SidebarContentProps {
  entries: NavEntry[]
  onNavigate?: () => void
}

export function SidebarContent({ entries, onNavigate }: SidebarContentProps) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
        <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <GraduationCap className="size-5" />
        </div>
        <span className="text-lg font-semibold tracking-tight">EduFlow</span>
      </div>
      <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
        {entries.map((entry, index) => {
          if ("section" in entry) {
            return (
              <p
                key={`section-${index}`}
                className="px-2 pt-4 pb-1 text-xs font-medium tracking-wide text-muted-foreground"
              >
                {entry.section.toUpperCase()}
              </p>
            )
          }
          const Icon = entry.icon
          return (
            <NavLink
              key={entry.to}
              to={entry.to}
              end={entry.to.split("/").length === 2}
              onClick={onNavigate}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                  isActive && "bg-muted font-medium text-foreground"
                )
              }
            >
              <Icon className="size-4" />
              {entry.label}
            </NavLink>
          )
        })}
      </nav>
    </div>
  )
}
