import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';
import * as studentService from '../services/student.service';
import * as mentorService from '../services/mentor.service';
import * as batchService from '../services/batch.service';
import * as courseService from '../services/course.service';
import * as attendanceService from '../services/attendance.service';
import * as assignmentService from '../services/assignment.service';
import * as announcementService from '../services/announcement.service';
import * as dashboardService from '../services/dashboard.service';
import * as reportService from '../services/report.service';
import * as settingsService from '../services/settings.service';
import { storeUpload } from '../services/upload.service';
import { prisma } from '../config/prisma';
import { exportCsv, exportExcel, exportPdf } from '../utils/export';

// ---------------- Dashboard ----------------
export const getDashboard = asyncHandler(async (_req: Request, res: Response) => {
  res.json({ success: true, data: await dashboardService.adminDashboard() });
});

// ---------------- Students ----------------
export const listStudents = asyncHandler(async (req: Request, res: Response) => {
  const result = await studentService.studentList(req.query as Record<string, unknown>);
  res.json({ success: true, data: result.data, meta: result.meta });
});

export const getStudent = asyncHandler(async (req: Request, res: Response) => {
  res.json({ success: true, data: await studentService.getStudent(req.params.id) });
});

export const createStudent = asyncHandler(async (req: Request, res: Response) => {
  const student = await studentService.createStudent(req.body);
  res.status(201).json({ success: true, message: 'Student created successfully.', data: student });
});

export const updateStudent = asyncHandler(async (req: Request, res: Response) => {
  const student = await studentService.updateStudent(req.params.id, req.body);
  res.json({ success: true, message: 'Student updated.', data: student });
});

export const deleteStudent = asyncHandler(async (req: Request, res: Response) => {
  res.json({ success: true, data: await studentService.deleteStudent(req.params.id, req) });
});

export const setStudentStatus = asyncHandler(async (req: Request, res: Response) => {
  const result = await studentService.updateStudentStatus(req.params.id, req.body.status);
  res.json({
    success: true,
    message: `Student ${result.status === 'SUSPENDED' ? 'suspended' : 'activated'}.`,
    data: result,
  });
});

export const assignStudentBatch = asyncHandler(async (req: Request, res: Response) => {
  const student = await studentService.assignStudentBatch(req.params.id, req.body.batchId ?? null);
  res.json({ success: true, message: 'Batch updated.', data: student });
});

export const resetStudentPassword = asyncHandler(async (req: Request, res: Response) => {
  const result = await studentService.resetStudentPassword(req.params.id, req.body.password);
  res.json({ success: true, message: result.message, data: result });
});

export const uploadStudentPicture = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) throw ApiError.badRequest('No image provided.');
  const file = await storeUpload(req.file, 'profile-images');
  await studentService.updateStudentProfileImage(req.params.id, file.url);
  res.json({ success: true, message: 'Profile picture updated.', data: { url: file.url } });
});

// ---------------- Mentors ----------------
export const listMentors = asyncHandler(async (req: Request, res: Response) => {
  const result = await mentorService.mentorList(req.query as Record<string, unknown>);
  res.json({ success: true, data: result.data, meta: result.meta });
});

export const getMentor = asyncHandler(async (req: Request, res: Response) => {
  res.json({ success: true, data: await mentorService.getMentor(req.params.id) });
});

export const createMentor = asyncHandler(async (req: Request, res: Response) => {
  const mentor = await mentorService.createMentor(req.body);
  res.status(201).json({ success: true, message: 'Mentor created successfully.', data: mentor });
});

export const updateMentor = asyncHandler(async (req: Request, res: Response) => {
  const mentor = await mentorService.updateMentor(req.params.id, req.body);
  res.json({ success: true, message: 'Mentor updated.', data: mentor });
});

export const deleteMentor = asyncHandler(async (req: Request, res: Response) => {
  res.json({ success: true, data: await mentorService.deleteMentor(req.params.id, req) });
});

export const resetMentorPassword = asyncHandler(async (req: Request, res: Response) => {
  const result = await mentorService.resetMentorPassword(req.params.id, req.body.password);
  res.json({ success: true, message: result.message, data: result });
});

export const uploadMentorPicture = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) throw ApiError.badRequest('No image provided.');
  const file = await storeUpload(req.file, 'profile-images');
  await prisma.user.update({
    where: { id: (await prisma.mentor.findUniqueOrThrow({ where: { id: req.params.id } })).userId },
    data: { profileImage: file.url },
  });
  res.json({ success: true, message: 'Profile picture updated.', data: { url: file.url } });
});

// ---------------- Batches ----------------
export const listBatches = asyncHandler(async (req: Request, res: Response) => {
  const result = await batchService.batchList(req.query as Record<string, unknown>);
  res.json({ success: true, data: result.data, meta: result.meta });
});

export const getBatch = asyncHandler(async (req: Request, res: Response) => {
  res.json({ success: true, data: await batchService.getBatch(req.params.id) });
});

export const createBatch = asyncHandler(async (req: Request, res: Response) => {
  const batch = await batchService.createBatch(req.body);
  res.status(201).json({ success: true, message: 'Batch created.', data: batch });
});

