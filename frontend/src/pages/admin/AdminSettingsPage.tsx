import { useEffect, useState } from "react"
import { Building2, Save } from "lucide-react"
import { toast } from "sonner"
import { api, getErrorMessage } from "@/lib/api"
import { PageHeader } from "@/components/shared/PageHeader"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { AppSettings } from "@/lib/types"

const DEFAULT_SETTINGS: AppSettings = {
  instituteName: "EduFlow Institute",
  logo: null,
  address: "",
  theme: "light",
  academicYear: new Date().getFullYear().toString(),
  semester: "Semester 1",
  holidays: [],
}

export function AdminSettingsPage() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const { data } = await api.get("/admin/settings")
      setSettings({ ...DEFAULT_SETTINGS, ...(data.data as Partial<AppSettings>) })
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const set = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) =>
    setSettings((prev) => ({ ...prev, [key]: value }))

  const save = async () => {
    setSaving(true)
    try {
      await api.put("/admin/settings", {
        instituteName: settings.instituteName,
        address: settings.address,
        theme: settings.theme,
        academicYear: settings.academicYear,
        semester: settings.semester,
      })
      toast.success("Settings saved.")
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <p className="py-12 text-center text-sm text-muted-foreground">Loading settings...</p>
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Configure institute-wide preferences."
        actions={
          <Button onClick={save} disabled={saving}>
            <Save /> {saving ? "Saving..." : "Save settings"}
          </Button>
        }
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Building2 className="size-4 text-muted-foreground" />
              Institute details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="instituteName">Institute name</Label>
              <Input
                id="instituteName"
                value={settings.instituteName}
                onChange={(e) => set("instituteName", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                value={settings.address}
                onChange={(e) => set("address", e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Academic calendar</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="academicYear">Academic year</Label>
                <Input
                  id="academicYear"
                  value={settings.academicYear}
                  onChange={(e) => set("academicYear", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="semester">Semester</Label>
                <Input
                  id="semester"
                  value={settings.semester}
                  onChange={(e) => set("semester", e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="holidays">Holidays</Label>
              <Textarea
                id="holidays"
                value={settings.holidays.join("\n")}
                placeholder="One date per line (YYYY-MM-DD)"
                onChange={(e) =>
                  set(
                    "holidays",
                    e.target.value
                      .split("\n")
                      .map((s) => s.trim())
                      .filter(Boolean)
                  )
                }
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
