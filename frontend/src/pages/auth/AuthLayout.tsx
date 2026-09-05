import type { ReactNode } from "react"
import { BrandLogo } from "@/components/layout/BrandLogo"

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-8 bg-background p-4 pt-safe pb-safe">
      <div className="animate-page flex flex-col items-center gap-3">
        <BrandLogo size={56} className="shadow-primary/25 shadow-lg" />
        <div className="flex flex-col items-center gap-1">
          <h1 className="text-2xl font-extrabold tracking-tight">EduPulse</h1>
          <p className="label-micro text-primary">Academy Operating System</p>
        </div>
      </div>
      <div className="animate-page w-full max-w-sm" style={{ animationDelay: "80ms" }}>
        {children}
      </div>
      <p className="pb-safe text-sm text-muted-foreground">
        &copy; {new Date().getFullYear()} EduPulse LMS
      </p>
    </div>
  )
}
