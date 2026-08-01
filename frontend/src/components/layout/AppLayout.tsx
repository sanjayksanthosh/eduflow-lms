import { useState } from "react"
import { Link, Outlet } from "react-router-dom"
import { Menu } from "lucide-react"
import { useAuth } from "@/context/AuthContext"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { SidebarContent } from "@/components/layout/Sidebar"
import { ThemeToggle } from "@/components/layout/ThemeToggle"
import { UserMenu } from "@/components/layout/UserMenu"
import { NAV_ITEMS } from "@/lib/nav"

export function AppLayout() {
  const { user } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)

  const entries = NAV_ITEMS[user?.role ?? "ADMIN"] ?? []

  return (
    <div className="flex min-h-screen bg-muted/30">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r bg-background lg:block">
        <SidebarContent entries={entries} />
      </aside>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetTrigger
          render={
            <Button variant="ghost" size="icon-sm" className="lg:hidden" aria-label="Open menu">
              <Menu className="size-4" />
            </Button>
          }
        />
        <SheetContent side="left" className="w-64 p-0">
          <SheetTitle className="sr-only">Navigation menu</SheetTitle>
          <SheetDescription className="sr-only">
            Application navigation for {user?.role.toLowerCase() ?? "user"}.
          </SheetDescription>
          <SidebarContent entries={entries} onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 flex-1 flex-col lg:pl-64">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-2 border-b bg-background/95 px-4 backdrop-blur">
          <span className="lg:hidden">
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Open menu"
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="size-4" />
            </Button>
          </span>
          <Link to={user ? `/${user.role.toLowerCase()}` : "/"} className="font-semibold lg:hidden">
            EduFlow
          </Link>
          <div className="flex-1" />
          <ThemeToggle />
          <UserMenu />
        </header>
        <main className="flex-1 p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
