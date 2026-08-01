import { prisma } from '../config/prisma';
import { startOfDay, endOfDay } from '../utils/pagination';

export const attendanceReport = async (query: {
  batchId?: string;
  from?: string;
  to?: string;
}) => {
  const where: Record<string, unknown> = {};
  if (query.batchId) where.batchId = query.batchId;
  if (query.from || query.to) {
    where.date = {
      ...(query.from ? { gte: startOfDay(new Date(query.from)) } : {}),
      ...(query.to ? { lte: endOfDay(new Date(query.to)) } : {}),
    };
  }

  const records = await prisma.attendance.findMany({
    where,
    include: {
      student: { include: { user: { select: { firstName: true, lastName: true } } } },
      batch: { select: { name: true, code: true } },
    },
    orderBy: { date: 'desc' },
  });

  const summary = records.reduce<Record<string, number>>((acc, r) => {
    acc[r.status] = (acc[r.status] ?? 0) + 1;
    return acc;
  }, {});

  return {
    title: 'Attendance Report',
    generatedAt: new Date(),
    filters: query,
    summary,
    total: records.length,
    rows: records.map((r) => ({
      date: r.date,
      student: `${r.student.user.firstName} ${r.student.user.lastName}`,
      batch: `${r.batch.name} (${r.batch.code})`,
      status: r.status,
      remarks: r.remarks ?? '',
    })),
  };
};

export const studentPerformanceReport = async (batchId?: string) => {
  const students = await prisma.student.findMany({
    where: batchId ? { batchId } : {},
    include: {
      user: { select: { firstName: true, lastName: true, email: true } },
      batch: { select: { name: true, code: true } },
      submissions: {
        include: { assignment: { select: { title: true, maxMarks: true } } },
      },
      attendance: true,
    },
    orderBy: { admissionNumber: 'asc' },
  });

  const rows = students.map((s) => {
    const graded = s.submissions.filter((sub) => sub.marks != null);
    const avg = graded.length
      ? Math.round(graded.reduce((a, sub) => a + (sub.marks ?? 0), 0) / graded.length)
      : 0;
    const present = s.attendance.filter((a) => a.status === 'PRESENT' || a.status === 'LATE').length;
    const attendancePercent = s.attendance.length
      ? Math.round((present / s.attendance.length) * 100)
      : 0;

    return {
      student: `${s.user.firstName} ${s.user.lastName}`,
      email: s.user.email,
      admissionNumber: s.admissionNumber,
      batch: `${s.batch?.name ?? '-'} (${s.batch?.code ?? '-'})`,
      averageMarks: avg,
      assignmentsSubmitted: s.submissions.length,
      attendancePercent,
      totalAttendance: s.attendance.length,
    };
  });

  return {
    title: 'Student Performance Report',
    generatedAt: new Date(),
    filter: { batchId: batchId ?? null },
    count: rows.length,
    rows,
  };
};

export const assignmentReport = async (batchId?: string) => {
  const assignments = await prisma.assignment.findMany({
    where: batchId ? { batchId } : {},
    include: {
      batch: { select: { name: true, code: true } },
      submissions: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  const rows = assignments.map((a) => {
    const graded = a.submissions.filter((s) => s.marks != null);
    return {
      title: a.title,
      batch: `${a.batch.name} (${a.batch.code})`,
      maxMarks: a.maxMarks,
      dueDate: a.dueDate,
      submissions: a.submissions.length,
      graded: graded.length,
      submissionRate: a.submissions.length ? 100 : 0,
      averageMarks: graded.length
        ? Math.round(graded.reduce((acc, s) => acc + (s.marks ?? 0), 0) / graded.length)
        : 0,
    };
  });

  return {
    title: 'Assignment Report',
    generatedAt: new Date(),
    count: rows.length,
    rows,
  };
};

export const batchReport = async () => {
  const batches = await prisma.batch.findMany({
    include: {
      course: { select: { title: true, code: true } },
      mentor: { include: { user: { select: { firstName: true, lastName: true } } } },
      _count: { select: { students: true, assignments: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  const rows = await Promise.all(
    batches.map(async (b) => {
      const [attendance, submissions] = await Promise.all([
        prisma.attendance.groupBy({
          by: ['status'],
          where: { batchId: b.id },
          _count: { _all: true },
        }),
        prisma.assignmentSubmission.findMany({
          where: { assignment: { batchId: b.id }, marks: { not: null } },
          select: { marks: true },
        }),
      ]);
      const totalAttendance = attendance.reduce((acc, a) => acc + a._count._all, 0);
      const present = attendance
        .filter((a) => a.status === 'PRESENT' || a.status === 'LATE')
        .reduce((acc, a) => acc + a._count._all, 0);

      return {
        name: b.name,
        code: b.code,
        course: `${b.course.title} (${b.course.code})`,
        mentor: b.mentor ? `${b.mentor.user.firstName} ${b.mentor.user.lastName}` : '-',
        status: b.status,
        capacity: b.capacity,
        students: b._count.students,
        assignments: b._count.assignments,
        attendancePercent: totalAttendance ? Math.round((present / totalAttendance) * 100) : 0,
        averageMarks: submissions.length
          ? Math.round(submissions.reduce((acc, s) => acc + (s.marks ?? 0), 0) / submissions.length)
          : 0,
      };
    })
  );

  return { title: 'Batch Report', generatedAt: new Date(), count: rows.length, rows };
};

export const mentorReport = async () => {
  const mentors = await prisma.mentor.findMany({
    include: {
      user: { select: { firstName: true, lastName: true, email: true } },
      batches: { select: { id: true, name: true, code: true } },
    },
  });

  const rows = await Promise.all(
    mentors.map(async (m) => {
      const batchIds = m.batches.map((b) => b.id);
      const [students, assignments, graded, attendance] = await Promise.all([
        prisma.student.count({ where: { batchId: { in: batchIds } } }),
        prisma.assignment.count({ where: { mentorId: m.id } }),
        prisma.assignmentSubmission.count({ where: { gradedByMentorId: m.id } }),
        prisma.attendance.count({ where: { mentorId: m.id } }),
      ]);
      return {
        name: `${m.user.firstName} ${m.user.lastName}`,
        email: m.user.email,
        department: m.department ?? '-',
        batches: m.batches.map((b) => b.name).join(', '),
        students,
        assignmentsCreated: assignments,
        submissionsGraded: graded,
        attendanceMarked: attendance,
      };
    })
  );

  return { title: 'Mentor Report', generatedAt: new Date(), count: rows.length, rows };
};
