import { Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';
import { ApiError } from '../utils/ApiError';
import { hashPassword } from '../utils/password';
import { getPagination, buildSearchFilter } from '../utils/pagination';
import { emailTemplates, sendEmail } from './email.service';
import { createNotification } from './notification.service';
import { logActivity } from './activity.service';
import { ACTIVITY_TYPE } from '../constants/enums';
import type { Request } from 'express';

interface CreateStudentInput {
  fullName: string;
  email: string;
  password?: string;
  phone?: string;
  address?: string;
  gender?: string;
  dateOfBirth?: string;
  parentName?: string;
  parentPhone?: string;
  emergencyContact?: string;
  batchId?: string;
}

/** Splits "First Middle Last" into { firstName, lastName } (lastName may be ''). */
const splitFullName = (fullName: string): { firstName: string; lastName: string } => {
  const parts = fullName.trim().split(/\s+/);
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
};

export const studentList = async (query: Record<string, unknown>) => {
  const { page, limit, skip, sortOrder } = getPagination(query);
  const search = (query.search as string) ?? undefined;
  const batchId = (query.batchId as string) ?? undefined;
  const status = (query.status as string) ?? undefined;
  const gender = (query.gender as string) ?? undefined;

  const orFilter = buildSearchFilter(search, [
    'user.firstName',
    'user.lastName',
    'user.email',
    'admissionNumber',
  ]);

  const where: Prisma.StudentWhereInput = {
    batchId: batchId ?? undefined,
    gender: gender ?? undefined,
    user: {
      status: status ?? undefined,
      ...(orFilter ? { OR: orFilter } : {}),
    },
  };

  const [total, students] = await Promise.all([
    prisma.student.count({ where }),
    prisma.student.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: sortOrder },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            address: true,
            profileImage: true,
            status: true,
            createdAt: true,
          },
        },
        batch: { select: { id: true, name: true, code: true } },
        attendance: { select: { status: true, date: true } },
      },
    }),
  ]);

  return {
    data: students.map((s) => ({
      ...s,
      attendanceCount: s.attendance.length,
      attendanceSummary: s.attendance.reduce<Record<string, number>>((acc, a) => {
        acc[a.status] = (acc[a.status] ?? 0) + 1;
        return acc;
      }, {}),
    })),
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
  };
};

export const generateAdmissionNumber = async (): Promise<string> => {
  const year = new Date().getFullYear();
  const count = await prisma.student.count();
  return `EDF-${year}-${String(count + 1).padStart(4, '0')}`;
};

export const createStudent = async (input: CreateStudentInput) => {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) throw ApiError.conflict('A user with this email already exists.');

  if (input.batchId) {
    const batch = await prisma.batch.findUnique({ where: { id: input.batchId } });
    if (!batch) throw ApiError.notFound('Batch not found.');
  }

  const password = input.password || input.phone;
  if (!password) {
    throw ApiError.badRequest('Phone number is required — it is used as the initial password.');
  }
  const admissionNumber = await generateAdmissionNumber();
  const { firstName, lastName } = splitFullName(input.fullName);

  const user = await prisma.user.create({
    data: {
      email: input.email,
      passwordHash: await hashPassword(password),
      firstName,
      lastName,
      phone: input.phone,
      address: input.address,
      role: 'STUDENT',
      status: 'ACTIVE',
      student: {
        create: {
          admissionNumber,
          gender: input.gender,
          dateOfBirth: input.dateOfBirth ? new Date(input.dateOfBirth) : undefined,
          parentName: input.parentName,
          parentPhone: input.parentPhone,
          emergencyContact: input.emergencyContact,
          batchId: input.batchId,
        },
      },
    },
  });

  if (input.batchId) {
    const student = await prisma.student.findUniqueOrThrow({ where: { userId: user.id } });
    const batch = await prisma.batch.findUniqueOrThrow({ where: { id: input.batchId } });
    await prisma.courseEnrollment.create({
      data: { studentId: student.id, courseId: batch.courseId, batchId: batch.id },
    });
  }

  await sendEmail({
    to: user.email,
    subject: 'Welcome to EduFlow!',
    html: emailTemplates.welcome(
      `${user.firstName} ${user.lastName}`,
      user.email,
      password,
      'Student'
    ),
  });

  return prisma.student.findUnique({
    where: { userId: user.id },
    include: { user: true, batch: true },
  });
};

export const getStudent = async (studentId: string) => {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: {
      user: true,
      batch: { include: { course: true } },
      attendance: {
        orderBy: { date: 'desc' },
        take: 60,
        include: { batch: { select: { id: true, name: true } } },
      },
      submissions: {
        include: {
          assignment: { select: { id: true, title: true, maxMarks: true, dueDate: true } },
        },
        orderBy: { submittedAt: 'desc' },
      },
    },
  });
  if (!student) throw ApiError.notFound('Student not found.');

  const totalLessons = await prisma.lesson.count();
  const completedLessons = await prisma.lessonProgress.count({
    where: { studentId, completed: true },
  });

  const present = student.attendance.filter((a) => a.status === 'PRESENT').length;
  const late = student.attendance.filter((a) => a.status === 'LATE').length;
  const attendancePercent =
    student.attendance.length === 0
      ? 0
      : Math.round(((present + late) / student.attendance.length) * 100);

  return {
    ...student,
    stats: {
      attendancePercent,
      attendanceRecords: student.attendance.length,
      assignmentsSubmitted: student.submissions.length,
      averageMarks: student.submissions.some((s) => s.marks != null)
        ? Math.round(
            student.submissions
              .filter((s) => s.marks != null)
              .reduce((a, s) => a + (s.marks ?? 0), 0) /
              student.submissions.filter((s) => s.marks != null).length
          )
        : 0,
      courseProgress: totalLessons === 0 ? 0 : Math.round((completedLessons / totalLessons) * 100),
    },
  };
};

