import { Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';
import { ApiError } from '../utils/ApiError';
import { getPagination, buildSearchFilter } from '../utils/pagination';

export const batchList = async (query: Record<string, unknown>) => {
  const { page, limit, skip, sortOrder } = getPagination(query);
  const search = (query.search as string) ?? undefined;
  const status = (query.status as string) ?? undefined;
  const mentorId = (query.mentorId as string) ?? undefined;
  const courseId = (query.courseId as string) ?? undefined;

  const orFilter = buildSearchFilter(search, ['name', 'code', 'description']);

  const where: Prisma.BatchWhereInput = {
    status: status ?? undefined,
    mentorId: mentorId ?? undefined,
    courseId: courseId ?? undefined,
    ...(orFilter ? { OR: orFilter } : {}),
  };

  const [total, batches] = await Promise.all([
    prisma.batch.count({ where }),
    prisma.batch.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: sortOrder },
      include: {
        course: { select: { id: true, title: true, code: true, color: true } },
        mentor: { select: { id: true, user: { select: { firstName: true, lastName: true, email: true } } } },
        _count: { select: { students: true, assignments: true } },
      },
    }),
  ]);

  return { data: batches, meta: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 } };
};

const generateBatchCode = async (course: { code: string }) => {
  const prefix = (course.code || 'BATCH').replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 6);
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
    const code = `${prefix}-${suffix}`;
    const existing = await prisma.batch.findUnique({ where: { code } });
    if (!existing) return code;
  }
  return `${prefix}-${Date.now().toString(36).toUpperCase()}`;
};

export const createBatch = async (input: Record<string, unknown>) => {
  const course = await prisma.course.findUnique({ where: { id: input.courseId as string } });
  if (!course) throw ApiError.notFound('Course not found.');

  let code = (input.code as string)?.trim();
  if (code) {
    const existing = await prisma.batch.findUnique({ where: { code } });
    if (existing) throw ApiError.conflict('A batch with this code already exists.');
  } else {
    code = await generateBatchCode(course);
  }

  if (input.mentorId) {
    const mentor = await prisma.mentor.findUnique({ where: { id: input.mentorId as string } });
    if (!mentor) throw ApiError.notFound('Mentor not found.');
  }

  return prisma.batch.create({
    data: {
      name: input.name as string,
      code,
      courseId: input.courseId as string,
      mentorId: (input.mentorId as string) ?? null,
      startDate: input.startDate ? new Date(input.startDate as string) : undefined,
      endDate: input.endDate ? new Date(input.endDate as string) : undefined,
      capacity: (input.capacity as number) ?? 30,
      status: (input.status as string) ?? 'ACTIVE',
      description: (input.description as string) ?? undefined,
      classDays: Array.isArray(input.classDays)
        ? [...new Set((input.classDays as unknown[]).map(Number))].sort()
        : [],
      classTime: (input.classTime as string) || undefined,
    },
    include: { course: true, mentor: { include: { user: true } } },
  });
};

export const getBatch = async (batchId: string) => {
  const batch = await prisma.batch.findUnique({
    where: { id: batchId },
    include: {
      course: { include: { modules: { include: { lessons: true }, orderBy: { order: 'asc' } } } },
      mentor: { include: { user: true } },
      students: { include: { user: true } },
    },
  });
  if (!batch) throw ApiError.notFound('Batch not found.');

  const attendance = await prisma.attendance.findMany({
    where: { batchId },
    select: { status: true },
  });

  const summary = attendance.reduce<Record<string, number>>((acc, a) => {
    acc[a.status] = (acc[a.status] ?? 0) + 1;
    return acc;
  }, {});

  const submissions = await prisma.assignmentSubmission.findMany({
    where: { assignment: { batchId } },
    select: { marks: true },
  });

  const graded = submissions.filter((s) => s.marks != null);

  return {
    ...batch,
    analytics: {
      totalStudents: batch.students.length,
      capacity: batch.capacity,
      occupancyPercent:
        batch.capacity === 0 ? 0 : Math.round((batch.students.length / batch.capacity) * 100),
      attendance: summary,
      attendancePercent: attendance.length
        ? Math.round(
            ((summary['PRESENT'] ?? 0) + (summary['LATE'] ?? 0)) / attendance.length * 100
          )
        : 0,
      averageMarks: graded.length
        ? Math.round(graded.reduce((a, s) => a + (s.marks ?? 0), 0) / graded.length)
        : 0,
    },
  };
};

