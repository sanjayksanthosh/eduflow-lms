import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';
import { prisma } from '../config/prisma';
import * as dashboardService from '../services/dashboard.service';
import * as attendanceService from '../services/attendance.service';
import * as assignmentService from '../services/assignment.service';
import * as announcementService from '../services/announcement.service';
import * as studentService from '../services/student.service';
import { storeUpload } from '../services/upload.service';
import { createNotification } from '../services/notification.service';

const requireMentorId = (req: Request): string => {
  if (!req.user?.mentorId) throw ApiError.forbidden('Mentor profile not found.');
  return req.user.mentorId;
};

const assertBatchAssigned = async (mentorId: string, batchId: string) => {
  const batch = await prisma.batch.findFirst({ where: { id: batchId, mentorId } });
  if (!batch) throw ApiError.forbidden('You are not assigned to this batch.');
  return batch;
};

export const getDashboard = asyncHandler(async (req: Request, res: Response) => {
  const mentorId = requireMentorId(req);
  res.json({ success: true, data: await dashboardService.mentorDashboard(mentorId) });
});

// ---------------- Batches ----------------
export const listBatches = asyncHandler(async (req: Request, res: Response) => {
  const mentorId = requireMentorId(req);
  const batches = await prisma.batch.findMany({
    where: { mentorId },
    include: {
      course: { select: { id: true, title: true, code: true, color: true } },
      _count: { select: { students: true, assignments: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
  res.json({ success: true, data: batches });
});

export const getBatch = asyncHandler(async (req: Request, res: Response) => {
  const mentorId = requireMentorId(req);
  await assertBatchAssigned(mentorId, req.params.id);
  const batch = await prisma.batch.findUnique({
    where: { id: req.params.id },
    include: {
      course: { select: { id: true, title: true, code: true, color: true } },
      students: {
        include: { user: { select: { firstName: true, lastName: true, email: true, phone: true, profileImage: true } } },
        orderBy: { admissionNumber: 'asc' },
      },
    },
  });
  res.json({ success: true, data: batch });
});

// ---------------- Attendance ----------------
export const getAttendance = asyncHandler(async (req: Request, res: Response) => {
  const mentorId = requireMentorId(req);
  await assertBatchAssigned(mentorId, req.params.batchId);
  const { date } = req.query as { date?: string };
  res.json({ success: true, data: await attendanceService.attendanceForBatchDate(req.params.batchId, date) });
});

export const markAttendance = asyncHandler(async (req: Request, res: Response) => {
  const mentorId = requireMentorId(req);
  await assertBatchAssigned(mentorId, req.params.batchId);
  const result = await attendanceService.markAttendance({
    batchId: req.params.batchId,
    date: req.body.date,
    records: req.body.records,
    mentorId,
    userId: req.user!.id,
    ip: req.ip,
  });
  res.json({ success: true, message: 'Attendance saved.', data: result });
});

export const getStudentAttendance = asyncHandler(async (req: Request, res: Response) => {
  const { month } = req.query as { month?: string };
  res.json({ success: true, data: await attendanceService.attendanceHistoryForStudent(req.params.studentId, month) });
});

// ---------------- Assignments ----------------
export const listAssignments = asyncHandler(async (req: Request, res: Response) => {
  const mentorId = requireMentorId(req);
  const assignments = await prisma.assignment.findMany({
    where: { mentorId },
    orderBy: { createdAt: 'desc' },
    include: {
      batch: { select: { id: true, name: true, code: true } },
      course: { select: { id: true, title: true } },
      _count: { select: { submissions: true } },
    },
  });
  res.json({ success: true, data: assignments });
});

export const createAssignment = asyncHandler(async (req: Request, res: Response) => {
  const mentorId = requireMentorId(req);
  await assertBatchAssigned(mentorId, req.body.batchId);
  const assignment = await assignmentService.createAssignment(req.body, mentorId);
  res.status(201).json({ success: true, message: 'Assignment published.', data: assignment });
});

export const getAssignment = asyncHandler(async (req: Request, res: Response) => {
  const mentorId = requireMentorId(req);
  const assignment = await prisma.assignment.findFirst({
    where: { id: req.params.id, mentorId },
  });
  if (!assignment) throw ApiError.notFound('Assignment not found.');
  res.json({ success: true, data: await assignmentService.getAssignment(req.params.id) });
});

export const updateAssignment = asyncHandler(async (req: Request, res: Response) => {
  const mentorId = requireMentorId(req);
  const existing = await prisma.assignment.findFirst({ where: { id: req.params.id, mentorId } });
  if (!existing) throw ApiError.notFound('Assignment not found.');
  res.json({ success: true, message: 'Assignment updated.', data: await assignmentService.updateAssignment(req.params.id, req.body) });
});

export const deleteAssignment = asyncHandler(async (req: Request, res: Response) => {
  const mentorId = requireMentorId(req);
  const existing = await prisma.assignment.findFirst({ where: { id: req.params.id, mentorId } });
  if (!existing) throw ApiError.notFound('Assignment not found.');
  res.json({ success: true, message: 'Assignment deleted.', data: await assignmentService.deleteAssignment(req.params.id) });
});

export const uploadAssignmentAttachment = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) throw ApiError.badRequest('No file provided.');
  const file = await storeUpload(req.file, 'assignment-files');
  res.json({ success: true, data: file });
});

export const gradeSubmission = asyncHandler(async (req: Request, res: Response) => {
  const mentorId = requireMentorId(req);
  const submission = await prisma.assignmentSubmission.findUnique({
    where: { id: req.params.submissionId },
    include: { assignment: { select: { mentorId: true } } },
  });
  if (!submission) throw ApiError.notFound('Submission not found.');
  if (submission.assignment.mentorId !== mentorId) {
    throw ApiError.forbidden('This submission is not in one of your assignments.');
  }
  const graded = await assignmentService.gradeSubmission(req.params.submissionId, req.body, mentorId);
  res.json({ success: true, message: 'Submission graded.', data: graded });
});

// ---------------- Reports ----------------
export const getReports = asyncHandler(async (req: Request, res: Response) => {
  const mentorId = requireMentorId(req);
  const batches = await prisma.batch.findMany({
    where: { mentorId },
    select: {
      id: true,
      name: true,
      code: true,
      course: { select: { id: true, title: true, color: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
  const batchIds = batches.map((b) => b.id);
  const students = await prisma.student.findMany({
    where: { batchId: { in: batchIds } },
    include: {
      user: {
        select: { firstName: true, lastName: true, email: true, phone: true, profileImage: true },
      },
      batch: true,
      attendance: { select: { status: true } },
      submissions: { select: { marks: true } },
    },
    orderBy: { admissionNumber: 'asc' },
  });

  const reports = await Promise.all(
    students.map(async (s) => {
      const present = s.attendance.filter((a) => a.status === 'PRESENT' || a.status === 'LATE').length;
      const attendancePercent =
        s.attendance.length === 0 ? 0 : Math.round((present / s.attendance.length) * 100);
      const graded = s.submissions.filter((sub) => sub.marks != null);
      const averageMarks =
        graded.length === 0
          ? 0
          : Math.round(graded.reduce((acc, sub) => acc + (sub.marks ?? 0), 0) / graded.length);

      let courseProgress = 0;
      if (s.batch?.courseId) {
        const totalLessons = await prisma.lesson.count({
          where: { module: { courseId: s.batch.courseId } },
        });
        const completed = await prisma.lessonProgress.count({
          where: {
            studentId: s.id,
            completed: true,
            lesson: { module: { courseId: s.batch.courseId } },
          },
        });
        courseProgress = totalLessons === 0 ? 0 : Math.round((completed / totalLessons) * 100);
      }

      return {
        id: s.id,
        admissionNumber: s.admissionNumber,
        gender: s.gender,
        user: s.user,
        batch: s.batch ? { id: s.batch.id, name: s.batch.name, code: s.batch.code } : null,
        course: batches.find((b) => b.id === s.batch?.id)?.course ?? null,
        stats: {
          attendancePercent,
          attendanceRecords: s.attendance.length,
          assignmentsSubmitted: s.submissions.length,
          averageMarks,
          courseProgress,
        },
      };
    })
  );

  res.json({
    success: true,
    data: {
      batches,
      totalStudents: students.length,
      students: reports,
    },
  });
});

// ---------------- Students ----------------
export const getStudent = asyncHandler(async (req: Request, res: Response) => {
  const mentorId = requireMentorId(req);
  const student = await prisma.student.findUnique({
    where: { id: req.params.id },
    include: { batch: { select: { id: true, mentorId: true } } },
  });
  if (!student) throw ApiError.notFound('Student not found.');
  if (student.batch?.mentorId !== mentorId) {
    throw ApiError.forbidden('This student is not in one of your batches.');
  }
  res.json({ success: true, data: await studentService.getStudent(req.params.id) });
});

// ---------------- Announcements ----------------
export const listAnnouncements = asyncHandler(async (req: Request, res: Response) => {
  const result = await announcementService.announcementList(
    req.query as Record<string, unknown>,
    'MENTOR',
    req.user!.id
  );
  res.json({ success: true, data: result.data, meta: result.meta });
});

export const createAnnouncement = asyncHandler(async (req: Request, res: Response) => {
  const announcement = await announcementService.createAnnouncement(req.body, req.user!.id);
  res.status(201).json({ success: true, message: 'Notice created.', data: announcement });
});

export const updateAnnouncement = asyncHandler(async (req: Request, res: Response) => {
  const existing = await prisma.announcement.findFirst({
    where: { id: req.params.id, authorId: req.user!.id },
  });
  if (!existing) throw ApiError.notFound('Announcement not found.');
  res.json({ success: true, message: 'Notice updated.', data: await announcementService.updateAnnouncement(req.params.id, req.body) });
});

export const deleteAnnouncement = asyncHandler(async (req: Request, res: Response) => {
  const existing = await prisma.announcement.findFirst({
    where: { id: req.params.id, authorId: req.user!.id },
  });
  if (!existing) throw ApiError.notFound('Announcement not found.');
  res.json({ success: true, message: 'Notice deleted.', data: await announcementService.deleteAnnouncement(req.params.id) });
});

// ---------------- Messaging ----------------
export const listMessages = asyncHandler(async (req: Request, res: Response) => {
  const mentorId = requireMentorId(req);
  await assertBatchAssigned(mentorId, req.params.batchId);
  const messages = await prisma.message.findMany({
    where: {
      batchId: req.params.batchId,
      OR: [
        { recipientId: null },
        { recipientId: req.user!.id },
        { senderId: req.user!.id },
      ],
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: {
      sender: { select: { id: true, firstName: true, lastName: true, role: true, profileImage: true } },
    },
  });
  res.json({ success: true, data: messages.reverse() });
});

export const sendMessage = asyncHandler(async (req: Request, res: Response) => {
  const mentorId = requireMentorId(req);
  const batch = await assertBatchAssigned(mentorId, req.params.batchId);
  if (!req.body.content?.trim()) throw ApiError.badRequest('Message content is required.');

  const message = await prisma.message.create({
    data: {
      batchId: req.params.batchId,
      senderId: req.user!.id,
      content: req.body.content.trim(),
      recipientId: req.body.recipientId || null,
    },
  });

  const where = req.body.recipientId
    ? { userId: req.body.recipientId }
    : { batchId: req.params.batchId };

  const students = await prisma.student.findMany({
    where,
    select: { userId: true },
  });
  await Promise.all(
    students.map((s) =>
      createNotification({
        userId: s.userId,
        title: `New message from ${batch.name}`,
        body: req.body.content.trim().slice(0, 120),
        type: 'MESSAGE',
        link: '/messages',
      })
    )
  );

  res.status(201).json({ success: true, data: message });
});
