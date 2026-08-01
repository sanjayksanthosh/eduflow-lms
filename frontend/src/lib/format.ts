import { format, formatDistanceToNow, parseISO } from "date-fns"

export function formatDate(value: string | Date | null | undefined, pattern = "MMM d, yyyy"): string {
  if (!value) return "—"
  const date = typeof value === "string" ? parseISO(value) : value
  if (Number.isNaN(date.getTime())) return "—"
  return format(date, pattern)
}

export function formatDateTime(value: string | Date | null | undefined): string {
  return formatDate(value, "MMM d, yyyy h:mm a")
}

export function timeAgo(value: string | Date | null | undefined): string {
  if (!value) return "—"
  const date = typeof value === "string" ? parseISO(value) : value
  if (Number.isNaN(date.getTime())) return "—"
  return formatDistanceToNow(date, { addSuffix: true })
}

export function getInitials(firstName?: string | null, lastName?: string | null): string {
  return `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`.toUpperCase() || "?"
}

export function fullName(firstName?: string | null, lastName?: string | null): string {
  return [firstName, lastName].filter(Boolean).join(" ") || "—"
}

export function capitalize(value: string | null | undefined): string {
  if (!value) return "—"
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase()
}
