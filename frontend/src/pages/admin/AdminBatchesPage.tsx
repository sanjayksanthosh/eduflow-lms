import { useEffect, useMemo, useState } from "react"
import { BookOpen, MoreHorizontal, Pencil, Plus, Trash2, UserRound } from "lucide-react"
import { toast } from "sonner"
import { api, getErrorMessage } from "@/lib/api"
import { useListData } from "@/hooks/useListData"
import { PageHeader } from "@/components/shared/PageHeader"
import { DataTable, type Column } from "@/components/shared/DataTable"
import { Pagination } from "@/components/shared/Pagination"
import { SearchInput } from "@/components/shared/SearchInput"
import { ConfirmDialog } from "@/components/shared/ConfirmDialog"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { ErrorState } from "@/components/shared/ErrorState"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { formatDate, fullName, getInitials } from "@/lib/format"
import type { Batch, BatchDetail, Course, Mentor, Student } from "@/lib/types"

const PAGE_SIZE = 10
const BATCH_STATUSES = ["ACTIVE", "COMPLETED", "ARCHIVED"]
const DAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"]
const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

interface BatchFormState {
  name: string
  courseId: string
  mentorId: string
  startDate: string
  capacity: string
  status: string
  description: string
  classDays: number[]
  classTime: string
}

const emptyForm: BatchFormState = {
  name: "",
  courseId: "",
  mentorId: "",
  startDate: "",
  capacity: "30",
  status: "ACTIVE",
  description: "",
  classDays: [],
  classTime: "",
}

function formatClassSchedule(classDays?: number[], classTime?: string | null): string {
  if (!classDays || classDays.length === 0) return ""
  const days = [...classDays].sort().map((d) => DAY_NAMES[d] ?? String(d)).join(", ")
  return classTime ? `${days} · ${classTime}` : days
}

interface BatchFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  batch: Batch | null
  courses: Course[]
  mentors: Mentor[]
  onSaved: () => void
}

