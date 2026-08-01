import { Navigate, Route, Routes } from "react-router-dom"
import { AppLayout } from "@/components/layout/AppLayout"
import { ProtectedRoute, PublicOnlyRoute } from "@/components/auth/ProtectedRoute"
import { LoginPage } from "@/pages/auth/LoginPage"
import { ForgotPasswordPage } from "@/pages/auth/ForgotPasswordPage"
import { ResetPasswordPage } from "@/pages/auth/ResetPasswordPage"
import { AdminDashboardPage } from "@/pages/admin/AdminDashboardPage"
import { AdminStudentsPage } from "@/pages/admin/AdminStudentsPage"
import { AdminMentorsPage } from "@/pages/admin/AdminMentorsPage"
import { AdminBatchesPage } from "@/pages/admin/AdminBatchesPage"
import { AdminCoursesPage } from "@/pages/admin/AdminCoursesPage"
import { AdminAssignmentsPage } from "@/pages/admin/AdminAssignmentsPage"
import { AdminAnnouncementsPage } from "@/pages/admin/AdminAnnouncementsPage"
import { AdminAttendancePage } from "@/pages/admin/AdminAttendancePage"
import { AdminActivityLogsPage } from "@/pages/admin/AdminActivityLogsPage"
import { AdminSettingsPage } from "@/pages/admin/AdminSettingsPage"
import { MentorDashboardPage } from "@/pages/mentor/MentorDashboardPage"
import { StudentDashboardPage } from "@/pages/student/StudentDashboardPage"
import { PlaceholderPage } from "@/pages/PlaceholderPage"
import { useAuth } from "@/context/AuthContext"

export default function App() {
  const { user } = useAuth()

  return (
    <Routes>
      <Route element={<PublicOnlyRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route element={<ProtectedRoute roles={["ADMIN"]} />}>
            <Route path="/admin" element={<AdminDashboardPage />} />
            <Route path="/admin/students" element={<AdminStudentsPage />} />
            <Route path="/admin/mentors" element={<AdminMentorsPage />} />
            <Route path="/admin/batches" element={<AdminBatchesPage />} />
            <Route path="/admin/courses" element={<AdminCoursesPage />} />
            <Route path="/admin/assignments" element={<AdminAssignmentsPage />} />
            <Route
              path="/admin/announcements"
              element={<AdminAnnouncementsPage />}
            />
            <Route path="/admin/attendance" element={<AdminAttendancePage />} />
            <Route path="/admin/reports" element={<PlaceholderPage title="Reports" />} />
            <Route path="/admin/activity" element={<AdminActivityLogsPage />} />
            <Route path="/admin/messages" element={<PlaceholderPage title="Messages" />} />
            <Route path="/admin/settings" element={<AdminSettingsPage />} />
            <Route path="/admin/profile" element={<PlaceholderPage title="Profile" />} />
          </Route>

          <Route element={<ProtectedRoute roles={["MENTOR"]} />}>
            <Route path="/mentor" element={<MentorDashboardPage />} />
            <Route path="/mentor/batches" element={<PlaceholderPage title="My Batches" />} />
            <Route path="/mentor/attendance" element={<PlaceholderPage title="Attendance" />} />
            <Route path="/mentor/assignments" element={<PlaceholderPage title="Assignments" />} />
            <Route
              path="/mentor/announcements"
              element={<PlaceholderPage title="Announcements" />}
            />
            <Route path="/mentor/messages" element={<PlaceholderPage title="Messages" />} />
            <Route path="/mentor/profile" element={<PlaceholderPage title="Profile" />} />
          </Route>

          <Route element={<ProtectedRoute roles={["STUDENT"]} />}>
            <Route path="/student" element={<StudentDashboardPage />} />
            <Route path="/student/courses" element={<PlaceholderPage title="My Courses" />} />
            <Route path="/student/attendance" element={<PlaceholderPage title="Attendance" />} />
            <Route path="/student/assignments" element={<PlaceholderPage title="Assignments" />} />
            <Route
              path="/student/announcements"
              element={<PlaceholderPage title="Announcements" />}
            />
            <Route
              path="/student/notifications"
              element={<PlaceholderPage title="Notifications" />}
            />
            <Route path="/student/profile" element={<PlaceholderPage title="Profile" />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to={user ? `/${user.role.toLowerCase()}` : "/login"} replace />} />
    </Routes>
  )
}