export const updateStudent = async (studentId: string, input: Record<string, unknown>) => {
  const student = await prisma.student.findUnique({ where: { id: studentId } });
  if (!student) throw ApiError.notFound('Student not found.');

  const nameData: { firstName?: string; lastName?: string } =
    input.fullName !== undefined ? splitFullName(input.fullName as string) : {};

  const userData = {
    firstName: nameData.firstName,
    lastName: nameData.lastName,
    phone: input.phone as string | undefined,
    address: input.address as string | undefined,
  };

  const studentData = {
    parentName: input.parentName as string | undefined,
    parentPhone: input.parentPhone as string | undefined,
    emergencyContact: input.emergencyContact as string | undefined,
    gender: input.gender as string | undefined,
    dateOfBirth: input.dateOfBirth ? new Date(input.dateOfBirth as string) : undefined,
  };

  await prisma.user.update({
    where: { id: student.userId },
    data: userData,
  });

  return prisma.student.update({
    where: { id: studentId },
    data: studentData,
    include: { user: true, batch: true },
  });
};

export const updateStudentStatus = async (studentId: string, status: string) => {
  const student = await prisma.student.findUnique({ where: { id: studentId } });
  if (!student) throw ApiError.notFound('Student not found.');

  const user = await prisma.user.update({
    where: { id: student.userId },
    data: { status },
  });

  await createNotification({
    userId: user.id,
    title: status === 'SUSPENDED' ? 'Account suspended' : 'Account active',
    body:
      status === 'SUSPENDED'
        ? 'Your account has been suspended. Contact your administrator.'
        : 'Your account has been reactivated.',
    type: 'SYSTEM',
    link: '/',
  });

  return { id: student.id, status: user.status };
};

export const assignStudentBatch = async (studentId: string, batchId: string | null) => {
  const student = await prisma.student.findUnique({ where: { id: studentId } });
  if (!student) throw ApiError.notFound('Student not found.');

  if (batchId) {
    const batch = await prisma.batch.findUnique({ where: { id: batchId } });
    if (!batch) throw ApiError.notFound('Batch not found.');
  }

  // Move existing enrollments to the new batch course when assigned to a batch.
  if (batchId) {
    const batch = await prisma.batch.findUniqueOrThrow({ where: { id: batchId } });
    const existing = await prisma.courseEnrollment.findFirst({
      where: { studentId },
    });
    if (existing) {
      await prisma.courseEnrollment.update({
        where: { id: existing.id },
        data: { courseId: batch.courseId, batchId: batch.id },
      });
    } else {
      await prisma.courseEnrollment.create({
        data: { studentId, courseId: batch.courseId, batchId: batch.id },
      });
    }
  }

  return prisma.student.update({
    where: { id: studentId },
    data: { batchId },
    include: { user: true, batch: true },
  });
};

export const resetStudentPassword = async (studentId: string, newPassword: string) => {
  const student = await prisma.student.findUnique({ where: { id: studentId } });
  if (!student) throw ApiError.notFound('Student not found.');

  const user = await prisma.user.update({
    where: { id: student.userId },
    data: { passwordHash: await hashPassword(newPassword), refreshToken: null },
  });

  await createNotification({
    userId: user.id,
    title: 'Password reset',
    body: 'Your password was reset by the administrator.',
    type: 'SYSTEM',
    link: '/login',
  });

  return { id: student.id, email: user.email, message: 'Password reset successfully.' };
};

export const updateStudentProfileImage = async (studentId: string, imageUrl: string) => {
  const student = await prisma.student.findUnique({ where: { id: studentId } });
  if (!student) throw ApiError.notFound('Student not found.');
  return prisma.user.update({
    where: { id: student.userId },
    data: { profileImage: imageUrl },
  });
};

export const deleteStudent = async (studentId: string, req?: Request) => {
  const student = await prisma.student.findUnique({ where: { id: studentId } });
  if (!student) throw ApiError.notFound('Student not found.');
  const userId = student.userId;

  await prisma.lessonProgress.deleteMany({ where: { studentId } });
  await prisma.assignmentSubmission.deleteMany({ where: { studentId } });
  await prisma.attendance.deleteMany({ where: { studentId } });
  await prisma.courseEnrollment.deleteMany({ where: { studentId } });
  await prisma.announcement.updateMany({
    where: { studentId: userId },
    data: { studentId: null },
  });
  await prisma.message.deleteMany({
    where: { OR: [{ senderId: userId }, { recipientId: userId }] },
  });
  await prisma.notification.deleteMany({ where: { recipientId: userId } });
  await prisma.activityLog.updateMany({ where: { userId }, data: { userId: null } });
  await prisma.passwordReset.deleteMany({ where: { userId } });

  await prisma.student.delete({ where: { id: studentId } });
  await prisma.user.delete({ where: { id: userId } });

  await logActivity({
    userId: req?.user?.id,
    type: ACTIVITY_TYPE.DELETE,
    action: `Deleted student ${student.admissionNumber}`,
  });
  return { id: studentId, message: 'Student deleted.' };
};