export const updateBatch = asyncHandler(async (req: Request, res: Response) => {
  const batch = await batchService.updateBatch(req.params.id, req.body);
  res.json({ success: true, message: 'Batch updated.', data: batch });
});

export const deleteBatch = asyncHandler(async (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Batch deleted.',
    data: await batchService.deleteBatch(req.params.id),
  });
});

export const assignStudents = asyncHandler(async (req: Request, res: Response) => {
  const batch = await batchService.assignStudentsToBatch(req.params.id, req.body.studentIds);
  res.json({ success: true, message: 'Students assigned.', data: batch });
});

export const removeStudent = asyncHandler(async (req: Request, res: Response) => {
  const batch = await batchService.removeStudentFromBatch(req.params.id, req.params.studentId);
  res.json({ success: true, message: 'Student removed from batch.', data: batch });
});

// ---------------- Courses ----------------
export const listCourses = asyncHandler(async (req: Request, res: Response) => {
  const result = await courseService.courseList(req.query as Record<string, unknown>);
  res.json({ success: true, data: result.data, meta: result.meta });
});

export const getCourse = asyncHandler(async (req: Request, res: Response) => {
  res.json({ success: true, data: await courseService.getCourse(req.params.id) });
});

export const createCourse = asyncHandler(async (req: Request, res: Response) => {
  const course = await courseService.createCourse(req.body);
  res.status(201).json({ success: true, message: 'Course created.', data: course });
});

export const updateCourse = asyncHandler(async (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Course updated.',
    data: await courseService.updateCourse(req.params.id, req.body),
  });
});

export const deleteCourse = asyncHandler(async (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Course deleted.',
    data: await courseService.deleteCourse(req.params.id),
  });
});

export const createModule = asyncHandler(async (req: Request, res: Response) => {
  const module = await courseService.createModule(req.params.courseId, req.body);
  res.status(201).json({ success: true, message: 'Module created.', data: module });
});

export const updateModule = asyncHandler(async (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Module updated.',
    data: await courseService.updateModule(req.params.id, req.body),
  });
});

export const deleteModule = asyncHandler(async (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Module deleted.',
    data: await courseService.deleteModule(req.params.id),
  });
});

export const createLesson = asyncHandler(async (req: Request, res: Response) => {
  const lesson = await courseService.createLesson(req.params.moduleId, req.body);
  res.status(201).json({ success: true, message: 'Lesson created.', data: lesson });
});

export const updateLesson = asyncHandler(async (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Lesson updated.',
    data: await courseService.updateLesson(req.params.id, req.body),
  });
});

export const deleteLesson = asyncHandler(async (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Lesson deleted.',
    data: await courseService.deleteLesson(req.params.id),
  });
});

export const uploadLessonFile = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) throw ApiError.badRequest('No file provided.');
  const file = await storeUpload(req.file, 'lesson-files');
  const lesson = await courseService.attachLessonFile(req.params.id, file);
  res.json({ success: true, message: 'File attached.', data: lesson });
});

// ---------------- Attendance ----------------
export const getAttendance = asyncHandler(async (req: Request, res: Response) => {
  const { batchId, date } = req.query as { batchId?: string; date?: string };
  if (batchId) {
    res.json({
      success: true,
      data: await attendanceService.attendanceForBatchDate(batchId, date),
    });
    return;
  }
  res.json({ success: true, data: await attendanceService.todayAttendanceSummary() });
});

export const markAttendance = asyncHandler(async (req: Request, res: Response) => {
  const result = await attendanceService.markAttendance({
    ...req.body,
    mentorId: req.body.batchId
      ? ((await prisma.batch.findUniqueOrThrow({ where: { id: req.body.batchId } })).mentorId ?? '')
      : '',
    userId: req.user!.id,
    ip: req.ip,
  });
  res.json({ success: true, message: 'Attendance recorded.', data: result });
});

export const getStudentAttendance = asyncHandler(async (req: Request, res: Response) => {
  const { month } = req.query as { month?: string };
  res.json({
    success: true,
    data: await attendanceService.attendanceHistoryForStudent(req.params.id, month),
  });
});

// ---------------- Assignments ----------------
export const listAssignments = asyncHandler(async (req: Request, res: Response) => {
  const result = await assignmentService.assignmentList(req.query as Record<string, unknown>);
  res.json({ success: true, data: result.data, meta: result.meta });
});

export const getAssignment = asyncHandler(async (req: Request, res: Response) => {
  res.json({ success: true, data: await assignmentService.getAssignment(req.params.id) });
});

export const createAssignment = asyncHandler(async (req: Request, res: Response) => {
  const { mentorId } = req.body as { mentorId?: string };
  if (!mentorId) {
    const { ApiError: AE } = await import('../utils/ApiError');
    throw new AE(400, 'mentorId is required.');
  }
  const assignment = await assignmentService.createAssignment(req.body, mentorId);
  res.status(201).json({ success: true, message: 'Assignment created.', data: assignment });
});

