import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { CheckCircle2, KeyRound, MoreHorizontal, Pencil, Plus, Trash2, UserRound } from "lucide-react"
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
import { Badge } from "@/components/ui/badge"
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
import type { Batch, Student } from "@/lib/types"

const PAGE_SIZE = 10
const GENDERS = ["MALE", "FEMALE", "OTHER"]

interface StudentFormState {
  firstName: string
  lastName: string
  email: string
  password: string
  phone: string
  address: string
  gender: string
  dateOfBirth: string
  admissionNumber: string
  parentName: string
  parentPhone: string
  emergencyContact: string
  batchId: string
}

const emptyForm: StudentFormState = {
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  phone: "",
  address: "",
  gender: "",
  dateOfBirth: "",
  admissionNumber: "",
  parentName: "",
  parentPhone: "",
  emergencyContact: "",
  batchId: "",
}

function cleanOptional(payload: Record<string, unknown>): Record<string, unknown> {
  const cleaned: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(payload)) {
    if (typeof value === "string") {
      if (value.trim() !== "") cleaned[key] = value.trim()
    } else if (value != null) {
      cleaned[key] = value
    }
  }
  return cleaned
}

interface StudentFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  student: Student | null
  batches: Batch[]
  onSaved: () => void
}

function StudentFormDialog({ open, onOpenChange, student, batches, onSaved }: StudentFormDialogProps) {
  const isEdit = Boolean(student)
  const [form, setForm] = useState<StudentFormState>(emptyForm)
  const [submitting, setSubmitting] = useState(false)

  const set = <K extends keyof StudentFormState>(key: K, value: StudentFormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  useEffect(() => {
    if (!open) return
    setForm(
      student
        ? {
            firstName: student.user.firstName,
            lastName: student.user.lastName,
            email: student.user.email,
            password: "",
            phone: student.user.phone ?? "",
            address: student.user.address ?? "",
            gender: student.gender ?? "",
            dateOfBirth: student.dateOfBirth ? student.dateOfBirth.slice(0, 10) : "",
            admissionNumber: student.admissionNumber,
            parentName: student.parentName ?? "",
            parentPhone: student.parentPhone ?? "",
            emergencyContact: student.emergencyContact ?? "",
            batchId: student.batchId ?? "",
          }
        : emptyForm
    )
  }, [open, student])

  const handleSubmit = async () => {
    if (!form.firstName.trim() || !form.lastName.trim() || !form.email.trim()) {
      toast.error("Name and email are required.")
      return
    }
    if (!isEdit && form.password.length < 8) {
      toast.error("Password must be at least 8 characters.")
      return
    }
    setSubmitting(true)
    try {
      if (isEdit) {
        await api.patch(`/admin/students/${student!.id}`, {
          ...cleanOptional({
            firstName: form.firstName,
            lastName: form.lastName,
            phone: form.phone,
            address: form.address,
            gender: form.gender,
            dateOfBirth: form.dateOfBirth,
            parentName: form.parentName,
            parentPhone: form.parentPhone,
            emergencyContact: form.emergencyContact,
          }),
        })
        toast.success("Student updated.")
      } else {
        await api.post("/admin/students", {
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          password: form.password,
          ...cleanOptional({
            phone: form.phone,
            address: form.address,
            gender: form.gender,
            dateOfBirth: form.dateOfBirth,
            admissionNumber: form.admissionNumber,
            parentName: form.parentName,
            parentPhone: form.parentPhone,
            emergencyContact: form.emergencyContact,
            batchId: form.batchId,
          }),
        })
        toast.success("Student created.")
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
          <DialogTitle>{isEdit ? "Edit Student" : "Add Student"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First name</Label>
              <Input
                id="firstName"
                value={form.firstName}
                onChange={(e) => set("firstName", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last name</Label>
              <Input
                id="lastName"
                value={form.lastName}
                onChange={(e) => set("lastName", e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                disabled={isEdit}
                onChange={(e) => set("email", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">
                {isEdit ? "Password" : "Password *"}
              </Label>
              <Input
                id="password"
                type="password"
                value={form.password}
                placeholder={isEdit ? "Leave blank to keep current" : "Min 8 characters"}
                onChange={(e) => set("password", e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="admission">Admission number</Label>
              <Input
                id="admission"
                value={form.admissionNumber}
                placeholder="Auto-generated"
                onChange={(e) => set("admissionNumber", e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Gender</Label>
              <Select value={form.gender} onValueChange={(v) => set("gender", v ?? "")}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {GENDERS.map((g) => (
                    <SelectItem key={g} value={g}>
                      {g[0] + g.slice(1).toLowerCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="dob">Date of birth</Label>
              <Input
                id="dob"
                type="date"
                value={form.dateOfBirth}
                onChange={(e) => set("dateOfBirth", e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Textarea
              id="address"
              value={form.address}
              onChange={(e) => set("address", e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Batch</Label>
              <Select value={form.batchId} onValueChange={(v) => set("batchId", v ?? "")}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select batch" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {batches.map((batch) => (
                    <SelectItem key={batch.id} value={batch.id}>
                      {batch.name} ({batch.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="parentName">Parent name</Label>
                <Input
                  id="parentName"
                  value={form.parentName}
                  onChange={(e) => set("parentName", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="parentPhone">Parent phone</Label>
                <Input
                  id="parentPhone"
                  value={form.parentPhone}
                  onChange={(e) => set("parentPhone", e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Saving..." : isEdit ? "Save changes" : "Create student"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

interface AssignBatchDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  student: Student | null
  batches: Batch[]
  onSaved: () => void
}

function AssignBatchDialog({ open, onOpenChange, student, batches, onSaved }: AssignBatchDialogProps) {
  const [batchId, setBatchId] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!batchId) return
    setSubmitting(true)
    try {
      await api.patch(`/admin/students/${student!.id}/batch`, { batchId })
      toast.success("Batch assigned.")
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
          <DialogTitle>Assign batch to {student ? fullName(student.user.firstName, student.user.lastName) : ""}</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          <Label>Batch</Label>
          <Select value={batchId} onValueChange={(v) => setBatchId(v ?? "")}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select batch" />
            </SelectTrigger>
            <SelectContent>
              {batches.map((batch) => (
                <SelectItem key={batch.id} value={batch.id}>
                  {batch.name} ({batch.code})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!batchId || submitting}>
            {submitting ? "Assigning..." : "Assign"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

interface ResetPasswordDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  student: Student | null
  onSaved: () => void
}

function ResetPasswordDialog({ open, onOpenChange, student, onSaved }: ResetPasswordDialogProps) {
  const [password, setPassword] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters.")
      return
    }
    setSubmitting(true)
    try {
      await api.post(`/admin/students/${student!.id}/reset-password`, { password })
      toast.success("Password reset.")
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
          <DialogTitle>Reset password</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="newPassword">New password</Label>
          <Input
            id="newPassword"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={password.length < 8 || submitting}>
            {submitting ? "Resetting..." : "Reset password"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function AdminStudentsPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [status, setStatus] = useState("")
  const [batchId, setBatchId] = useState("")
  const [gender, setGender] = useState("")

  const [formOpen, setFormOpen] = useState(false)
  const [editingStudent, setEditingStudent] = useState<Student | null>(null)
  const [assigningStudent, setAssigningStudent] = useState<Student | null>(null)
  const [resetStudent, setResetStudent] = useState<Student | null>(null)
  const [deletingStudent, setDeletingStudent] = useState<Student | null>(null)
  const [togglingStudent, setTogglingStudent] = useState<Student | null>(null)
  const [mutating, setMutating] = useState(false)

  const batches = useListData<Batch>(
    "/admin/batches?page=1&limit=100&status=ACTIVE",
    []
  )

  const query = useMemo(() => {
    const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) })
    if (debouncedSearch) params.set("search", debouncedSearch)
    if (status) params.set("status", status)
    if (batchId) params.set("batchId", batchId)
    if (gender) params.set("gender", gender)
    return `/admin/students?${params.toString()}`
  }, [page, debouncedSearch, status, batchId, gender])

  const { data: students, meta, loading, error, refetch } = useListData<Student>(query)

  const debounce = useMemo(() => {
    let timer: ReturnType<typeof setTimeout> | undefined
    return (value: string) => {
      if (timer) clearTimeout(timer)
      timer = setTimeout(() => setDebouncedSearch(value), 300)
    }
  }, [])

  const changeStatus = async (student: Student, nextStatus: string) => {
    setMutating(true)
    try {
      await api.patch(`/admin/students/${student.id}/status`, { status: nextStatus })
      toast.success(`Student ${nextStatus === "ACTIVE" ? "activated" : nextStatus.toLowerCase()}.`)
      refetch()
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setMutating(false)
      setTogglingStudent(null)
    }
  }

  const deleteStudent = async () => {
    if (!deletingStudent) return
    setMutating(true)
    try {
      await api.delete(`/admin/students/${deletingStudent.id}`)
      toast.success("Student deleted.")
      refetch()
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setMutating(false)
      setDeletingStudent(null)
    }
  }

  const columns: Column<Student>[] = [
    {
      key: "student",
      header: "Student",
      cell: (s) => (
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage src={s.user.profileImage ?? undefined} />
            <AvatarFallback>{getInitials(s.user.firstName, s.user.lastName)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <Link
              to="#"
              onClick={(e) => e.preventDefault()}
              className="block truncate text-sm font-medium hover:underline"
            >
              {fullName(s.user.firstName, s.user.lastName)}
            </Link>
            <p className="truncate text-xs text-muted-foreground">{s.user.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: "admission",
      header: "Admission",
      cell: (s) => <span className="text-sm">{s.admissionNumber}</span>,
    },
    {
      key: "batch",
      header: "Batch",
      cell: (s) =>
        s.batch ? (
          <Badge variant="outline">{s.batch.name}</Badge>
        ) : (
          <span className="text-sm text-muted-foreground">—</span>
        ),
    },
    {
      key: "attendance",
      header: "Attendance",
      cell: (s) => {
        const present = s.attendanceSummary.PRESENT ?? 0
        const percent =
          s.attendanceCount === 0 ? 0 : Math.round((present / s.attendanceCount) * 100)
        return (
          <span className="text-sm">
            {percent}%{" "}
            <span className="text-xs text-muted-foreground">({s.attendanceCount} days)</span>
          </span>
        )
      },
    },
    {
      key: "status",
      header: "Status",
      cell: (s) => <StatusBadge status={s.user.status} />,
    },
    {
      key: "joined",
      header: "Joined",
      cell: (s) => <span className="text-sm">{formatDate(s.user.createdAt)}</span>,
    },
    {
      key: "actions",
      header: "",
      className: "w-12 text-right",
      cell: (s) => (
        <DropdownMenu>
          <DropdownMenuTrigger
            render={<Button variant="ghost" size="icon-sm" aria-label="Actions" />}
          >
            <MoreHorizontal />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => {
                setEditingStudent(s)
                setFormOpen(true)
              }}
            >
              <Pencil /> Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setAssigningStudent(s)}>
              <UserRound /> Assign batch
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setResetStudent(s)}>
              <KeyRound /> Reset password
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setTogglingStudent(s)}>
              {s.user.status === "ACTIVE" ? <UserRound /> : <CheckCircle2 />}
              {s.user.status === "ACTIVE" ? "Suspend" : "Activate"}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={() => setDeletingStudent(s)}>
              <Trash2 /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]

  if (error && students.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Students"
          description="Manage student accounts and batches."
          actions={
            <Button onClick={() => setFormOpen(true)}>
              <Plus /> Add student
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
        title="Students"
        description="Manage student accounts and batches."
        actions={
          <Button onClick={() => { setEditingStudent(null); setFormOpen(true) }}>
            <Plus /> Add student
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
          placeholder="Search name, email or admission..."
          className="w-full sm:w-72"
        />
        <Select value={status} onValueChange={(v) => { setStatus(v ?? ""); setPage(1) }}>
          <SelectTrigger>
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All statuses</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="INACTIVE">Inactive</SelectItem>
            <SelectItem value="SUSPENDED">Suspended</SelectItem>
          </SelectContent>
        </Select>
        <Select value={gender} onValueChange={(v) => { setGender(v ?? ""); setPage(1) }}>
          <SelectTrigger>
            <SelectValue placeholder="Gender" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All genders</SelectItem>
            {GENDERS.map((g) => (
              <SelectItem key={g} value={g}>
                {g[0] + g.slice(1).toLowerCase()}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={batchId} onValueChange={(v) => { setBatchId(v ?? ""); setPage(1) }}>
          <SelectTrigger>
            <SelectValue placeholder="Batch" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All batches</SelectItem>
            {batches.data.map((batch) => (
              <SelectItem key={batch.id} value={batch.id}>
                {batch.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <DataTable
        columns={columns}
        data={students}
        keyExtractor={(s) => s.id}
        loading={loading}
        emptyMessage="No students found."
        emptyAction={
          <Button variant="outline" onClick={() => { setEditingStudent(null); setFormOpen(true) }}>
            <Plus /> Add your first student
          </Button>
        }
      />

      <Pagination meta={meta} onPageChange={setPage} />

      <StudentFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        student={editingStudent}
        batches={batches.data}
        onSaved={refetch}
      />

      <AssignBatchDialog
        open={Boolean(assigningStudent)}
        onOpenChange={(open) => { if (!open) setAssigningStudent(null) }}
        student={assigningStudent}
        batches={batches.data}
        onSaved={refetch}
      />

      <ResetPasswordDialog
        open={Boolean(resetStudent)}
        onOpenChange={(open) => { if (!open) setResetStudent(null) }}
        student={resetStudent}
        onSaved={refetch}
      />

      <ConfirmDialog
        open={Boolean(togglingStudent)}
        onOpenChange={(open) => { if (!open) setTogglingStudent(null) }}
        title={togglingStudent?.user.status === "ACTIVE" ? "Suspend student" : "Activate student"}
        description={
          togglingStudent?.user.status === "ACTIVE"
            ? `${fullName(togglingStudent.user.firstName, togglingStudent.user.lastName)} will no longer be able to sign in.`
            : `${fullName(togglingStudent?.user.firstName ?? "", togglingStudent?.user.lastName ?? "")} will be able to sign in again.`
        }
        confirmLabel={togglingStudent?.user.status === "ACTIVE" ? "Suspend" : "Activate"}
        onConfirm={() =>
          changeStatus(togglingStudent!, togglingStudent!.user.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE")
        }
      />

      <ConfirmDialog
        open={Boolean(deletingStudent)}
        onOpenChange={(open) => { if (!open) setDeletingStudent(null) }}
        title="Delete student"
        description={
          deletingStudent
            ? `Delete ${fullName(deletingStudent.user.firstName, deletingStudent.user.lastName)}? This will remove their account and all related data. This action cannot be undone.`
            : undefined
        }
        confirmLabel="Delete"
        destructive
        onConfirm={deleteStudent}
      />

      {mutating ? <span className="sr-only">Working...</span> : null}
    </div>
  )
}
