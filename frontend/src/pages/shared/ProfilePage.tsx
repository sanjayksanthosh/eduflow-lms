import { useEffect, useState } from "react"
import { KeyRound, Save, UserRound } from "lucide-react"
import { toast } from "sonner"
import { api, getErrorMessage } from "@/lib/api"
import { PageHeader } from "@/components/shared/PageHeader"
import { PageLoader } from "@/components/shared/PageLoader"
import { ErrorState } from "@/components/shared/ErrorState"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from "@/context/AuthContext"
import { fullName, getInitials } from "@/lib/format"

interface MeResponse {
  id: string
  email: string
  firstName: string
  lastName: string
  phone: string | null
  address: string | null
  role: string
  status: string
  profileImage: string | null
  createdAt: string
}

export function ProfilePage({ description }: { description?: string }) {
  const { updateUser, logout } = useAuth()
  const [me, setMe] = useState<MeResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [phone, setPhone] = useState("")
  const [address, setAddress] = useState("")
  const [savingProfile, setSavingProfile] = useState(false)

  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [changingPassword, setChangingPassword] = useState(false)

  useEffect(() => {
    api
      .get("/auth/me")
      .then(({ data }) => {
        const u = data.data as MeResponse
        setMe(u)
        setFirstName(u.firstName)
        setLastName(u.lastName)
        setPhone(u.phone ?? "")
        setAddress(u.address ?? "")
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false))
  }, [])

  const saveProfile = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      toast.error("First and last name are required.")
      return
    }
    setSavingProfile(true)
    try {
      await api.patch("/profile", {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim() || undefined,
        address: address.trim() || undefined,
      })
      if (me) {
        updateUser({
          ...me,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          phone: phone.trim() || null,
          address: address.trim() || null,
        } as never)
        setMe({ ...me, firstName: firstName.trim(), lastName: lastName.trim(), phone: phone.trim() || null, address: address.trim() || null })
      }
      toast.success("Profile updated.")
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setSavingProfile(false)
    }
  }

  const changePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("All password fields are required.")
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match.")
      return
    }
    if (newPassword.length < 8 || !/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      toast.error("Password must be 8+ characters with upper, lower and number.")
      return
    }
    setChangingPassword(true)
    try {
      await api.post("/auth/change-password", { currentPassword, newPassword })
      toast.success("Password changed. Please log in again.")
      setTimeout(() => void logout(), 1200)
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setChangingPassword(false)
    }
  }

  if (loading) return <PageLoader />
  if (error || !me) {
    return (
      <div className="space-y-6">
        <PageHeader title="My Profile" />
        <ErrorState message={error ?? "Failed to load profile."} onRetry={() => window.location.reload()} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader title="My Profile" description={description ?? "Manage your account details."} />

      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <Avatar size="lg">
              <AvatarImage src={me.profileImage ?? undefined} alt={fullName(me.firstName, me.lastName)} />
              <AvatarFallback>{getInitials(me.firstName, me.lastName)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-semibold">{fullName(me.firstName, me.lastName)}</h2>
                <Badge variant="secondary">{me.role}</Badge>
                <Badge variant={me.status === "ACTIVE" ? "outline" : "destructive"}>{me.status}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">{me.email}</p>
            </div>
            <div className="rounded-lg bg-muted px-4 py-2 text-center">
              <UserRound className="mx-auto mb-1 size-4 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">Member since</p>
              <p className="text-sm font-medium">
                {new Date(me.createdAt).toLocaleDateString(undefined, { month: "short", year: "numeric" })}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="stagger grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="firstName">First name</Label>
                <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="lastName">Last name</Label>
                <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={me.email} disabled />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 555 0000" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="address">Address</Label>
              <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Street, City" />
            </div>
            <Button onClick={() => void saveProfile()} disabled={savingProfile}>
              <Save /> {savingProfile ? "Saving..." : "Save changes"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <KeyRound className="size-4" /> Change Password
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="currentPassword">Current password</Label>
              <Input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                autoComplete="current-password"
              />
            </div>
            <Separator />
            <div className="grid gap-2">
              <Label htmlFor="newPassword">New password</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
              />
              <p className="text-xs text-muted-foreground">
                Minimum 8 characters with uppercase, lowercase and a number.
              </p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="confirmPassword">Confirm new password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => void changePassword()}
              disabled={changingPassword}
            >
              <KeyRound /> {changingPassword ? "Updating..." : "Update password"}
            </Button>
            <p className="text-xs text-muted-foreground">
              You will be signed out and need to log in with your new password.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
