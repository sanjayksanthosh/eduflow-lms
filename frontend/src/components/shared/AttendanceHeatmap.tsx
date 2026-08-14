import { useMemo } from "react"
import { cn } from "@/lib/utils"

interface HeatmapRecord {
  date: string
  status: string
}

const WEEKS = 26

const toKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
]

const cellClass = (status: string | undefined) => {
  switch (status) {
    case "PRESENT":
      return "bg-emerald-600"
    case "LATE":
      return "bg-emerald-400"
    case "LEAVE":
      return "bg-emerald-200"
    case "ABSENT":
      return "bg-red-300"
    default:
      return "bg-muted"
  }
}

const statusLabel = (status: string | undefined) => {
  switch (status) {
    case "PRESENT":
      return "Present"
    case "LATE":
      return "Late"
    case "LEAVE":
      return "On leave"
    case "ABSENT":
      return "Absent"
    default:
      return "No record"
  }
}

export function AttendanceHeatmap({ records }: { records: HeatmapRecord[] }) {
  const { weeks, labels, counts } = useMemo(() => {
    const byDate = new Map<string, string>()
    for (const record of records) {
      byDate.set(toKey(new Date(record.date)), record.status)
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const daysSinceMonday = (today.getDay() + 6) % 7
    const lastMonday = new Date(today)
    lastMonday.setDate(today.getDate() - daysSinceMonday)
    const start = new Date(lastMonday)
    start.setDate(lastMonday.getDate() - (WEEKS - 1) * 7)

    const weekData: { date: Date; status: string | undefined }[][] = []
    for (let w = 0; w < WEEKS; w++) {
      const week: { date: Date; status: string | undefined }[] = []
      for (let d = 0; d < 7; d++) {
        const date = new Date(start)
        date.setDate(start.getDate() + w * 7 + d)
        week.push({ date, status: byDate.get(toKey(date)) })
      }
      weekData.push(week)
    }

    const labelData: { month: string; count: number }[] = []
    for (const week of weekData) {
      const month = MONTHS[week[0].date.getMonth()]
      const last = labelData[labelData.length - 1]
      if (last && last.month === month) last.count++
      else labelData.push({ month, count: 1 })
    }

    const statusCounts: Record<string, number> = {}
    for (const record of records) {
      statusCounts[record.status] = (statusCounts[record.status] ?? 0) + 1
    }

    return { weeks: weekData, labels: labelData, counts: statusCounts }
  }, [records])

  const columnWidth = (count: number) => `${count * 13 - 3}px`

  return (
    <div className="overflow-x-auto">
      <div className="inline-block min-w-max">
        {/* Month labels */}
        <div className="mb-1.5 flex gap-[3px] pl-9">
          {labels.map((label, i) => (
            <span
              key={i}
              className="text-xs text-muted-foreground"
              style={{ width: columnWidth(label.count) }}
            >
              {label.month}
            </span>
          ))}
        </div>

        <div className="flex gap-[3px]">
          {/* Weekday labels */}
          <div className="w-8 shrink-0 space-y-[3px] pr-1 text-xs leading-[10px] text-muted-foreground">
            <span className="block">Mon</span>
            <span className="block" />
            <span className="block">Wed</span>
            <span className="block" />
            <span className="block">Fri</span>
            <span className="block" />
            <span className="block" />
          </div>

          {/* Day cells */}
          <div className="flex gap-[3px]">
            {weeks.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-[3px]">
                {week.map((cell, di) => (
                  <div
                    key={di}
                    title={`${toKey(cell.date)} · ${statusLabel(cell.status)}`}
                    className={cn("size-[10px] rounded-[2px]", cellClass(cell.status))}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="mt-3 flex items-center justify-end gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="size-[10px] rounded-[2px] bg-emerald-600" />
            {counts.PRESENT ? `${counts.PRESENT} present` : "Present"}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-[10px] rounded-[2px] bg-emerald-400" />
            {counts.LATE ? `${counts.LATE} late` : "Late"}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-[10px] rounded-[2px] bg-emerald-200" />
            {counts.LEAVE ? `${counts.LEAVE} leave` : "On leave"}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-[10px] rounded-[2px] bg-red-300" />
            {counts.ABSENT ? `${counts.ABSENT} absent` : "Absent"}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-[10px] rounded-[2px] bg-muted" />
            No record
          </span>
        </div>
      </div>
    </div>
  )
}
