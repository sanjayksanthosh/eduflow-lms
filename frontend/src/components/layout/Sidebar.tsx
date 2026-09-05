import { NavLink } from "react-router-dom"
import { cn } from "@/lib/utils"
import { BrandLogo } from "@/components/layout/BrandLogo"
import type { NavEntry } from "@/lib/nav"

interface SidebarContentProps {
  entries: NavEntry[]
  onNavigate?: () => void
}

export function SidebarContent({ entries, onNavigate }: SidebarContentProps) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 shrink-0 items-center gap-2.5 border-b px-4">
        <BrandLogo size={32} />
        <div className="flex flex-col leading-none">
          <span className="text-[15px] font-extrabold tracking-tight text-foreground">
            EduPulse
          </span>
          <span className="label-micro mt-1 text-primary">Academy OS</span>
        </div>
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
                  "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                  isActive && "bg-primary/10 font-semibold text-primary hover:bg-primary/10 hover:text-primary"
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
