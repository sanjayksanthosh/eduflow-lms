import { z } from 'zod';
import { ATTENDANCE_STATUS, BATCH_STATUS, GENDERS, USER_STATUS } from '../constants/enums';

export const objectIdSchema = z.string().min(1, 'ID is required');

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().trim().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const dateRangeSchema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
});

// ---------------- Student ----------------
export const createStudentSchema = z
  .object({
    fullName: z.string().trim().min(1, 'Full name is required'),
    email: z.string().trim().toLowerCase().email('A valid email is required'),
    password: z.string().min(8, 'Password must be at least 8 characters').optional(),
    phone: z.string().trim().optional(),
    address: z.string().optional(),
    gender: z.enum([GENDERS.MALE, GENDERS.FEMALE, GENDERS.OTHER]).optional(),
    dateOfBirth: z.string().optional(),
    parentName: z.string().optional(),
    parentPhone: z.string().optional(),
    emergencyContact: z.string().optional(),
    batchId: z.string().optional(),
  })
  .refine((data) => Boolean(data.password || data.phone), {
    message: 'Phone number is required when no password is provided',
    path: ['phone'],
  });

export const updateStudentSchema = z.object({
  fullName: z.string().trim().min(1).optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  gender: z.enum([GENDERS.MALE, GENDERS.FEMALE, GENDERS.OTHER]).optional(),
  dateOfBirth: z.string().optional(),
  parentName: z.string().optional(),
  parentPhone: z.string().optional(),
  emergencyContact: z.string().optional(),
});

export const studentStatusSchema = z.object({
  status: z.enum([USER_STATUS.ACTIVE, USER_STATUS.SUSPENDED, USER_STATUS.INACTIVE]),
});

export const assignBatchSchema = z.object({
  batchId: z.string().min(1, 'Batch is required'),
});

export const resetPasswordSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

// ---------------- Mentor ----------------
export const createMentorSchema = z
  .object({
    fullName: z.string().trim().min(2, 'Full name is required'),
    email: z.string().trim().toLowerCase().email('A valid email is required'),
    password: z.string().min(6, 'Password must be at least 6 characters').optional(),
    phone: z.string().optional(),
    department: z.string().optional(),
    qualification: z.string().optional(),
    subjects: z.array(z.string()).optional(),
  })
  .refine((data) => Boolean(data.password || data.phone), {
    message: 'Phone number is required (used as the initial password)',
    path: ['phone'],
  });

export const updateMentorSchema = z.object({
  fullName: z.string().trim().min(2).optional(),
  phone: z.string().optional(),
  department: z.string().optional(),
  qualification: z.string().optional(),
  subjects: z.array(z.string()).optional(),
});

// ---------------- Batch ----------------
export const createBatchSchema = z.object({
  name: z.string().trim().min(1, 'Batch name is required'),
  code: z.string().trim().optional(),
  courseId: z.string().min(1, 'Course is required'),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  capacity: z.coerce.number().int().min(1).default(30),
  status: z.enum([BATCH_STATUS.ACTIVE, BATCH_STATUS.COMPLETED, BATCH_STATUS.ARCHIVED]).optional(),
  description: z.string().optional(),
  mentorId: z.string().optional(),
  classDays: z.array(z.coerce.number().int().min(0).max(6)).optional(),
  classTime: z.string().trim().optional(),
});

export const updateBatchSchema = createBatchSchema.partial();

export const assignMentorSchema = z.object({
  mentorId: z.string().nullable().optional(),
});

export const batchStudentsSchema = z.object({
  studentIds: z.array(z.string().min(1)).min(1, 'At least one student is required'),
});

// ---------------- Course ----------------
export const createCourseSchema = z.object({
  title: z.string().trim().min(1, 'Course title is required'),
  code: z.string().trim().min(1, 'Course code is required'),
  description: z.string().optional(),
  color: z.string().optional(),
});

export const updateCourseSchema = createCourseSchema.partial();

export const createModuleSchema = z.object({
  title: z.string().trim().min(1, 'Module title is required'),
  description: z.string().optional(),
  order: z.coerce.number().int().min(0).optional(),
});

export const updateModuleSchema = createModuleSchema.partial();

export const createLessonSchema = z.object({
  title: z.string().trim().min(1, 'Lesson title is required'),
  description: z.string().optional(),
  videoUrl: z.string().optional(),
  duration: z.coerce.number().int().min(0).optional(),
  order: z.coerce.number().int().min(0).optional(),
  isPublished: z.boolean().optional(),
});

export const updateLessonSchema = createLessonSchema.partial();

// ---------------- Attendance ----------------
export const markAttendanceSchema = z.object({
  batchId: z.string().min(1, 'Batch is required'),
  date: z.string().min(1, 'Date is required'),
  records: z
    .array(
      z.object({
        studentId: z.string().min(1),
        status: z.enum([
          ATTENDANCE_STATUS.PRESENT,
          ATTENDANCE_STATUS.ABSENT,
          ATTENDANCE_STATUS.LATE,
          ATTENDANCE_STATUS.LEAVE,
        ]),
        remarks: z.string().optional(),
      })
    )
    .min(1, 'At least one attendance record is required'),
});

export const attendanceQuerySchema = z.object({
  batchId: z.string().optional(),
  date: z.string().optional(),
  month: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// ---------------- Assignment ----------------
export const createAssignmentSchema = z.object({
  title: z.string().trim().min(1, 'Title is required'),
  description: z.string().optional(),
  instructions: z.string().optional(),
  maxMarks: z.coerce.number().int().min(1).default(100),
  dueDate: z.string().min(1, 'Due date is required'),
  lateSubmissionAllowed: z.boolean().default(false),
  batchId: z.string().min(1, 'Batch is required'),
  courseId: z.string().optional(),
  status: z.string().optional(),
  attachmentUrl: z.string().optional(),
  attachmentName: z.string().optional(),
});

export const updateAssignmentSchema = createAssignmentSchema.partial();

export const gradeSubmissionSchema = z.object({
  marks: z.coerce.number().int().min(0, 'Marks must be 0 or more'),
  feedback: z.string().optional(),
  status: z.enum(['APPROVED', 'REJECTED']).optional(),
});

export const submitAssignmentSchema = z.object({
  content: z.string().optional(),
});

// ---------------- Announcement ----------------
export const createAnnouncementSchema = z.object({
  title: z.string().trim().min(1, 'Title is required'),
  content: z.string().trim().min(1, 'Content is required'),
  target: z.enum(['ALL', 'BATCH', 'STUDENT']).default('ALL'),
  batchId: z.string().optional(),
  studentId: z.string().optional(),
  scheduledAt: z.string().optional(),
});

export const updateAnnouncementSchema = createAnnouncementSchema.partial();

// ---------------- Notifications ----------------
export const markReadSchema = z.object({
  isRead: z.boolean().default(true),
});

// ---------------- Lesson progress ----------------
export const lessonProgressSchema = z.object({
  completed: z.boolean().default(true),
  progressPercent: z.coerce.number().int().min(0).max(100).optional(),
});
