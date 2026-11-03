import { prisma } from '../config/prisma';
import { ApiError } from '../utils/ApiError';
import { startOfDay, endOfDay, getPagination } from '../utils/pagination';
import { createNotification } from './notification.service';
import { logActivity } from './activity.service';
import { ACTIVITY_TYPE } from '../constants/enums';

interface AttendanceRecord {
  studentId: string;
  status: string;
  remarks?: string;
}

export const markAttendance = async (input: {
  batchId: string;
  date: string;
  records: AttendanceRecord[];
  mentorId: string;
  userId: string;
  ip?: string;
}) => {
  const batch = await prisma.batch.findUnique({ where: { id: input.batchId } });
  if (!batch) throw ApiError.notFound('Batch not found.');

  const date = new Date(input.date);
  const dayStart = startOfDay(date);
  const dayEnd = endOfDay(date);

  // Verify all students belong to the batch.
  const studentIds = input.records.map((r) => r.studentId);
  const students = await prisma.student.findMany({
    where: { id: { in: studentIds }, batchId: input.batchId },
    select: { id: true, userId: true },
  });
  if (students.length !== studentIds.length) {
    throw ApiError.badRequest('One or more students do not belong to this batch.');
  }

  const created: typeof input.records = [];
  const updated: typeof input.records = [];

  for (const record of input.records) {
    const existing = await prisma.attendance.findFirst({
      where: {
        batchId: input.batchId,
        studentId: record.studentId,
        date: { gte: dayStart, lte: dayEnd },
      },
    });

    if (existing) {
      await prisma.attendance.update({
        where: { id: existing.id },
        data: { status: record.status, remarks: record.remarks },
      });
      updated.push(record);
    } else {
      await prisma.attendance.create({
        data: {
          batchId: input.batchId,
          studentId: record.studentId,
          mentorId: input.mentorId,
          date: dayStart,
          status: record.status,
          remarks: record.remarks,
          markedById: input.userId,
        },
      });
      created.push(record);
    }
  }

  // Notify absent/late students.
  const alerted = students.filter((s) =>
    input.records.some(
      (r) => r.studentId === s.id && (r.status === 'ABSENT' || r.status === 'LATE')
    )
  );
  await Promise.all(
    alerted.map((s) =>
      createNotification({
        userId: s.userId,
        title: 'Attendance alert',
        body: `Your attendance was marked as ${input.records.find((r) => r.studentId === s.id)?.status} on ${dayStart.toLocaleDateString()}.`,
        type: 'ATTENDANCE_ALERT',
        link: '/attendance',
      })
    )
  );

  await logActivity({
    userId: input.userId,
    type: ACTIVITY_TYPE.MARK_ATTENDANCE,
    action: `Marked attendance for ${created.length} created / ${updated.length} updated in batch ${batch.code}`,
    ip: input.ip,
  });

  return { created: created.length, updated: updated.length, batch: batch.code };
};

export const attendanceForBatchDate = async (batchId: string, date?: string) => {
  const batch = await prisma.batch.findUnique({ where: { id: batchId } });
  if (!batch) throw ApiError.notFound('Batch not found.');

  const target = date ? new Date(date) : new Date();
  const dayStart = startOfDay(target);
  const dayEnd = endOfDay(target);

  const students = await prisma.student.findMany({
    where: { batchId },
    include: {
      user: { select: { firstName: true, lastName: true, email: true, profileImage: true } },
    },
    orderBy: { admissionNumber: 'asc' },
  });

  const records = await prisma.attendance.findMany({
    where: { batchId, date: { gte: dayStart, lte: dayEnd } },
  });

  const recordsByStudent = new Map(records.map((r) => [r.studentId, r]));

  return {
    batch: { id: batch.id, name: batch.name, code: batch.code },
    date: dayStart,
    marked: records.length > 0,
    students: students.map((s) => ({
      id: s.id,
      admissionNumber: s.admissionNumber,
      name: `${s.user.firstName} ${s.user.lastName}`,
      email: s.user.email,
      profileImage: s.user.profileImage,
      attendance: recordsByStudent.get(s.id) ?? null,
    })),
  };
};

export const attendanceHistoryForStudent = async (studentId: string, month?: string) => {
  const student = await prisma.student.findUnique({ where: { id: studentId } });
  if (!student) throw ApiError.notFound('Student not found.');

  const where = { studentId };

  if (month) {
    const [y, m] = month.split('-').map(Number);
    const from = new Date(y, m - 1, 1);
    const to = new Date(y, m, 0, 23, 59, 59, 999);
    (where as Record<string, unknown>).date = { gte: from, lte: to };
  }

  const records = await prisma.attendance.findMany({
    where,
    orderBy: { date: 'desc' },
    include: { batch: { select: { id: true, name: true } } },
  });

  const summary = records.reduce<Record<string, number>>((acc, r) => {
    acc[r.status] = (acc[r.status] ?? 0) + 1;
    return acc;
  }, {});

  const present = (summary['PRESENT'] ?? 0) + (summary['LATE'] ?? 0);
  const percent = records.length === 0 ? 0 : Math.round((present / records.length) * 100);

  return { studentId, records, summary, total: records.length, attendancePercent: percent };
};

export const attendanceForBatch = async (
  batchId: string,
  query: { page?: number; limit?: number; from?: string; to?: string }
) => {
  const { page, limit, skip } = getPagination(query);

  const where: Record<string, unknown> = { batchId };
  if (query.from || query.to) {
    where.date = {
      ...(query.from ? { gte: startOfDay(new Date(query.from)) } : {}),
      ...(query.to ? { lte: endOfDay(new Date(query.to)) } : {}),
    };
  }

  const [total, records] = await Promise.all([
    prisma.attendance.count({ where }),
    prisma.attendance.findMany({
      where,
      skip,
      take: limit,
      orderBy: { date: 'desc' },
      include: {
        student: {
          include: {
            user: { select: { firstName: true, lastName: true } },
          },
        },
      },
    }),
  ]);

  return { data: records, meta: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 } };
};

export const todayAttendanceSummary = async () => {
  const todayStart = startOfDay(new Date());
  const todayEnd = endOfDay(new Date());

  const [marked, total] = await Promise.all([
    prisma.attendance.count({ where: { date: { gte: todayStart, lte: todayEnd } } }),
    prisma.student.count({ where: { batchId: { not: null } } }),
  ]);

  return { marked, total, percent: total === 0 ? 0 : Math.round((marked / total) * 100) };
};
