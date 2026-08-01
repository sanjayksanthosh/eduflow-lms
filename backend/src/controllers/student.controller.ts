import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';
import { prisma } from '../config/prisma';
import * as dashboardService from '../services/dashboard.service';
import * as attendanceService from '../services/attendance.service';
import * as assignmentService from '../services/assignment.service';
import * as announcementService from '../services/announcement.service';
import { storeUpload } from '../services/upload.service';

const requireStudentId = (req: Request): string => {
  if (!req.user?.studentId) throw ApiError.forbidden('Student profile not found.');
  return req.user.studentId;
};

export const getDashboard = asyncHandler(async (req: Request, res: Response) => {
  const studentId = requireStudentId(req);
  res.json({ success: true, data: await dashboardService.studentDashboard(studentId, req.user!.id) });
});

// ---------------- Courses ----------------
export const getCourses = asyncHandler(async (req: Request, res: Response) => {
  const studentId = requireStudentId(req);
  const enrollments = await prisma.courseEnrollment.findMany({
    where: { studentId },
    include: {
      course: {
        include: {
          modules: {
            orderBy: { order: 'asc' },
            include: {
              lessons: { orderBy: { order: 'asc' } },
            },
          },
        },
      },
    },
  });

  const courses = await Promise.all(
    enrollments.map(async (enrollment) => {
      const lessons = enrollment.course.modules.flatMap((m) => m.lessons);
      const progress = await prisma.lessonProgress.findMany({
        where: { studentId, lessonId: { in: lessons.map((l) => l.id) } },
      });
      const progressMap = new Map(progress.map((p) => [p.lessonId, p]));
      return {
        ...enrollment.course,
        modules: enrollment.course.modules.map((m) => ({
          ...m,
          lessons: m.lessons.map((l) => ({
            ...l,
            completed: progressMap.get(l.id)?.completed ?? false,
            progressPercent: progressMap.get(l.id)?.progressPercent ?? 0,
          })),
        })),
        totalLessons: lessons.length,
        completedLessons: progress.filter((p) => p.completed).length,
      };
    })
  );

  res.json({ success: true, data: courses });
});

export const getCourse = asyncHandler(async (req: Request, res: Response) => {
  const studentId = requireStudentId(req);
  const enrollment = await prisma.courseEnrollment.findFirst({
    where: { studentId, courseId: req.params.id },
    include: {
      course: {
        include: {
          modules: {
            orderBy: { order: 'asc' },
            include: { lessons: { orderBy: { order: 'asc' } } },
          },
        },
      },
    },
  });
  if (!enrollment) throw ApiError.forbidden('You are not enrolled in this course.');

  const lessons = enrollment.course.modules.flatMap((m) => m.lessons);
  const progress = await prisma.lessonProgress.findMany({
    where: { studentId, lessonId: { in: lessons.map((l) => l.id) } },
  });
  const progressMap = new Map(progress.map((p) => [p.lessonId, p]));

  res.json({
    success: true,
    data: {
      ...enrollment.course,
      modules: enrollment.course.modules.map((m) => ({
        ...m,
        lessons: m.lessons.map((l) => ({
          ...l,
          completed: progressMap.get(l.id)?.completed ?? false,
          progressPercent: progressMap.get(l.id)?.progressPercent ?? 0,
        })),
      })),
    },
  });
});

