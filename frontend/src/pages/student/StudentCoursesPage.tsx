import { useEffect, useState } from "react"
import { BookOpen, CheckCircle2, Circle } from "lucide-react"
import { toast } from "sonner"
import { api, getErrorMessage } from "@/lib/api"
import { PageHeader } from "@/components/shared/PageHeader"
import { PageLoader } from "@/components/shared/PageLoader"
import { ErrorState } from "@/components/shared/ErrorState"
import { EmptyState } from "@/components/shared/EmptyState"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

interface StudentLesson {
  id: string
  title: string
  description: string | null
  contentType: string | null
  duration: number
  completed: boolean
  progressPercent: number
}

interface StudentModule {
  id: string
  title: string
  description: string | null
  order: number
  lessons: StudentLesson[]
}

interface StudentCourse {
  id: string
  title: string
  code: string
  description: string | null
  color: string | null
  totalLessons: number
  completedLessons: number
  modules: StudentModule[]
}

export function StudentCoursesPage() {
  const [courses, setCourses] = useState<StudentCourse[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [detail, setDetail] = useState<StudentCourse | null>(null)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const { data } = await api.get("/student/courses")
      setCourses(data.data as StudentCourse[])
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  if (loading && !courses) return <PageLoader />
  if (error && !courses) {
    return (
      <div className="space-y-6">
        <PageHeader title="My Courses" description="Courses you are enrolled in." />
        <ErrorState message={error} onRetry={load} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader title="My Courses" description="Courses you are enrolled in." />

      {courses && courses.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No courses yet"
          description="Courses you are enrolled in will appear here."
        />
      ) : (
        <div className="stagger grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {courses?.map((course) => {
            const percent =
              course.totalLessons === 0 ? 0 : Math.round((course.completedLessons / course.totalLessons) * 100)
            return (
              <Card
                key={course.id}
                className="transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
              >
                <CardContent className="space-y-4 p-6">
                  <div className="flex items-start justify-between gap-3">
                    <div
                      className="flex size-11 shrink-0 items-center justify-center rounded-lg text-sm font-semibold text-white"
                      style={{ background: course.color ?? "#6366f1" }}
                    >
                      {course.code.slice(0, 3).toUpperCase()}
                    </div>
                    <Badge variant="outline">
                      {course.completedLessons}/{course.totalLessons} lessons
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <p className="truncate font-medium">{course.title}</p>
                    <p className="line-clamp-2 text-xs text-muted-foreground">
                      {course.description ?? "No description."}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Progress</span>
                      <span>{percent}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${percent}%` }} />
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="w-full" onClick={() => setDetail(course)}>
                    View course
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <CourseDetailDialog course={detail} onClose={() => setDetail(null)} />
    </div>
  )
}

function CourseDetailDialog({ course, onClose }: { course: StudentCourse | null; onClose: () => void }) {
  const [savingId, setSavingId] = useState<string | null>(null)
  const [current, setCurrent] = useState<StudentCourse | null>(course)

  useEffect(() => {
    setCurrent(course)
  }, [course])

  const toggle = async (lesson: StudentLesson) => {
    if (!current) return
    setSavingId(lesson.id)
    try {
      await api.post(`/student/lessons/${lesson.id}/progress`, { completed: !lesson.completed })
      setCurrent({
        ...current,
        modules: current.modules.map((m) => ({
          ...m,
          lessons: m.lessons.map((l) =>
            l.id === lesson.id ? { ...l, completed: !l.completed, progressPercent: !l.completed ? 100 : 0 } : l
          ),
        })),
        completedLessons: current.completedLessons + (!lesson.completed ? 1 : -1),
      })
      toast.success(!lesson.completed ? "Lesson marked complete" : "Lesson reopened")
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setSavingId(null)
    }
  }

  const allLessons = current?.modules.flatMap((m) => m.lessons) ?? []

  return (
    <Dialog open={Boolean(course)} onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{current ? `${current.title} · ${current.code}` : "Course"}</DialogTitle>
        </DialogHeader>
        {current ? (
          <div className="space-y-6">
            <div>
              <p className="text-sm text-muted-foreground">{current.description ?? "No description."}</p>
              <div className="mt-3 flex items-center gap-3 text-sm">
                <Badge variant="outline">
                  {current.completedLessons}/{current.totalLessons} lessons completed
                </Badge>
              </div>
            </div>
            {allLessons.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No lessons available yet.
              </p>
            ) : (
              <div className="space-y-4">
                {current.modules.map((module) => (
                  <div key={module.id}>
                    <p className="mb-2 text-sm font-semibold">{module.title}</p>
                    <ul className="space-y-2">
                      {module.lessons.map((lesson) => (
                        <li
                          key={lesson.id}
                          className={cn(
                            "flex items-center justify-between gap-3 rounded-lg border p-3",
                            lesson.completed && "border-emerald-500/40 bg-emerald-500/5"
                          )}
                        >
                          <div className="flex min-w-0 items-start gap-3">
                            {lesson.completed ? (
                              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                            ) : (
                              <Circle className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                            )}
                            <div className="min-w-0 space-y-0.5">
                              <p className="truncate text-sm font-medium">{lesson.title}</p>
                              {lesson.description ? (
                                <p className="line-clamp-2 text-xs text-muted-foreground">{lesson.description}</p>
                              ) : null}
                            </div>
                          </div>
                          <Button
                            variant={lesson.completed ? "ghost" : "outline"}
                            size="sm"
                            disabled={savingId === lesson.id}
                            onClick={() => toggle(lesson)}
                          >
                            {savingId === lesson.id ? "Saving..." : lesson.completed ? "Reopen" : "Complete"}
                          </Button>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
