import type { LucideIcon } from "lucide-react"
import {
  Activity,
  BarChart3,
  Bell,
  BookOpen,
  CalendarCheck,
  ClipboardList,
  GraduationCap,
  LayoutDashboard,
  Library,
  Megaphone,
  MessageSquare,
  Settings,
  UserCheck,
  Users,
} from "lucide-react"
import type { Role } from "@/lib/types"

export type NavEntry =
  | { to: string; label: string; icon: LucideIcon }
  | { section: string }

export const NAV_ITEMS: Record<Role, NavEntry[]> = {
  ADMIN: [
    { to: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { section: "Management" },
    { to: "/admin/students", label: "Students", icon: Users },
    { to: "/admin/mentors", label: "Mentors", icon: UserCheck },
    { to: "/admin/batches", label: "Batches", icon: BookOpen },
    { to: "/admin/courses", label: "Courses", icon: Library },
    { to: "/admin/announcements", label: "Announcements", icon: Megaphone },
    { section: "Analytics" },
    { to: "/admin/reports", label: "Reports", icon: BarChart3 },
    { to: "/admin/activity", label: "Activity Logs", icon: Activity },
    { section: "System" },
    { to: "/admin/messages", label: "Messages", icon: MessageSquare },
    { to: "/admin/settings", label: "Settings", icon: Settings },
  ],
  MENTOR: [
    { to: "/mentor", label: "Dashboard", icon: LayoutDashboard },
    { to: "/mentor/batches", label: "My Batches", icon: BookOpen },
    { to: "/mentor/attendance", label: "Attendance", icon: CalendarCheck },
    { to: "/mentor/assignments", label: "Assignments", icon: ClipboardList },
    { to: "/mentor/announcements", label: "Announcements", icon: Megaphone },
    { to: "/mentor/messages", label: "Messages", icon: MessageSquare },
    { section: "Analytics" },
    { to: "/mentor/reports", label: "Reports", icon: BarChart3 },
  ],
  STUDENT: [
    { to: "/student", label: "Dashboard", icon: LayoutDashboard },
    { to: "/student/courses", label: "My Courses", icon: GraduationCap },
    { to: "/student/attendance", label: "Attendance", icon: CalendarCheck },
    { to: "/student/assignments", label: "Assignments", icon: ClipboardList },
    { to: "/student/announcements", label: "Announcements", icon: Megaphone },
    { to: "/student/notifications", label: "Notifications", icon: Bell },
    { section: "Account" },
    { to: "/student/profile", label: "My Profile", icon: Users },
  ],
}