function BatchFormDialog({ open, onOpenChange, batch, courses, mentors, onSaved }: BatchFormDialogProps) {
  const isEdit = Boolean(batch)
  const [form, setForm] = useState<BatchFormState>(emptyForm)
  const [submitting, setSubmitting] = useState(false)

  const set = <K extends keyof BatchFormState>(key: K, value: BatchFormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  useEffect(() => {
    if (!open) return
    setForm(
      batch
        ? {
            name: batch.name,
            courseId: batch.courseId,
            mentorId: batch.mentorId ?? "",
            startDate: batch.startDate ? batch.startDate.slice(0, 10) : "",
            capacity: String(batch.capacity),
            status: batch.status,
            description: batch.description ?? "",
            classDays: (batch.classDays as number[] | undefined) ?? [],
            classTime: batch.classTime ?? "",
          }
        : emptyForm
    )
  }, [open, batch])

  const toggleDay = (day: number) =>
    setForm((prev) => ({
      ...prev,
      classDays: prev.classDays.includes(day)
        ? prev.classDays.filter((d) => d !== day)
        : [...prev.classDays, day],
    }))

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.courseId) {
      toast.error("Name and course are required.")
      return
    }
    setSubmitting(true)
    try {
      const payload = {
        name: form.name,
        courseId: form.courseId,
        capacity: Number(form.capacity) || 30,
        status: form.status,
        ...(form.mentorId ? { mentorId: form.mentorId } : {}),
        ...(form.startDate ? { startDate: form.startDate } : {}),
        ...(form.description.trim() ? { description: form.description } : {}),
        classDays: form.classDays,
        ...(form.classTime ? { classTime: form.classTime } : {}),
      }
      if (isEdit) {
        await api.patch(`/admin/batches/${batch!.id}`, payload)
        toast.success("Batch updated.")
      } else {
        await api.post("/admin/batches", payload)
        toast.success("Batch created.")
      }
      onOpenChange(false)
      onSaved()
    } catch (error) {
      toast.error(getErrorMessage(error))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Batch" : "Create Batch"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">Batch name</Label>
            <Input id="name" value={form.name} placeholder="e.g. Morning Batch A" onChange={(e) => set("name", e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Course</Label>
              <Select value={form.courseId} onValueChange={(v) => set("courseId", v ?? "")}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select course" />
                </SelectTrigger>
                <SelectContent>
                  {courses.map((course) => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.title} ({course.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Mentor</Label>
              <Select value={form.mentorId} onValueChange={(v) => set("mentorId", v ?? "")}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select mentor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {mentors.map((mentor) => (
                    <SelectItem key={mentor.id} value={mentor.id}>
                      {fullName(mentor.user.firstName, mentor.user.lastName)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Class days</Label>
            <div className="flex justify-between gap-1.5">
              {DAY_LABELS.map((label, day) => {
                const active = form.classDays.includes(day)
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDay(day)}
                    aria-pressed={active}
                    aria-label={DAY_NAMES[day]}
                    className={`flex size-11 shrink-0 items-center justify-center rounded-full border text-sm font-medium transition-all active:scale-95 ${
                      active
                        ? "border-primary bg-primary text-primary-foreground shadow-sm"
                        : "bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground"
                    }`}
                  >
                    {label}
                  </button>
                )
              })}
            </div>
            {form.classDays.length > 0 ? (
              <p className="text-xs text-muted-foreground">
                Every {form.classDays.slice().sort().map((d) => DAY_NAMES[d]).join(", ")}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">Tap days when this batch meets.</p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="classTime">Class time</Label>
              <Input
                id="classTime"
                type="time"
                value={form.classTime}
                onChange={(e) => set("classTime", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="start">Start date</Label>
              <Input
                id="start"
                type="date"
                value={form.startDate}
                onChange={(e) => set("startDate", e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="capacity">Capacity</Label>
              <Input
                id="capacity"
                type="number"
                min={1}
                value={form.capacity}
                onChange={(e) => set("capacity", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => set("status", v ?? "ACTIVE")}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BATCH_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s[0] + s.slice(1).toLowerCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Saving..." : isEdit ? "Save changes" : "Create batch"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

interface BatchDetailDialogProps {
  batchId: string | null
  onClose: () => void
  onSaved: () => void
}

function BatchDetailDialog({ batchId, onClose, onSaved }: BatchDetailDialogProps) {
  const [detail, setDetail] = useState<BatchDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [assignOpen, setAssignOpen] = useState(false)
  const [selected, setSelected] = useState<string[]>([])
  const [busy, setBusy] = useState(false)

  const allStudents = useListData<Student>("/admin/students?page=1&limit=100", [batchId])

  const load = async () => {
    if (!batchId) return
    setLoading(true)
    try {
      const { data } = await api.get(`/admin/batches/${batchId}`)
      setDetail(data.data)
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  const openAssign = () => {
    setSelected([])
    setAssignOpen(true)
  }

  const assignStudents = async () => {
    if (!detail || selected.length === 0) return
    setBusy(true)
    try {
      await api.post(`/admin/batches/${detail.id}/students`, { studentIds: selected })
      toast.success("Students assigned.")
      setAssignOpen(false)
      await load()
      onSaved()
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  const removeStudent = async (studentId: string) => {
    if (!detail) return
    setBusy(true)
    try {
      await api.delete(`/admin/batches/${detail.id}/students/${studentId}`)
      toast.success("Student removed.")
      await load()
      onSaved()
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  const availableStudents = allStudents.data.filter(
    (s) => !detail?.students.some((ds) => ds.id === s.id)
  )

  return (
    <Dialog open={Boolean(batchId)} onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        {loading && !detail ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Loading batch...</p>
        ) : detail ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <span
                  className="inline-block size-3 rounded-full"
                  style={{ background: detail.course.color ?? "#6366f1" }}
                />
                {detail.name} <span className="text-sm font-normal text-muted-foreground">({detail.code})</span>
              </DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <p className="text-xs text-muted-foreground">Course</p>
                <p className="text-sm font-medium">{detail.course.title}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Mentor</p>
                <p className="text-sm font-medium">
                  {detail.mentor
                    ? fullName(detail.mentor.user.firstName, detail.mentor.user.lastName)
                    : "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Status</p>
                <StatusBadge status={detail.status} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Schedule</p>
                <p className="text-sm font-medium">
                  {formatClassSchedule(detail.classDays as number[] | undefined, detail.classTime) ||
                    "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Started</p>
                <p className="text-sm font-medium">{formatDate(detail.startDate)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Capacity</p>
                <p className="text-sm font-medium">
                  {detail.students.length} / {detail.capacity} students
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Modules</p>
                <p className="text-sm font-medium">{detail.course.modules.length}</p>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">Students ({detail.students.length})</h3>
              <Button size="sm" variant="outline" onClick={openAssign} disabled={busy}>
                <UserRound /> Assign students
              </Button>
            </div>
            {detail.students.length === 0 ? (
              <p className="rounded-lg border border-dashed py-6 text-center text-sm text-muted-foreground">
                No students in this batch yet.
              </p>
            ) : (
              <div className="max-h-64 divide-y overflow-y-auto rounded-lg border">
                {detail.students.map((student) => (
                  <div key={student.id} className="flex items-center justify-between gap-3 px-3 py-2">
                    <div className="flex min-w-0 items-center gap-2">
                      <Avatar className="size-7">
                        <AvatarImage src={student.user.profileImage ?? undefined} />
                        <AvatarFallback className="text-xs">
                          {getInitials(student.user.firstName, student.user.lastName)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="truncate text-sm">
                          {fullName(student.user.firstName, student.user.lastName)}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {student.user.email}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive"
                      disabled={busy}
                      onClick={() => removeStudent(student.id)}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : null}
      </DialogContent>

      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Assign students</DialogTitle>
          </DialogHeader>
          {availableStudents.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              All students are already in this batch.
            </p>
          ) : (
            <div className="max-h-64 divide-y overflow-y-auto rounded-lg border">
              {availableStudents.map((student) => (
                <label
                  key={student.id}
                  className="flex cursor-pointer items-center gap-3 px-3 py-2 hover:bg-muted/50"
                >
                  <input
                    type="checkbox"
                    className="size-4 accent-primary"
                    checked={selected.includes(student.id)}
                    onChange={(e) => {
                      setSelected((prev) =>
                        e.target.checked
                          ? [...prev, student.id]
                          : prev.filter((id) => id !== student.id)
                      )
                    }}
                  />
                  <span className="min-w-0 flex-1 truncate text-sm">
                    {fullName(student.user.firstName, student.user.lastName)}
                  </span>
                  <span className="text-xs text-muted-foreground">{student.user.email}</span>
                </label>
              ))}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignOpen(false)} disabled={busy}>
              Cancel
            </Button>
            <Button onClick={assignStudents} disabled={selected.length === 0 || busy}>
              {busy ? "Assigning..." : `Assign (${selected.length})`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  )
}

export function AdminBatchesPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [status, setStatus] = useState("")

  const [formOpen, setFormOpen] = useState(false)
  const [editingBatch, setEditingBatch] = useState<Batch | null>(null)
  const [detailBatchId, setDetailBatchId] = useState<string | null>(null)
  const [deletingBatch, setDeletingBatch] = useState<Batch | null>(null)

  const courses = useListData<Course>("/admin/courses?page=1&limit=100", [])
  const mentors = useListData<Mentor>("/admin/mentors?page=1&limit=100&status=ACTIVE", [])

  const query = useMemo(() => {
    const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) })
    if (debouncedSearch) params.set("search", debouncedSearch)
    if (status) params.set("status", status)
    return `/admin/batches?${params.toString()}`
  }, [page, debouncedSearch, status])

  const { data: batches, meta, loading, error, refetch } = useListData<Batch>(query)

  const debounce = useMemo(() => {
    let timer: ReturnType<typeof setTimeout> | undefined
    return (value: string) => {
      if (timer) clearTimeout(timer)
      timer = setTimeout(() => setDebouncedSearch(value), 300)
    }
  }, [])

  const deleteBatch = async () => {
    if (!deletingBatch) return
    try {
      await api.delete(`/admin/batches/${deletingBatch.id}`)
      toast.success("Batch deleted.")
      refetch()
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setDeletingBatch(null)
    }
  }

  const columns: Column<Batch>[] = [
    {
      key: "batch",
      header: "Batch",
      cell: (b) => (
        <div className="flex items-center gap-2">
          <span
            className="inline-block size-2.5 shrink-0 rounded-full"
            style={{ background: b.course.color ?? "#6366f1" }}
          />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{b.name}</p>
            <p className="truncate text-xs text-muted-foreground">{b.code}</p>
          </div>
        </div>
      ),
    },
    {
      key: "course",
      header: "Course",
      cell: (b) => <span className="text-sm">{b.course.title}</span>,
    },
    {
      key: "mentor",
      header: "Mentor",
      cell: (b) => (
        <span className="text-sm">
          {b.mentor ? fullName(b.mentor.user.firstName, b.mentor.user.lastName) : "—"}
        </span>
      ),
    },
    {
      key: "students",
      header: "Students",
      cell: (b) => (
        <span className="text-sm">
          {b._count.students} / {b.capacity}
        </span>
      ),
    },
    {
      key: "schedule",
      header: "Schedule",
      cell: (b) => {
        const schedule = formatClassSchedule(b.classDays as number[] | undefined, b.classTime)
        return (
          <div className="text-sm">
            <p>{schedule || "—"}</p>
            <p className="text-xs text-muted-foreground">From {formatDate(b.startDate)}</p>
          </div>
        )
      },
    },
    {
      key: "status",
      header: "Status",
      cell: (b) => <StatusBadge status={b.status} />,
    },
    {
      key: "actions",
      header: "",
      className: "w-12 text-right",
      cell: (b) => (
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label="Actions" />}>
            <MoreHorizontal />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setDetailBatchId(b.id)}>
              <BookOpen /> View details
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                setEditingBatch(b)
                setFormOpen(true)
              }}
            >
              <Pencil /> Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={() => setDeletingBatch(b)}>
              <Trash2 /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]

  if (error && batches.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Batches"
          description="Organize students into course batches."
          actions={
            <Button onClick={() => setFormOpen(true)}>
              <Plus /> Create batch
            </Button>
          }
        />
        <ErrorState message={error} onRetry={refetch} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Batches"
        description="Organize students into course batches."
        actions={
          <Button
            onClick={() => {
              setEditingBatch(null)
              setFormOpen(true)
            }}
          >
            <Plus /> Create batch
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <SearchInput
          value={search}
          onChange={(value) => {
            setSearch(value)
            debounce(value)
          }}
          placeholder="Search name, code or description..."
          className="w-full sm:w-72"
        />
        <Select value={status} onValueChange={(v) => { setStatus(v ?? ""); setPage(1) }}>
          <SelectTrigger>
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All statuses</SelectItem>
            {BATCH_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {s[0] + s.slice(1).toLowerCase()}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <DataTable
        columns={columns}
        data={batches}
        keyExtractor={(b) => b.id}
        loading={loading}
        emptyMessage="No batches found."
        emptyAction={
          <Button variant="outline" onClick={() => { setEditingBatch(null); setFormOpen(true) }}>
            <Plus /> Create your first batch
          </Button>
        }
      />

      <Pagination meta={meta} onPageChange={setPage} />

      <BatchFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        batch={editingBatch}
        courses={courses.data}
        mentors={mentors.data}
        onSaved={refetch}
      />

      <BatchDetailDialog batchId={detailBatchId} onClose={() => setDetailBatchId(null)} onSaved={refetch} />

      <ConfirmDialog
        open={Boolean(deletingBatch)}
        onOpenChange={(open) => { if (!open) setDeletingBatch(null) }}
        title="Delete batch"
        description={
          deletingBatch
            ? `Delete batch "${deletingBatch.name}"? Students will be unassigned and related assignments will be removed. This action cannot be undone.`
            : undefined
        }
        confirmLabel="Delete"
        destructive
        onConfirm={deleteBatch}
      />
    </div>
  )
}