export const updateLessonProgress = asyncHandler(async (req: Request, res: Response) => {
  const studentId = requireStudentId(req);
  const lesson = await prisma.lesson.findUnique({ where: { id: req.params.lessonId } });
  if (!lesson) throw ApiError.notFound('Lesson not found.');

  const enrollment = await prisma.courseEnrollment.findFirst({
    where: { studentId, courseId: lesson.moduleId ? (await prisma.module.findUniqueOrThrow({ where: { id: lesson.moduleId } })).courseId : '' },
  });
  if (!enrollment) throw ApiError.forbidden('You are not enrolled in this course.');

  const completed = req.body.completed ?? true;
  const progressPercent = req.body.progressPercent ?? (completed ? 100 : 0);

  const existing = await prisma.lessonProgress.findFirst({
    where: { lessonId: lesson.id, studentId },
  });

  const result = existing
    ? await prisma.lessonProgress.update({
        where: { id: existing.id },
        data: {
          completed,
          progressPercent,
          completedAt: completed ? new Date() : null,
        },
      })
    : await prisma.lessonProgress.create({
        data: {
          lessonId: lesson.id,
          studentId,
          completed,
          progressPercent,
          completedAt: completed ? new Date() : null,
        },
      });

  res.json({ success: true, data: result });
});

// ---------------- Attendance ----------------
export const getAttendance = asyncHandler(async (req: Request, res: Response) => {
  const studentId = requireStudentId(req);
  const { month } = req.query as { month?: string };
  res.json({ success: true, data: await attendanceService.attendanceHistoryForStudent(studentId, month) });
});

// ---------------- Assignments ----------------
export const getAssignments = asyncHandler(async (req: Request, res: Response) => {
  const studentId = requireStudentId(req);
  res.json({ success: true, data: await assignmentService.studentAssignments(studentId) });
});

export const getAssignment = asyncHandler(async (req: Request, res: Response) => {
  const studentId = requireStudentId(req);
  const student = await prisma.student.findUnique({ where: { id: studentId } });
  const assignment = await prisma.assignment.findFirst({
    where: { id: req.params.id, ...(student?.batchId ? { batchId: student.batchId } : {}) },
    include: {
      batch: { select: { name: true, code: true } },
      course: { select: { title: true } },
    },
  });
  if (!assignment) throw ApiError.notFound('Assignment not found.');
  const mySubmission = await prisma.assignmentSubmission.findFirst({
    where: { assignmentId: assignment.id, studentId },
  });
  res.json({ success: true, data: { ...assignment, mySubmission } });
});

export const submitAssignment = asyncHandler(async (req: Request, res: Response) => {
  const studentId = requireStudentId(req);
  const file = req.file ? await storeUpload(req.file, 'submissions') : undefined;
  const submission = await assignmentService.submitAssignment(req.params.id, studentId, {
    content: req.body.content,
    file,
  });
  res.json({ success: true, message: 'Submission saved.', data: submission });
});

// ---------------- Announcements ----------------
export const getAnnouncements = asyncHandler(async (req: Request, res: Response) => {
  const result = await announcementService.announcementList(
    req.query as Record<string, unknown>,
    'STUDENT',
    req.user!.id
  );
  res.json({ success: true, data: result.data, meta: result.meta });
});

// ---------------- Notifications ----------------
export const getNotifications = asyncHandler(async (req: Request, res: Response) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));
  const [total, notifications] = await Promise.all([
    prisma.notification.count({ where: { recipientId: req.user!.id } }),
    prisma.notification.findMany({
      where: { recipientId: req.user!.id },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
  ]);
  const unread = await prisma.notification.count({
    where: { recipientId: req.user!.id, isRead: false },
  });
  res.json({
    success: true,
    data: notifications,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) || 1, unread },
  });
});

export const markNotificationRead = asyncHandler(async (req: Request, res: Response) => {
  const notification = await prisma.notification.findFirst({
    where: { id: req.params.id, recipientId: req.user!.id },
  });
  if (!notification) throw ApiError.notFound('Notification not found.');
  const updated = await prisma.notification.update({
    where: { id: notification.id },
    data: { isRead: true },
  });
  res.json({ success: true, data: updated });
});

export const markAllNotificationsRead = asyncHandler(async (req: Request, res: Response) => {
  await prisma.notification.updateMany({
    where: { recipientId: req.user!.id, isRead: false },
    data: { isRead: true },
  });
  res.json({ success: true, message: 'All notifications marked as read.' });
});