export const updateBatch = async (batchId: string, input: Record<string, unknown>) => {
  const batch = await prisma.batch.findUnique({ where: { id: batchId } });
  if (!batch) throw ApiError.notFound('Batch not found.');

  if (input.courseId) {
    const course = await prisma.course.findUnique({ where: { id: input.courseId as string } });
    if (!course) throw ApiError.notFound('Course not found.');
  }

  return prisma.batch.update({
    where: { id: batchId },
    data: {
      name: input.name as string | undefined,
      code: input.code as string | undefined,
      courseId: input.courseId as string | undefined,
      mentorId:
        input.mentorId !== undefined
          ? ((input.mentorId as string) ?? null)
          : undefined,
      startDate: input.startDate ? new Date(input.startDate as string) : undefined,
      endDate: input.endDate ? new Date(input.endDate as string) : undefined,
      capacity: input.capacity as number | undefined,
      status: input.status as string | undefined,
      description: input.description as string | undefined,
      classDays: Array.isArray(input.classDays)
        ? [...new Set((input.classDays as unknown[]).map(Number))].sort()
        : undefined,
      classTime: input.classTime !== undefined ? ((input.classTime as string) || null) : undefined,
    },
    include: { course: true, mentor: { include: { user: true } } },
  });
};

export const deleteBatch = async (batchId: string) => {
  const batch = await prisma.batch.findUnique({ where: { id: batchId } });
  if (!batch) throw ApiError.notFound('Batch not found.');

  await prisma.student.updateMany({
    where: { batchId },
    data: { batchId: null },
  });
  await prisma.courseEnrollment.deleteMany({ where: { batchId } });

  return prisma.batch.delete({ where: { id: batchId } });
};

export const assignStudentsToBatch = async (batchId: string, studentIds: string[]) => {
  const batch = await prisma.batch.findUnique({
    where: { id: batchId },
    include: { _count: { select: { students: true } } },
  });
  if (!batch) throw ApiError.notFound('Batch not found.');

  if (batch._count.students + studentIds.length > batch.capacity) {
    throw ApiError.badRequest('This batch has reached its capacity.');
  }

  await prisma.student.updateMany({
    where: { id: { in: studentIds } },
    data: { batchId },
  });

  for (const studentId of studentIds) {
    const existing = await prisma.courseEnrollment.findFirst({
      where: { studentId, courseId: batch.courseId },
    });
    if (!existing) {
      await prisma.courseEnrollment.create({
        data: { studentId, courseId: batch.courseId, batchId },
      });
    }
  }

  return getBatch(batchId);
};

export const removeStudentFromBatch = async (batchId: string, studentId: string) => {
  const batch = await prisma.batch.findUnique({ where: { id: batchId } });
  if (!batch) throw ApiError.notFound('Batch not found.');

  await prisma.student.update({
    where: { id: studentId },
    data: { batchId: null },
  });

  return getBatch(batchId);
};

export const getBatchAnalytics = async (batchId: string) => {
  const batch = await prisma.batch.findUnique({ where: { id: batchId } });
  if (!batch) throw ApiError.notFound('Batch not found.');

  const [students, assignments, attendance] = await Promise.all([
    prisma.student.count({ where: { batchId } }),
    prisma.assignment.count({ where: { batchId } }),
    prisma.attendance.groupBy({
      by: ['status'],
      where: { batchId },
      _count: { _all: true },
    }),
  ]);

  return { batchId, students, assignments, attendance };
};