export const updateAssignment = asyncHandler(async (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Assignment updated.',
    data: await assignmentService.updateAssignment(req.params.id, req.body),
  });
});

export const deleteAssignment = asyncHandler(async (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Assignment deleted.',
    data: await assignmentService.deleteAssignment(req.params.id),
  });
});

// ---------------- Announcements ----------------
export const listAnnouncements = asyncHandler(async (req: Request, res: Response) => {
  const result = await announcementService.announcementList(
    req.query as Record<string, unknown>,
    req.user!.role,
    req.user!.id
  );
  res.json({ success: true, data: result.data, meta: result.meta });
});

export const createAnnouncement = asyncHandler(async (req: Request, res: Response) => {
  const announcement = await announcementService.createAnnouncement(req.body, req.user!.id);
  res.status(201).json({ success: true, message: 'Announcement created.', data: announcement });
});

export const updateAnnouncement = asyncHandler(async (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Announcement updated.',
    data: await announcementService.updateAnnouncement(req.params.id, req.body),
  });
});

export const deleteAnnouncement = asyncHandler(async (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Announcement deleted.',
    data: await announcementService.deleteAnnouncement(req.params.id),
  });
});

// ---------------- Reports ----------------
const reportFilename = (name: string) => `eduflow-${name}-${new Date().toISOString().slice(0, 10)}`;

export const attendanceReport = asyncHandler(async (req: Request, res: Response) => {
  const report = await reportService.attendanceReport(
    req.query as { batchId?: string; from?: string; to?: string }
  );
  const format = (req.query.format as string) ?? 'json';
  if (format === 'csv') return exportCsv(res, reportFilename('attendance'), report.rows);
  if (format === 'xlsx') return exportExcel(res, reportFilename('attendance'), report.rows);
  if (format === 'pdf') {
    return exportPdf(
      res,
      reportFilename('attendance'),
      'Attendance Report',
      report.rows,
      'EduFlow LMS'
    );
  }
  res.json({ success: true, data: report });
});

export const performanceReport = asyncHandler(async (req: Request, res: Response) => {
  const report = await reportService.studentPerformanceReport(
    req.query.batchId as string | undefined
  );
  const format = (req.query.format as string) ?? 'json';
  if (format === 'csv') return exportCsv(res, reportFilename('performance'), report.rows);
  if (format === 'xlsx') return exportExcel(res, reportFilename('performance'), report.rows);
  if (format === 'pdf') {
    return exportPdf(
      res,
      reportFilename('performance'),
      'Student Performance Report',
      report.rows,
      'EduFlow LMS'
    );
  }
  res.json({ success: true, data: report });
});

export const assignmentReport = asyncHandler(async (req: Request, res: Response) => {
  const report = await reportService.assignmentReport(req.query.batchId as string | undefined);
  const format = (req.query.format as string) ?? 'json';
  if (format === 'csv') return exportCsv(res, reportFilename('assignments'), report.rows);
  if (format === 'xlsx') return exportExcel(res, reportFilename('assignments'), report.rows);
  if (format === 'pdf') {
    return exportPdf(
      res,
      reportFilename('assignments'),
      'Assignment Report',
      report.rows,
      'EduFlow LMS'
    );
  }
  res.json({ success: true, data: report });
});

export const batchReport = asyncHandler(async (_req: Request, res: Response) => {
  const report = await reportService.batchReport();
  const format = (_req.query.format as string) ?? 'json';
  if (format === 'csv') return exportCsv(res, reportFilename('batches'), report.rows);
  if (format === 'xlsx') return exportExcel(res, reportFilename('batches'), report.rows);
  if (format === 'pdf') {
    return exportPdf(res, reportFilename('batches'), 'Batch Report', report.rows, 'EduFlow LMS');
  }
  res.json({ success: true, data: report });
});

export const mentorReport = asyncHandler(async (_req: Request, res: Response) => {
  const report = await reportService.mentorReport();
  const format = (_req.query.format as string) ?? 'json';
  if (format === 'csv') return exportCsv(res, reportFilename('mentors'), report.rows);
  if (format === 'xlsx') return exportExcel(res, reportFilename('mentors'), report.rows);
  if (format === 'pdf') {
    return exportPdf(res, reportFilename('mentors'), 'Mentor Report', report.rows, 'EduFlow LMS');
  }
  res.json({ success: true, data: report });
});

// ---------------- Settings ----------------
export const getSettings = asyncHandler(async (_req: Request, res: Response) => {
  res.json({ success: true, data: await settingsService.getSettings() });
});

export const updateSettings = asyncHandler(async (req: Request, res: Response) => {
  await settingsService.updateSettings(req.body);
  res.json({
    success: true,
    message: 'Settings saved.',
    data: await settingsService.getSettings(),
  });
});

// ---------------- Activity logs ----------------
export const getActivityLogs = asyncHandler(async (req: Request, res: Response) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
  const [total, logs] = await Promise.all([
    prisma.activityLog.count(),
    prisma.activityLog.findMany({
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { firstName: true, lastName: true, role: true, email: true } } },
    }),
  ]);
  res.json({
    success: true,
    data: logs,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
  });
});
