import { Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';
import { ApiError } from '../utils/ApiError';
import { hashPassword } from '../utils/password';
import { getPagination, buildSearchFilter } from '../utils/pagination';
import { emailTemplates, sendEmail } from './email.service';
import { logActivity } from './activity.service';
import { ACTIVITY_TYPE } from '../constants/enums';
import type { Request } from 'express';

interface CreateMentorInput {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
  department?: string;
  qualification?: string;
  experience?: number;
  subjects?: string[];
}

export const mentorList = async (query: Record<string, unknown>) => {
  const { page, limit, skip, sortOrder } = getPagination(query);
  const search = (query.search as string) ?? undefined;
  const department = (query.department as string) ?? undefined;
  const status = (query.status as string) ?? undefined;

  const orFilter = buildSearchFilter(search, [
    'user.firstName',
    'user.lastName',
    'user.email',
    'department',
  ]);

  const where: Prisma.MentorWhereInput = {
    department: department ?? undefined,
    user: {
      status: status ?? undefined,
      ...(orFilter ? { OR: orFilter } : {}),
    },
  };

  const [total, mentors] = await Promise.all([
    prisma.mentor.count({ where }),
    prisma.mentor.findMany({
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
            profileImage: true,
            status: true,
            createdAt: true,
          },
        },
        batches: { select: { id: true, name: true, code: true, status: true } },
      },
    }),
  ]);

  return {
    data: mentors,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
  };
};

export const createMentor = async (input: CreateMentorInput) => {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) throw ApiError.conflict('A user with this email already exists.');

  const user = await prisma.user.create({
    data: {
      email: input.email,
      passwordHash: await hashPassword(input.password),
      firstName: input.firstName,
      lastName: input.lastName,
      phone: input.phone,
      role: 'MENTOR',
      status: 'ACTIVE',
      mentor: {
        create: {
          department: input.department,
          qualification: input.qualification,
          experience: input.experience,
          subjects: input.subjects ?? [],
        },
      },
    },
  });

  await sendEmail({
    to: user.email,
    subject: 'Welcome to EduFlow!',
    html: emailTemplates.welcome(
      `${user.firstName} ${user.lastName}`,
      user.email,
      input.password,
      'Mentor'
    ),
  });

  return prisma.mentor.findUnique({
    where: { userId: user.id },
    include: { user: true, batches: true },
  });
};

export const getMentor = async (mentorId: string) => {
  const mentor = await prisma.mentor.findUnique({
    where: { id: mentorId },
    include: {
      user: true,
      batches: { include: { course: true, _count: { select: { students: true } } } },
    },
  });
  if (!mentor) throw ApiError.notFound('Mentor not found.');

  const submissions = await prisma.assignmentSubmission.aggregate({
    _avg: { marks: true },
    _count: true,
    where: { gradedByMentorId: mentorId },
  });

  const assignmentsCount = await prisma.assignment.count({ where: { mentorId } });

  return {
    ...mentor,
    stats: {
      batches: mentor.batches.length,
      students: mentor.batches.reduce((acc, b) => acc + b._count.students, 0),
      assignmentsCreated: assignmentsCount,
      gradedSubmissions: submissions._count,
      averageMarksGiven: Math.round(submissions._avg.marks ?? 0),
    },
  };
};

export const updateMentor = async (mentorId: string, input: Record<string, unknown>) => {
  const mentor = await prisma.mentor.findUnique({ where: { id: mentorId } });
  if (!mentor) throw ApiError.notFound('Mentor not found.');

  await prisma.user.update({
    where: { id: mentor.userId },
    data: {
      firstName: input.firstName as string | undefined,
      lastName: input.lastName as string | undefined,
      phone: input.phone as string | undefined,
    },
  });

  return prisma.mentor.update({
    where: { id: mentorId },
    data: {
      department: input.department as string | undefined,
      qualification: input.qualification as string | undefined,
      experience: input.experience as number | undefined,
      subjects: input.subjects as string[] | undefined,
    },
    include: { user: true, batches: true },
  });
};

export const resetMentorPassword = async (mentorId: string, newPassword: string) => {
  const mentor = await prisma.mentor.findUnique({ where: { id: mentorId } });
  if (!mentor) throw ApiError.notFound('Mentor not found.');

  await prisma.user.update({
    where: { id: mentor.userId },
    data: { passwordHash: await hashPassword(newPassword), refreshToken: null },
  });
  return { id: mentorId, message: 'Password reset successfully.' };
};

export const deleteMentor = async (mentorId: string, req?: Request) => {
  const mentor = await prisma.mentor.findUnique({
    where: { id: mentorId },
    include: { user: { select: { firstName: true, lastName: true } } },
  });
  if (!mentor) throw ApiError.notFound('Mentor not found.');

  await prisma.batch.updateMany({
    where: { mentorId },
    data: { mentorId: null },
  });

  await prisma.user.delete({ where: { id: mentor.userId } });

  await logActivity({
    userId: req?.user?.id,
    type: ACTIVITY_TYPE.DELETE,
    action: `Deleted mentor ${mentor.user.firstName} ${mentor.user.lastName}`,
  });
  return { id: mentorId, message: 'Mentor deleted.' };
};

export const mentorPerformance = async (mentorId: string) => {
  const mentor = await prisma.mentor.findUnique({
    where: { id: mentorId },
    include: {
      user: { select: { firstName: true, lastName: true } },
      batches: { include: { course: true } },
    },
  });
  if (!mentor) throw ApiError.notFound('Mentor not found.');

  const batchIds = mentor.batches.map((b) => b.id);

  const [attendanceRecords, assignments, gradedSubmissions, batchStudents] =
    await Promise.all([
      prisma.attendance.count({ where: { mentorId } }),
      prisma.assignment.count({ where: { mentorId } }),
      prisma.assignmentSubmission.count({ where: { gradedByMentorId: mentorId } }),
      prisma.student.count({ where: { batchId: { in: batchIds } } }),
    ]);

  return {
    mentor: { id: mentor.id, name: `${mentor.user.firstName} ${mentor.user.lastName}` },
    stats: {
      batches: mentor.batches.length,
      students: batchStudents,
      attendanceMarked: attendanceRecords,
      assignmentsCreated: assignments,
      submissionsGraded: gradedSubmissions,
    },
  };
};
