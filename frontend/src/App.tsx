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
import { AdminAnnouncementsPage } from "@/pages/admin/AdminAnnouncementsPage"
import { AdminActivityLogsPage } from "@/pages/admin/AdminActivityLogsPage"
import { AdminSettingsPage } from "@/pages/admin/AdminSettingsPage"
import { MentorDashboardPage } from "@/pages/mentor/MentorDashboardPage"
import { MentorBatchesPage } from "@/pages/mentor/MentorBatchesPage"
import { MentorAttendancePage } from "@/pages/mentor/MentorAttendancePage"
import { MentorAssignmentsPage } from "@/pages/mentor/MentorAssignmentsPage"
import { MentorAnnouncementsPage } from "@/pages/mentor/MentorAnnouncementsPage"
import { MentorMessagesPage } from "@/pages/mentor/MentorMessagesPage"
import { StudentDashboardPage } from "@/pages/student/StudentDashboardPage"
import { StudentCoursesPage } from "@/pages/student/StudentCoursesPage"
import { StudentAttendancePage } from "@/pages/student/StudentAttendancePage"
import { StudentAssignmentsPage } from "@/pages/student/StudentAssignmentsPage"
import { StudentAnnouncementsPage } from "@/pages/student/StudentAnnouncementsPage"
import { StudentNotificationsPage } from "@/pages/student/StudentNotificationsPage"
import { StudentProfilePage } from "@/pages/student/StudentProfilePage"
import { StudentMessagesPage } from "@/pages/student/StudentMessagesPage"
import { MentorReportsPage } from "@/pages/mentor/MentorReportsPage"
import { AdminReportsPage } from "@/pages/admin/AdminReportsPage"
import { ProfilePage } from "@/pages/shared/ProfilePage"
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
            <Route
              path="/admin/announcements"
              element={<AdminAnnouncementsPage />}
            />
            <Route path="/admin/reports" element={<AdminReportsPage />} />
            <Route path="/admin/activity" element={<AdminActivityLogsPage />} />
            <Route path="/admin/settings" element={<AdminSettingsPage />} />
            <Route path="/admin/profile" element={<ProfilePage />} />
          </Route>

          <Route element={<ProtectedRoute roles={["MENTOR"]} />}>
            <Route path="/mentor" element={<MentorDashboardPage />} />
            <Route path="/mentor/batches" element={<MentorBatchesPage />} />
            <Route path="/mentor/attendance" element={<MentorAttendancePage />} />
            <Route path="/mentor/assignments" element={<MentorAssignmentsPage />} />
            <Route
              path="/mentor/announcements"
              element={<MentorAnnouncementsPage />}
            />
            <Route path="/mentor/messages" element={<MentorMessagesPage />} />
            <Route path="/mentor/reports" element={<MentorReportsPage />} />
            <Route path="/mentor/profile" element={<ProfilePage description="Manage your mentor account." />} />
          </Route>

          <Route element={<ProtectedRoute roles={["STUDENT"]} />}>
            <Route path="/student" element={<StudentDashboardPage />} />
            <Route path="/student/courses" element={<StudentCoursesPage />} />
            <Route path="/student/attendance" element={<StudentAttendancePage />} />
            <Route path="/student/assignments" element={<StudentAssignmentsPage />} />
            <Route path="/student/announcements" element={<StudentAnnouncementsPage />} />
            <Route path="/student/notifications" element={<StudentNotificationsPage />} />
            <Route path="/student/messages" element={<StudentMessagesPage />} />
            <Route path="/student/profile" element={<StudentProfilePage />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to={user ? `/${user.role.toLowerCase()}` : "/login"} replace />} />
    </Routes>
  )
}
