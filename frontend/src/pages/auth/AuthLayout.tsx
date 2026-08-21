import type { ReactNode } from "react"
import { GraduationCap } from "lucide-react"

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-8 bg-muted/30 p-4 pt-safe pb-safe">
      <div className="animate-page flex flex-col items-center gap-2">
        <div className="flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/25">
          <GraduationCap className="size-7" />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">EduFlow</h1>
        <p className="text-sm text-muted-foreground">Learning Management System</p>
      </div>
      <div className="animate-page w-full max-w-sm" style={{ animationDelay: "80ms" }}>
        {children}
      </div>
      <p className="pb-safe text-sm text-muted-foreground">
        &copy; {new Date().getFullYear()} EduFlow LMS
      </p>
    </div>
  )
}
