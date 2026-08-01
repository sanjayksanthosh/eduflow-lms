import { useEffect, useMemo, useState } from "react"
import {
  FileText,
  Layers,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
  Video,
} from "lucide-react"
import { toast } from "sonner"
import { api, getErrorMessage } from "@/lib/api"
import { useListData } from "@/hooks/useListData"
import { PageHeader } from "@/components/shared/PageHeader"
import { DataTable, type Column } from "@/components/shared/DataTable"
import { Pagination } from "@/components/shared/Pagination"
import { SearchInput } from "@/components/shared/SearchInput"
import { ConfirmDialog } from "@/components/shared/ConfirmDialog"
import { ErrorState } from "@/components/shared/ErrorState"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
import { formatDate } from "@/lib/format"
import type { Course, CourseDetail, CourseModule, Lesson } from "@/lib/types"

const PAGE_SIZE = 10
const COURSE_COLORS = [
  "#6366f1",
  "#0ea5e9",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#ec4899",
  "#8b5cf6",
  "#14b8a6",
]

interface CourseFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  course: Course | null
  onSaved: () => void
}

function CourseFormDialog({ open, onOpenChange, course, onSaved }: CourseFormDialogProps) {
  const isEdit = Boolean(course)
  const [title, setTitle] = useState("")
  const [code, setCode] = useState("")
  const [description, setDescription] = useState("")
  const [color, setColor] = useState(COURSE_COLORS[0])
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!open) return
    setTitle(course?.title ?? "")
    setCode(course?.code ?? "")
    setDescription(course?.description ?? "")
    setColor(course?.color ?? COURSE_COLORS[0])
  }, [open, course])

  const handleSubmit = async () => {
    if (!title.trim() || !code.trim()) {
      toast.error("Title and code are required.")
      return
    }
    setSubmitting(true)
    try {
      const payload = {
        title,
        code,
        color,
        ...(description.trim() ? { description } : {}),
      }
      if (isEdit) {
        await api.patch(`/admin/courses/${course!.id}`, payload)
        toast.success("Course updated.")
      } else {
        await api.post("/admin/courses", payload)
        toast.success("Course created.")
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Course" : "Create Course"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Course title</Label>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="code">Code</Label>
              <Input id="code" value={code} onChange={(e) => setCode(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Color</Label>
            <div className="flex flex-wrap gap-2">
              {COURSE_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  aria-label={`Pick color ${c}`}
                  onClick={() => setColor(c)}
                  className={`size-7 rounded-full transition-transform ${
                    color === c ? "scale-110 ring-2 ring-foreground ring-offset-2" : ""
                  }`}
                  style={{ background: c }}
                />
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Saving..." : isEdit ? "Save changes" : "Create course"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

interface ModuleFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  courseId: string
  module: CourseModule | null
  order: number
  onSaved: () => void
}

function ModuleFormDialog({ open, onOpenChange, courseId, module, order, onSaved }: ModuleFormDialogProps) {
  const isEdit = Boolean(module)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!open) return
    setTitle(module?.title ?? "")
    setDescription(module?.description ?? "")
  }, [open, module])

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.error("Module title is required.")
      return
    }
    setSubmitting(true)
    try {
      const payload = {
        title,
        order,
        ...(description.trim() ? { description } : {}),
      }
      if (isEdit) {
        await api.patch(`/admin/modules/${module!.id}`, { ...payload, order: undefined })
        toast.success("Module updated.")
      } else {
        await api.post(`/admin/courses/${courseId}/modules`, payload)
        toast.success("Module created.")
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Module" : "Add Module"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="space-y-2">
            <Label htmlFor="moduleTitle">Module title</Label>
            <Input id="moduleTitle" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="moduleDescription">Description</Label>
            <Textarea
              id="moduleDescription"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Saving..." : isEdit ? "Save changes" : "Add module"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

interface LessonFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  moduleId: string
  lesson: Lesson | null
  order: number
  onSaved: () => void
}

function LessonFormDialog({ open, onOpenChange, moduleId, lesson, order, onSaved }: LessonFormDialogProps) {
  const isEdit = Boolean(lesson)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [videoUrl, setVideoUrl] = useState("")
  const [duration, setDuration] = useState("")
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!open) return
    setTitle(lesson?.title ?? "")
    setDescription(lesson?.description ?? "")
    setVideoUrl(lesson?.videoUrl ?? "")
    setDuration(lesson?.duration ? String(lesson.duration) : "")
  }, [open, lesson])

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.error("Lesson title is required.")
      return
    }
    setSubmitting(true)
    try {
      const payload = {
        title,
        order,
        duration: duration.trim() ? Number(duration) : 0,
        ...(description.trim() ? { description } : {}),
        ...(videoUrl.trim() ? { videoUrl } : {}),
      }
      if (isEdit) {
        await api.patch(`/admin/lessons/${lesson!.id}`, { ...payload, order: undefined })
        toast.success("Lesson updated.")
      } else {
        await api.post(`/admin/modules/${moduleId}/lessons`, payload)
        toast.success("Lesson created.")
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Lesson" : "Add Lesson"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="space-y-2">
            <Label htmlFor="lessonTitle">Lesson title</Label>
            <Input id="lessonTitle" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="videoUrl">Video URL</Label>
              <Input id="videoUrl" value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="duration">Duration (min)</Label>
              <Input
                id="duration"
                type="number"
                min={0}
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="lessonDescription">Description</Label>
            <Textarea
              id="lessonDescription"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Saving..." : isEdit ? "Save changes" : "Add lesson"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

interface CourseDetailDialogProps {
  courseId: string | null
  onClose: () => void
  onSaved: () => void
}

function CourseDetailDialog({ courseId, onClose, onSaved }: CourseDetailDialogProps) {
  const [detail, setDetail] = useState<CourseDetail | null>(null)
  const [loading, setLoading] = useState(false)

  const [moduleFormOpen, setModuleFormOpen] = useState(false)
  const [editingModule, setEditingModule] = useState<CourseModule | null>(null)
  const [moduleDialogCourseId, setModuleDialogCourseId] = useState("")
  const [moduleOrder, setModuleOrder] = useState(0)

  const [lessonFormOpen, setLessonFormOpen] = useState(false)
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null)
  const [lessonModuleId, setLessonModuleId] = useState("")
  const [lessonOrder, setLessonOrder] = useState(0)

  const [deleteTarget, setDeleteTarget] = useState<{
    kind: "module" | "lesson"
    id: string
  } | null>(null)

  const load = async () => {
    if (!courseId) return
    setLoading(true)
    try {
      const { data } = await api.get(`/admin/courses/${courseId}`)
      setDetail(data.data)
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  const addModule = () => {
    setEditingModule(null)
    setModuleDialogCourseId(courseId ?? "")
    setModuleOrder(detail?.modules.length ?? 0)
    setModuleFormOpen(true)
  }

  const editModule = (module: CourseModule) => {
    setEditingModule(module)
    setModuleDialogCourseId(courseId ?? "")
    setModuleOrder(module.order)
    setModuleFormOpen(true)
  }

  const addLesson = (module: CourseModule) => {
    setEditingLesson(null)
    setLessonModuleId(module.id)
    setLessonOrder(module.lessons.length)
    setLessonFormOpen(true)
  }

  const editLesson = (lesson: Lesson) => {
    setEditingLesson(lesson)
    setLessonModuleId(lesson.moduleId)
    setLessonOrder(lesson.order)
    setLessonFormOpen(true)
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      if (deleteTarget.kind === "module") {
        await api.delete(`/admin/modules/${deleteTarget.id}`)
        toast.success("Module deleted.")
      } else {
        await api.delete(`/admin/lessons/${deleteTarget.id}`)
        toast.success("Lesson deleted.")
      }
      await load()
      onSaved()
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setDeleteTarget(null)
    }
  }

  return (
    <Dialog open={Boolean(courseId)} onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        {loading && !detail ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Loading course...</p>
        ) : detail ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <span
                  className="inline-block size-3 rounded-full"
                  style={{ background: detail.color ?? "#6366f1" }}
                />
                {detail.title}{" "}
                <span className="text-sm font-normal text-muted-foreground">({detail.code})</span>
              </DialogTitle>
            </DialogHeader>
            <p className="-mt-2 text-sm text-muted-foreground">{detail.description}</p>
            <div className="grid gap-2 text-sm sm:grid-cols-3">
              <p className="flex items-center gap-2">
                <Layers className="size-4 text-muted-foreground" /> {detail.stats.modules} modules
              </p>
              <p className="flex items-center gap-2">
                <FileText className="size-4 text-muted-foreground" /> {detail.stats.lessons} lessons
              </p>
              <p className="flex items-center gap-2">
                <Video className="size-4 text-muted-foreground" /> {detail.stats.totalDuration} min total
              </p>
            </div>

            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">Modules</h3>
              <Button size="sm" variant="outline" onClick={addModule}>
                <Plus /> Add module
              </Button>
            </div>

            {detail.modules.length === 0 ? (
              <p className="rounded-lg border border-dashed py-6 text-center text-sm text-muted-foreground">
                No modules yet. Add your first module.
              </p>
            ) : (
              <div className="space-y-3">
                {detail.modules.map((module) => (
                  <div key={module.id} className="rounded-lg border p-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium">
                          {module.order + 1}. {module.title}
                        </p>
                        {module.description ? (
                          <p className="truncate text-xs text-muted-foreground">
                            {module.description}
                          </p>
                        ) : null}
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => addLesson(module)}
                        >
                          <Plus /> Lesson
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            render={<Button variant="ghost" size="icon-sm" aria-label="Module actions" />}
                          >
                            <MoreHorizontal />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => editModule(module)}>
                              <Pencil /> Edit module
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              variant="destructive"
                              onClick={() => setDeleteTarget({ kind: "module", id: module.id })}
                            >
                              <Trash2 /> Delete module
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                    {module.lessons.length > 0 ? (
                      <ul className="mt-2 divide-y rounded-md bg-muted/30">
                        {module.lessons.map((lesson) => (
                          <li key={lesson.id} className="flex items-center justify-between gap-2 px-3 py-2">
                            <div className="flex min-w-0 items-center gap-2">
                              <Video className="size-3.5 shrink-0 text-muted-foreground" />
                              <p className="truncate text-sm">{lesson.title}</p>
                              {lesson.duration > 0 ? (
                                <Badge variant="outline" className="shrink-0">
                                  {lesson.duration} min
                                </Badge>
                              ) : null}
                            </div>
                            <div className="flex shrink-0 items-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                aria-label="Edit lesson"
                                onClick={() => editLesson(lesson)}
                              >
                                <Pencil />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                aria-label="Delete lesson"
                                className="text-destructive"
                                onClick={() => setDeleteTarget({ kind: "lesson", id: lesson.id })}
                              >
                                <Trash2 />
                              </Button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-2 text-xs text-muted-foreground">No lessons yet.</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        ) : null}
      </DialogContent>

      <ModuleFormDialog
        open={moduleFormOpen}
        onOpenChange={setModuleFormOpen}
        courseId={moduleDialogCourseId}
        module={editingModule}
        order={moduleOrder}
        onSaved={load}
      />

      <LessonFormDialog
        open={lessonFormOpen}
        onOpenChange={setLessonFormOpen}
        moduleId={lessonModuleId}
        lesson={editingLesson}
        order={lessonOrder}
        onSaved={load}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}
        title={deleteTarget?.kind === "module" ? "Delete module" : "Delete lesson"}
        description={`Delete this ${deleteTarget?.kind} and its contents? This action cannot be undone.`}
        confirmLabel="Delete"
        destructive
        onConfirm={handleDelete}
      />
    </Dialog>
  )
}

export function AdminCoursesPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")

  const [formOpen, setFormOpen] = useState(false)
  const [editingCourse, setEditingCourse] = useState<Course | null>(null)
  const [detailCourseId, setDetailCourseId] = useState<string | null>(null)
  const [deletingCourse, setDeletingCourse] = useState<Course | null>(null)

  const query = useMemo(() => {
    const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) })
    if (debouncedSearch) params.set("search", debouncedSearch)
    return `/admin/courses?${params.toString()}`
  }, [page, debouncedSearch])

  const { data: courses, meta, loading, error, refetch } = useListData<Course>(query)

  const debounce = useMemo(() => {
    let timer: ReturnType<typeof setTimeout> | undefined
    return (value: string) => {
      if (timer) clearTimeout(timer)
      timer = setTimeout(() => setDebouncedSearch(value), 300)
    }
  }, [])

  const deleteCourse = async () => {
    if (!deletingCourse) return
    try {
      await api.delete(`/admin/courses/${deletingCourse.id}`)
      toast.success("Course deleted.")
      refetch()
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setDeletingCourse(null)
    }
  }

  const columns: Column<Course>[] = [
    {
      key: "course",
      header: "Course",
      cell: (c) => (
        <div className="flex items-center gap-2">
          <span
            className="inline-block size-2.5 shrink-0 rounded-full"
            style={{ background: c.color ?? "#6366f1" }}
          />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{c.title}</p>
            <p className="truncate text-xs text-muted-foreground">{c.code}</p>
          </div>
        </div>
      ),
    },
    {
      key: "modules",
      header: "Modules",
      cell: (c) => <span className="text-sm">{c._count.modules}</span>,
    },
    {
      key: "batches",
      header: "Batches",
      cell: (c) => <span className="text-sm">{c._count.batches}</span>,
    },
    {
      key: "created",
      header: "Created",
      cell: (c) => <span className="text-sm">{formatDate(c.createdAt)}</span>,
    },
    {
      key: "actions",
      header: "",
      className: "w-12 text-right",
      cell: (c) => (
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label="Actions" />}>
            <MoreHorizontal />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setDetailCourseId(c.id)}>
              <Layers /> Manage modules
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                setEditingCourse(c)
                setFormOpen(true)
              }}
            >
              <Pencil /> Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={() => setDeletingCourse(c)}>
              <Trash2 /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]

  if (error && courses.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Courses"
          description="Create courses and structure them into modules and lessons."
          actions={
            <Button onClick={() => setFormOpen(true)}>
              <Plus /> Create course
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
        title="Courses"
        description="Create courses and structure them into modules and lessons."
        actions={
          <Button
            onClick={() => {
              setEditingCourse(null)
              setFormOpen(true)
            }}
          >
            <Plus /> Create course
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
          placeholder="Search title, code or description..."
          className="w-full sm:w-72"
        />
      </div>

      <DataTable
        columns={columns}
        data={courses}
        keyExtractor={(c) => c.id}
        loading={loading}
        emptyMessage="No courses found."
        emptyAction={
          <Button variant="outline" onClick={() => { setEditingCourse(null); setFormOpen(true) }}>
            <Plus /> Create your first course
          </Button>
        }
      />

      <Pagination meta={meta} onPageChange={setPage} />

      <CourseFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        course={editingCourse}
        onSaved={refetch}
      />

      <CourseDetailDialog courseId={detailCourseId} onClose={() => setDetailCourseId(null)} onSaved={refetch} />

      <ConfirmDialog
        open={Boolean(deletingCourse)}
        onOpenChange={(open) => { if (!open) setDeletingCourse(null) }}
        title="Delete course"
        description={
          deletingCourse
            ? `Delete course "${deletingCourse.title}"? Its modules, lessons and enrollments will be removed. This action cannot be undone.`
            : undefined
        }
        confirmLabel="Delete"
        destructive
        onConfirm={deleteCourse}
      />
    </div>
  )
}
