import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

export function PageLoader({ className }: { className?: string }) {
  return (
    <div className={cn("flex min-h-[40vh] items-center justify-center", className)}>
      <Loader2 className="size-8 animate-spin text-muted-foreground" />
    </div>
  )
}

export function InlineLoader({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center justify-center py-8", className)}>
      <Loader2 className="size-5 animate-spin text-muted-foreground" />
    </div>
  )
}
