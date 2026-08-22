import { useEffect, useMemo, useState } from "react"
import { KeyRound, MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react"
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
import type { Mentor } from "@/lib/types"

const PAGE_SIZE = 10

interface MentorFormState {
  fullName: string
  email: string
  phone: string
}

const emptyForm: MentorFormState = {
  fullName: "",
  email: "",
  phone: "",
}

interface MentorFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mentor: Mentor | null
  onSaved: () => void
}

function MentorFormDialog({ open, onOpenChange, mentor, onSaved }: MentorFormDialogProps) {
  const isEdit = Boolean(mentor)
  const [form, setForm] = useState<MentorFormState>(emptyForm)
  const [submitting, setSubmitting] = useState(false)

  const set = <K extends keyof MentorFormState>(key: K, value: MentorFormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  useEffect(() => {
    if (!open) return
    setForm(
      mentor
        ? {
            fullName: fullName(mentor.user.firstName, mentor.user.lastName),
            email: mentor.user.email,
            phone: mentor.user.phone ?? "",
          }
        : emptyForm
    )
  }, [open, mentor])

  const handleSubmit = async () => {
    if (!form.fullName.trim() || !form.email.trim()) {
      toast.error("Full name and email are required.")
      return
    }
    if (!isEdit && !form.phone.trim()) {
      toast.error("Phone number is required — it is used as the initial password.")
      return
    }
    setSubmitting(true)
    try {
      const common = {
        phone: form.phone.trim() || undefined,
      }
      if (isEdit) {
        await api.patch(`/admin/mentors/${mentor!.id}`, {
          fullName: form.fullName.trim(),
          ...common,
        })
        toast.success("Mentor updated.")
      } else {
        await api.post("/admin/mentors", {
          fullName: form.fullName.trim(),
          email: form.email.trim(),
          ...common,
        })
        toast.success("Mentor created. Initial password is their phone number.")
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
          <DialogTitle>{isEdit ? "Edit Mentor" : "Add Mentor"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Full name</Label>
            <Input
              id="fullName"
              value={form.fullName}
              placeholder="e.g. Priya Sharma"
              onChange={(e) => set("fullName", e.target.value)}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
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
              <Label htmlFor="phone">Phone number</Label>
              <Input
                id="phone"
                type="tel"
                value={form.phone}
                placeholder="e.g. 9876543210"
                onChange={(e) => set("phone", e.target.value)}
              />
              {!isEdit ? (
                <p className="text-xs text-muted-foreground">
                  Used to log in — the phone number is set as the initial password.
                </p>
              ) : null}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Saving..." : isEdit ? "Save changes" : "Create mentor"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

interface ResetPasswordDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mentor: Mentor | null
  onSaved: () => void
}

function ResetPasswordDialog({ open, onOpenChange, mentor, onSaved }: ResetPasswordDialogProps) {
  const [password, setPassword] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters.")
      return
    }
    setSubmitting(true)
    try {
      await api.post(`/admin/mentors/${mentor!.id}/reset-password`, { password })
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

export function AdminMentorsPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [status, setStatus] = useState("")

  const [formOpen, setFormOpen] = useState(false)
  const [editingMentor, setEditingMentor] = useState<Mentor | null>(null)
  const [resetMentor, setResetMentor] = useState<Mentor | null>(null)
  const [deletingMentor, setDeletingMentor] = useState<Mentor | null>(null)

  const query = useMemo(() => {
    const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) })
    if (debouncedSearch) params.set("search", debouncedSearch)
    if (status) params.set("status", status)
    return `/admin/mentors?${params.toString()}`
  }, [page, debouncedSearch, status])

  const { data: mentors, meta, loading, error, refetch } = useListData<Mentor>(query)

  const debounce = useMemo(() => {
    let timer: ReturnType<typeof setTimeout> | undefined
    return (value: string) => {
      if (timer) clearTimeout(timer)
      timer = setTimeout(() => setDebouncedSearch(value), 300)
    }
  }, [])

  const deleteMentor = async () => {
    if (!deletingMentor) return
    try {
      await api.delete(`/admin/mentors/${deletingMentor.id}`)
      toast.success("Mentor deleted.")
      refetch()
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setDeletingMentor(null)
    }
  }

  const columns: Column<Mentor>[] = [
    {
      key: "mentor",
      header: "Mentor",
      cell: (m) => (
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage src={m.user.profileImage ?? undefined} />
            <AvatarFallback>{getInitials(m.user.firstName, m.user.lastName)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">
              {fullName(m.user.firstName, m.user.lastName)}
            </p>
            <p className="truncate text-xs text-muted-foreground">{m.user.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: "batches",
      header: "Batches",
      cell: (m) =>
        m.batches.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {m.batches.map((b) => (
              <Badge key={b.id} variant="outline">
                {b.name}
              </Badge>
            ))}
          </div>
        ) : (
          <span className="text-sm text-muted-foreground">—</span>
        ),
    },
    {
      key: "status",
      header: "Status",
      cell: (m) => <StatusBadge status={m.user.status} />,
    },
    {
      key: "joined",
      header: "Joined",
      cell: (m) => <span className="text-sm">{formatDate(m.user.createdAt)}</span>,
    },
    {
      key: "actions",
      header: "",
      className: "w-12 text-right",
      cell: (m) => (
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label="Actions" />}>
            <MoreHorizontal />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => {
                setEditingMentor(m)
                setFormOpen(true)
              }}
            >
              <Pencil /> Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setResetMentor(m)}>
              <KeyRound /> Reset password
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={() => setDeletingMentor(m)}>
              <Trash2 /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]

  if (error && mentors.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Mentors"
          description="Manage mentor accounts."
          actions={
            <Button onClick={() => setFormOpen(true)}>
              <Plus /> Add mentor
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
        title="Mentors"
        description="Manage mentor accounts."
        actions={
          <Button
            onClick={() => {
              setEditingMentor(null)
              setFormOpen(true)
            }}
          >
            <Plus /> Add mentor
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
          placeholder="Search name or email..."
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
      </div>

      <DataTable
        columns={columns}
        data={mentors}
        keyExtractor={(m) => m.id}
        loading={loading}
        emptyMessage="No mentors found."
        emptyAction={
          <Button variant="outline" onClick={() => { setEditingMentor(null); setFormOpen(true) }}>
            <Plus /> Add your first mentor
          </Button>
        }
      />

      <Pagination meta={meta} onPageChange={setPage} />

      <MentorFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        mentor={editingMentor}
        onSaved={refetch}
      />

      <ResetPasswordDialog
        open={Boolean(resetMentor)}
        onOpenChange={(open) => { if (!open) setResetMentor(null) }}
        mentor={resetMentor}
        onSaved={refetch}
      />

      <ConfirmDialog
        open={Boolean(deletingMentor)}
        onOpenChange={(open) => { if (!open) setDeletingMentor(null) }}
        title="Delete mentor"
        description={
          deletingMentor
            ? `Delete ${fullName(deletingMentor.user.firstName, deletingMentor.user.lastName)}? This will remove their account and all related data. This action cannot be undone.`
            : undefined
        }
        confirmLabel="Delete"
        destructive
        onConfirm={deleteMentor}
      />
    </div>
  )
}
