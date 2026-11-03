import { prisma } from '../config/prisma';
import { startOfDay, endOfDay } from '../utils/pagination';

const lastNDays = (n: number) => {
  const dates: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString().slice(0, 10));
  }
  return dates;
};

const monthRange = (offsetMonths: number) => {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth() - offsetMonths, 1);
  const to = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  return { from, to };
};

export const adminDashboard = async () => {
  const todayStart = startOfDay(new Date());
  const todayEnd = endOfDay(new Date());

  const [
    totalStudents,
    totalMentors,
    totalBatches,
    totalCourses,
    todayAttendance,
    totalSubmissions,
    gradedSubmissions,
    recentActivities,
    upcomingAnnouncements,
    upcomingAssignments,
  ] = await Promise.all([
    prisma.user.count({ where: { role: 'STUDENT', status: 'ACTIVE' } }),
    prisma.user.count({ where: { role: 'MENTOR', status: 'ACTIVE' } }),
    prisma.batch.count({ where: { status: 'ACTIVE' } }),
    prisma.course.count(),
    prisma.attendance.count({ where: { date: { gte: todayStart, lte: todayEnd } } }),
    prisma.assignmentSubmission.count({ where: { status: { not: 'PENDING' } } }),
    prisma.assignmentSubmission.count({ where: { marks: { not: null } } }),
    prisma.activityLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: { user: { select: { firstName: true, lastName: true, role: true } } },
    }),
    prisma.announcement.findMany({
      where: {
        isActive: true,
        OR: [{ publishedAt: { gte: new Date() } }, { publishedAt: null }],
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
    prisma.assignment.findMany({
      where: { dueDate: { gte: new Date() } },
      orderBy: { dueDate: 'asc' },
      take: 5,
      include: { batch: { select: { name: true, code: true } } },
    }),
  ]);

  // Assignment submission rate (past 30 days).
  const since30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const [assigned, submitted30] = await Promise.all([
    prisma.assignment.count({ where: { createdAt: { gte: since30 } } }),
    prisma.assignmentSubmission.count({ where: { submittedAt: { gte: since30 } } }),
  ]);

  // Monthly new students chart (last 6 months).
  const studentChart = await Promise.all(
    [5, 4, 3, 2, 1, 0].map(async (off) => {
      const { from, to } = monthRange(off);
      const count = await prisma.user.count({
        where: { role: 'STUDENT', createdAt: { gte: from, lte: to } },
      });
      return {
        month: from.toLocaleString('en', { month: 'short' }),
        students: count,
      };
    })
  );

  // Attendance trend chart (last 14 days).
  const attendanceTrend = await Promise.all(
    lastNDays(14).map(async (day) => {
      const next = new Date(day + 'T23:59:59');
      const count = await prisma.attendance.count({
        where: { date: { gte: new Date(day + 'T00:00:00'), lte: next } },
      });
      return { date: day.slice(5), records: count };
    })
  );

  return {
    stats: {
      totalStudents,
      totalMentors,
      totalBatches,
      totalCourses,
      todayAttendance,
      assignmentSubmissionRate:
        assigned === 0 ? 0 : Math.round((submitted30 / Math.max(assigned, 1)) * 100),
      assignmentSubmissionCount: submitted30,
      submissionGradingRate:
        totalSubmissions === 0 ? 0 : Math.round((gradedSubmissions / totalSubmissions) * 100),
    },
    charts: { studentChart, attendanceTrend },
    recentActivities,
    upcomingAnnouncements,
    upcomingAssignments,
  };
};

export const mentorDashboard = async (mentorId: string) => {
  const todayStart = startOfDay(new Date());
  const todayEnd = endOfDay(new Date());

  const [batches, todayAttendanceMarked, pendingReviews, assignments, announcements] =
    await Promise.all([
      prisma.batch.findMany({
        where: { mentorId },
        include: {
          course: { select: { id: true, title: true, color: true } },
          _count: { select: { students: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.attendance.count({
        where: { mentorId, date: { gte: todayStart, lte: todayEnd } },
      }),
      prisma.assignmentSubmission.count({
        where: {
          gradedByMentorId: null,
          status: 'SUBMITTED',
          assignment: { mentorId },
        },
      }),
      prisma.assignment.findMany({
        where: { mentorId, dueDate: { gte: new Date() } },
        orderBy: { dueDate: 'asc' },
        take: 5,
        include: {
          batch: { select: { name: true, code: true } },
          _count: { select: { submissions: true } },
        },
      }),
      prisma.announcement.findMany({
        where: { isActive: true, OR: [{ target: 'ALL' }, { authorId: undefined as never }] },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
    ]);

  const batchIds = batches.map((b) => b.id);
  const totalStudents = batches.reduce((acc, b) => acc + b._count.students, 0);

  // Course progress across assigned batches.
  const progressData = await Promise.all(
    batches.map(async (b) => {
      const totalLessons = await prisma.lesson.count({
        where: { module: { courseId: b.courseId } },
      });
      const studentIds = await prisma.student.findMany({
        where: { batchId: b.id },
        select: { id: true },
      });
      const completed = await prisma.lessonProgress.count({
        where: { studentId: { in: studentIds.map((s) => s.id) }, completed: true },
      });
      const totalProgressPoints = totalLessons * Math.max(studentIds.length, 1);
      return {
        batch: b.name,
        course: b.course.title,
        color: b.course.color,
        progressPercent:
          totalProgressPoints === 0 ? 0 : Math.round((completed / totalProgressPoints) * 100),
      };
    })
  );

  return {
    stats: {
      batches: batches.length,
      totalStudents,
      todayAttendanceMarked,
      pendingReviews,
      pendingAssignments: assignments.length,
    },
    batches,
    assignments,
    announcements,
    progressData,
  };
};

export const studentDashboard = async (studentId: string, userId: string) => {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: { batch: { include: { course: true } } },
  });
  if (!student) throw new Error('Student not found');

  const todayStart = startOfDay(new Date());
  const todayEnd = endOfDay(new Date());

  const [
    todayAttendance,
    attendanceRecords,
    upcomingAssignments,
    recentNotices,
    latestSubmissions,
    enrollments,
  ] = await Promise.all([
    prisma.attendance.findFirst({
      where: { studentId, date: { gte: todayStart, lte: todayEnd } },
    }),
    prisma.attendance.findMany({ where: { studentId } }),
    prisma.assignment.findMany({
      where: { batchId: student.batchId!, status: 'PUBLISHED', dueDate: { gte: new Date() } },
      orderBy: { dueDate: 'asc' },
      take: 5,
      include: {
        batch: { select: { name: true } },
        submissions: { where: { studentId } },
      },
    }),
    prisma.announcement.findMany({
      where: {
        isActive: true,
        publishedAt: { lte: new Date() },
        OR: [
          { target: 'ALL' },
          { target: 'BATCH', batchId: student.batchId! },
          { target: 'STUDENT', studentId: userId },
        ],
      },
      orderBy: { publishedAt: 'desc' },
      take: 5,
    }),
    prisma.assignmentSubmission.findMany({
      where: { studentId, marks: { not: null } },
      orderBy: { gradedAt: 'desc' },
      take: 5,
      include: { assignment: { select: { title: true, maxMarks: true } } },
    }),
    prisma.courseEnrollment.findMany({
      where: { studentId },
      include: { course: true },
    }),
  ]);

  const present = attendanceRecords.filter(
    (a) => a.status === 'PRESENT' || a.status === 'LATE'
  ).length;
  const attendancePercent =
    attendanceRecords.length === 0 ? 0 : Math.round((present / attendanceRecords.length) * 100);

  const courseIds = enrollments.map((e) => e.courseId);
  const totalLessons = await prisma.lesson.count({
    where: { module: { courseId: { in: courseIds } } },
  });
  const completedLessons = await prisma.lessonProgress.count({
    where: { studentId, completed: true },
  });

  // Course progress per enrolled course.
  const courseProgress = await Promise.all(
    enrollments.map(async (e) => {
      const courseLessons = await prisma.lesson.count({
        where: { module: { courseId: e.courseId } },
      });
      const done = await prisma.lessonProgress.count({
        where: { studentId, completed: true, lesson: { module: { courseId: e.courseId } } },
      });
      return {
        courseId: e.course.id,
        title: e.course.title,
        color: e.course.color,
        progressPercent: courseLessons === 0 ? 0 : Math.round((done / courseLessons) * 100),
      };
    })
  );

  return {
    batch: student.batch,
    stats: {
      attendancePercent,
      attendanceToday: todayAttendance?.status ?? null,
      courseProgressPercent:
        totalLessons === 0 ? 0 : Math.round((completedLessons / totalLessons) * 100),
      upcomingAssignments: upcomingAssignments.length,
      averageMarks: latestSubmissions.length
        ? Math.round(
            latestSubmissions.reduce((a, s) => a + (s.marks ?? 0), 0) / latestSubmissions.length
          )
        : 0,
    },
    upcomingAssignments: upcomingAssignments.map((a) => ({
      ...a,
      mySubmission: a.submissions[0] ?? null,
    })),
    recentNotices,
    latestMarks: latestSubmissions,
    courseProgress,
  };
};
