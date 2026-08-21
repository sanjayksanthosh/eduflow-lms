import { useState } from "react"
import { Outlet, useLocation } from "react-router-dom"
import { GraduationCap } from "lucide-react"
import { useAuth } from "@/context/AuthContext"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet"
import { SidebarContent } from "@/components/layout/Sidebar"
import { BottomNav } from "@/components/layout/BottomNav"
import { ThemeToggle } from "@/components/layout/ThemeToggle"
import { UserMenu } from "@/components/layout/UserMenu"
import { NAV_ITEMS } from "@/lib/nav"

export function AppLayout() {
  const { user } = useAuth()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const location = useLocation()

  const entries = NAV_ITEMS[user?.role ?? "ADMIN"] ?? []

  return (
    <div className="flex min-h-screen bg-muted/30">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r bg-background lg:block">
        <SidebarContent entries={entries} />
      </aside>

      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent side="left" className="w-64 p-0">
          <SheetTitle className="sr-only">Navigation menu</SheetTitle>
          <SheetDescription className="sr-only">
            Application navigation for {user?.role.toLowerCase() ?? "user"}.
          </SheetDescription>
          <SidebarContent entries={entries} onNavigate={() => setDrawerOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 flex-1 flex-col lg:pl-64">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-2 border-b bg-background/95 px-4 pt-safe backdrop-blur lg:pt-0">
          <button
            type="button"
            aria-label="Open menu"
            onClick={() => setDrawerOpen(true)}
            className="flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground active:scale-95 lg:hidden"
          >
            <GraduationCap className="size-6 text-primary" />
          </button>
          <div className="flex-1" />
          <ThemeToggle />
          <UserMenu />
        </header>
        <main key={location.pathname} className="animate-page flex-1 p-4 pb-28 lg:p-6 lg:pb-6">
          <Outlet />
        </main>
      </div>

      <BottomNav entries={entries} />
    </div>
  )
}
