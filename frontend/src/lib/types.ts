export type Role = "ADMIN" | "MENTOR" | "STUDENT"

export type UserStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED"

export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: Role
  status: UserStatus
  profileImage: string | null
  phone?: string | null
  studentId?: string | null
  mentorId?: string | null
}

export interface AuthResponse {
  accessToken: string
  refreshToken: string
  user: User
}

export interface TokenResponse {
  accessToken: string
  refreshToken: string
}

export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface ApiResponse<T> {
  success: boolean
  message?: string
  data: T
}

export interface ListResponse<T> extends ApiResponse<T[]> {
  meta: PaginationMeta
}

export interface DashboardStats {
  totalStudents: number
  totalMentors: number
  totalBatches: number
  totalCourses: number
  todayAttendance: number
  assignmentSubmissionRate: number
  assignmentSubmissionCount: number
  submissionGradingRate: number
}

// ---------------- Admin domain types ----------------

export interface BatchSummary {
  id: string
  name: string
  code: string
}

export interface StudentUser {
  id: string
  email: string
  firstName: string
  lastName: string
  phone: string | null
  address: string | null
  profileImage: string | null
  status: UserStatus
  createdAt: string
}

export interface Student {
  id: string
  userId: string
  admissionNumber: string
  parentName: string | null
  parentPhone: string | null
  emergencyContact: string | null
  dateOfBirth: string | null
  gender: string | null
  batchId: string | null
  createdAt: string
  updatedAt: string
  user: StudentUser
  batch: BatchSummary | null
  attendanceCount: number
  attendanceSummary: Record<string, number>
}

export interface MentorBatch {
  id: string
  name: string
  code: string
  status: string
}

export interface Mentor {
  id: string
  userId: string
  department: string | null
  qualification: string | null
  specialization: string | null
  experience: number | null
  subjects: string[] | null
  bio: string | null
  user: StudentUser
  batches: MentorBatch[]
}

export interface BatchCourse {
  id: string
  title: string
  code: string
  color: string | null
}

export interface Batch {
  id: string
  name: string
  code: string
  description: string | null
  startDate: string | null
  endDate: string | null
  capacity: number
  status: string
  courseId: string
  mentorId: string | null
  classDays: number[]
  classTime: string | null
  createdAt: string
  course: BatchCourse
  mentor: { id: string; user: { firstName: string; lastName: string; email: string } } | null
  _count: { students: number; assignments: number }
}

export interface Course {
  id: string
  title: string
  code: string
  slug: string
  description: string | null
  color: string | null
  createdAt: string
  _count: { modules: number; batches: number }
}

export interface Lesson {
  id: string
  moduleId: string
  title: string
  description: string | null
  order: number
  duration: number
  videoUrl: string | null
  attachmentUrl: string | null
  attachmentName: string | null
  contentType: string | null
  isPublished: boolean
}

export interface CourseModule {
  id: string
  title: string
  description: string | null
  order: number
  lessons: Lesson[]
}

export interface CourseDetail extends Course {
  modules: CourseModule[]
  batches: BatchSummary[]
  stats: { modules: number; lessons: number; totalDuration: number }
}

export interface BatchDetail extends Batch {
  course: { id: string; title: string; code: string; color: string | null; modules: CourseModule[] }
  students: (Student & { user: StudentUser })[]
}

export interface Assignment {
  id: string
  title: string
  description: string | null
  instructions: string | null
  batchId: string
  courseId: string
  mentorId: string | null
  dueDate: string | null
  status: string
  maxMarks: number
  lateSubmissionAllowed: boolean
  attachmentUrl: string | null
  attachmentName: string | null
  createdAt: string
  batch: BatchSummary
  course: { id: string; title: string }
  mentor: { id: string; user: { firstName: string; lastName: string } } | null
  submissionStats: {
    total: number
    submitted: number
    graded: number
    averageMarks: number
  }
}

export interface Announcement {
  id: string
  authorId: string
  title: string
  content: string
  target: string
  batchId: string | null
  studentId: string | null
  scheduledAt: string | null
  publishedAt: string | null
  isActive: boolean
  createdAt: string
  author: { firstName: string; lastName: string; role: string }
  batch: { id: string; name: string } | null
}

export interface ActivityLog {
  id: string
  userId: string
  type: string
  description: string
  ip: string | null
  metadata: unknown
  createdAt: string
  user: { firstName: string; lastName: string; role: string; email: string } | null
}

export interface AttendanceSummary {
  marked: number
  total: number
  percent: number
}

export interface BatchAttendanceStudent {
  id: string
  admissionNumber: string
  name: string
  email: string
  profileImage: string | null
  attendance: { id: string; status: string; remarks: string | null } | null
}

export interface BatchAttendance {
  batch: BatchSummary
  date: string
  marked: boolean
  students: BatchAttendanceStudent[]
}

export interface AppSettings {
  instituteName: string
  logo: string | null
  address: string
  theme: string
  academicYear: string
  semester: string
  holidays: string[]
}
