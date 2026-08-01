import type { ReactNode } from "react"
import { GraduationCap } from "lucide-react"

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-muted/30 p-4">
      <div className="flex flex-col items-center gap-2">
        <div className="flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <GraduationCap className="size-7" />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">EduFlow</h1>
        <p className="text-sm text-muted-foreground">Learning Management System</p>
      </div>
      <div className="w-full max-w-sm">{children}</div>
      <p className="text-sm text-muted-foreground">
        &copy; {new Date().getFullYear()} EduFlow LMS
      </p>
    </div>
  )
}
