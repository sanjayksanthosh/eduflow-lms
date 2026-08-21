import { useState } from "react"
import { NavLink, useLocation } from "react-router-dom"
import { MoreHorizontal } from "lucide-react"
import { cn } from "@/lib/utils"
import type { NavEntry } from "@/lib/nav"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet"
import { SidebarContent } from "@/components/layout/Sidebar"

interface BottomNavProps {
  entries: NavEntry[]
}

/**
 * App-style bottom navigation for mobile. Shows the first four primary
 * destinations plus a "More" button that opens the full navigation sheet.
 */
export function BottomNav({ entries }: BottomNavProps) {
  const [moreOpen, setMoreOpen] = useState(false)
  const location = useLocation()

  const links = entries.filter((e): e is Extract<NavEntry, { to: string }> => "to" in e)
  const primary = links.slice(0, 4)

  const isActive = (to: string) =>
    to.split("/").length === 2
      ? location.pathname === to
      : location.pathname.startsWith(to)

  return (
    <>
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t bg-background/95 backdrop-blur lg:hidden animate-nav-in pb-safe">
        <div className="grid auto-cols-fr grid-flow-col">
          {primary.map((entry) => {
            const Icon = entry.icon
            const active = isActive(entry.to)
            return (
              <NavLink
                key={entry.to}
                to={entry.to}
                end={entry.to.split("/").length === 2}
                className={cn(
                  "flex min-h-14 flex-col items-center justify-center gap-0.5 px-1 text-[10px] font-medium text-muted-foreground transition-colors active:scale-95",
                  active && "text-primary"
                )}
              >
                <span
                  className={cn(
                    "flex h-7 w-12 items-center justify-center rounded-full transition-colors",
                    active && "bg-primary/10"
                  )}
                >
                  <Icon className="size-5" />
                </span>
                <span className="max-w-full truncate">{entry.label}</span>
              </NavLink>
            )
          })}
          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            className={cn(
              "flex min-h-14 flex-col items-center justify-center gap-0.5 px-1 text-[10px] font-medium text-muted-foreground transition-colors active:scale-95",
              moreOpen && "text-primary"
            )}
          >
            <span className="flex h-7 w-12 items-center justify-center rounded-full transition-colors">
              <MoreHorizontal className="size-5" />
            </span>
            More
          </button>
        </div>
      </nav>

      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent side="left" className="w-72 p-0">
          <SheetTitle className="sr-only">All pages</SheetTitle>
          <SheetDescription className="sr-only">Complete navigation menu.</SheetDescription>
          <SidebarContent entries={entries} onNavigate={() => setMoreOpen(false)} />
        </SheetContent>
      </Sheet>
    </>
  )
}
