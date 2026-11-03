import { prisma } from '../config/prisma';
import { ApiError } from '../utils/ApiError';
import { getPagination } from '../utils/pagination';
import { createNotification } from './notification.service';
import { logActivity } from './activity.service';
import { ACTIVITY_TYPE } from '../constants/enums';

export const assignmentList = async (query: Record<string, unknown>) => {
  const { page, limit, skip, sortOrder } = getPagination(query);
  const batchId = (query.batchId as string) ?? undefined;
  const status = (query.status as string) ?? undefined;

  const where = { batchId: batchId ?? undefined, status: status ?? undefined };

  const [total, assignments] = await Promise.all([
    prisma.assignment.count({ where }),
    prisma.assignment.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: sortOrder },
      include: {
        batch: { select: { id: true, name: true, code: true } },
        course: { select: { id: true, title: true } },
        mentor: { select: { id: true, user: { select: { firstName: true, lastName: true } } } },
        submissions: { select: { status: true, marks: true } },
      },
    }),
  ]);

  return {
    data: assignments.map((a) => ({
      ...a,
      submissionStats: {
        total: a.submissions.length,
        submitted: a.submissions.filter((s) => s.status !== 'PENDING').length,
        graded: a.submissions.filter((s) => s.marks != null).length,
        averageMarks: a.submissions.some((s) => s.marks != null)
          ? Math.round(
              a.submissions
                .filter((s) => s.marks != null)
                .reduce((acc, s) => acc + (s.marks ?? 0), 0) /
                a.submissions.filter((s) => s.marks != null).length
            )
          : 0,
      },
    })),
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
  };
};

export const createAssignment = async (input: Record<string, unknown>, mentorId: string) => {
  const batch = await prisma.batch.findUnique({
    where: { id: input.batchId as string },
    include: { students: { select: { userId: true } } },
  });
  if (!batch) throw ApiError.notFound('Batch not found.');

  const assignment = await prisma.assignment.create({
    data: {
      batchId: input.batchId as string,
      courseId: (input.courseId as string) ?? batch.courseId,
      mentorId,
      title: input.title as string,
      description: (input.description as string) ?? undefined,
      instructions: (input.instructions as string) ?? undefined,
      maxMarks: (input.maxMarks as number) ?? 100,
      dueDate: new Date(input.dueDate as string),
      lateSubmissionAllowed: (input.lateSubmissionAllowed as boolean) ?? false,
      attachmentUrl: (input.attachmentUrl as string) ?? undefined,
      attachmentName: (input.attachmentName as string) ?? undefined,
      status: (input.status as string) ?? 'PUBLISHED',
    },
  });

  await Promise.all(
    batch.students.map((s) =>
      createNotification({
        userId: s.userId,
        title: 'New assignment available',
        body: `"${assignment.title}" was published to ${batch.name}. Due ${assignment.dueDate.toLocaleDateString()}.`,
        type: 'ASSIGNMENT_REMINDER',
        link: '/assignments',
      })
    )
  );

  await logActivity({
    userId: undefined,
    type: ACTIVITY_TYPE.CREATE,
    action: `Created assignment "${assignment.title}" for ${batch.code}`,
  });

  return assignment;
};

export const getAssignment = async (assignmentId: string) => {
  const assignment = await prisma.assignment.findUnique({
    where: { id: assignmentId },
    include: {
      batch: { select: { id: true, name: true, code: true } },
      course: { select: { id: true, title: true } },
      mentor: { select: { id: true, user: { select: { firstName: true, lastName: true } } } },
      submissions: {
        include: {
          student: {
            include: {
              user: {
                select: { firstName: true, lastName: true, email: true, profileImage: true },
              },
            },
          },
        },
        orderBy: { submittedAt: 'desc' },
      },
    },
  });
  if (!assignment) throw ApiError.notFound('Assignment not found.');
  return assignment;
};

export const updateAssignment = async (assignmentId: string, input: Record<string, unknown>) => {
  const assignment = await prisma.assignment.findUnique({ where: { id: assignmentId } });
  if (!assignment) throw ApiError.notFound('Assignment not found.');

  return prisma.assignment.update({
    where: { id: assignmentId },
    data: {
      title: input.title as string | undefined,
      description: input.description as string | undefined,
      instructions: input.instructions as string | undefined,
      maxMarks: input.maxMarks as number | undefined,
      dueDate: input.dueDate ? new Date(input.dueDate as string) : undefined,
      lateSubmissionAllowed: input.lateSubmissionAllowed as boolean | undefined,
      attachmentUrl: input.attachmentUrl as string | undefined,
      attachmentName: input.attachmentName as string | undefined,
      status: input.status as string | undefined,
    },
  });
};

export const deleteAssignment = async (assignmentId: string) => {
  const assignment = await prisma.assignment.findUnique({ where: { id: assignmentId } });
  if (!assignment) throw ApiError.notFound('Assignment not found.');
  return prisma.assignment.delete({ where: { id: assignmentId } });
};

export const gradeSubmission = async (
  submissionId: string,
  input: { marks: number; feedback?: string; status?: string },
  mentorId: string
) => {
  const submission = await prisma.assignmentSubmission.findUnique({
    where: { id: submissionId },
    include: { student: { select: { userId: true } }, assignment: { select: { maxMarks: true } } },
  });
  if (!submission) throw ApiError.notFound('Submission not found.');
  if (input.marks > submission.assignment.maxMarks) {
    throw ApiError.badRequest(
      `Marks cannot exceed the maximum of ${submission.assignment.maxMarks}.`
    );
  }

  const graded = await prisma.assignmentSubmission.update({
    where: { id: submissionId },
    data: {
      marks: input.marks,
      feedback: input.feedback,
      status: input.status ?? 'APPROVED',
      gradedAt: new Date(),
      gradedByMentorId: mentorId,
    },
  });

  await createNotification({
    userId: submission.student.userId,
    title: 'Assignment graded',
    body: `Your submission received ${input.marks}/${submission.assignment.maxMarks}.`,
    type: 'GRADING',
    link: '/assignments',
  });

  await logActivity({
    userId: undefined,
    type: ACTIVITY_TYPE.GRADE_ASSIGNMENT,
    action: `Graded submission with ${input.marks} marks`,
  });

  return graded;
};

export const submitAssignment = async (
  assignmentId: string,
  studentId: string,
  input: { content?: string; file?: { url: string; name: string; size: number } }
) => {
  const assignment = await prisma.assignment.findUnique({
    where: { id: assignmentId },
    include: { batch: { select: { students: { select: { id: true } } } } },
  });
  if (!assignment) throw ApiError.notFound('Assignment not found.');

  const isEnrolled = assignment.batch.students.some((s) => s.id === studentId);
  if (!isEnrolled) {
    throw ApiError.forbidden('You are not enrolled in this batch.');
  }

  if (assignment.status === 'CLOSED' || assignment.status === 'ARCHIVED') {
    throw ApiError.badRequest('This assignment is closed and no longer accepts submissions.');
  }

  const isLate = new Date() > assignment.dueDate;
  if (isLate && !assignment.lateSubmissionAllowed) {
    throw ApiError.badRequest(
      'This assignment is past its due date and late submission is not allowed.'
    );
  }

  const existing = await prisma.assignmentSubmission.findFirst({
    where: { assignmentId, studentId },
  });

  const data = {
    content: input.content,
    fileUrl: input.file?.url,
    fileName: input.file?.name,
    fileSize: input.file?.size,
    status: 'SUBMITTED',
    submittedAt: new Date(),
    isLate,
  };

  if (existing) {
    return prisma.assignmentSubmission.update({
      where: { id: existing.id },
      data,
    });
  }

  await logActivity({
    userId: undefined,
    type: ACTIVITY_TYPE.SUBMIT_ASSIGNMENT,
    action: `Submitted assignment "${assignment.title}"`,
  });

  return prisma.assignmentSubmission.create({
    data: { ...data, assignmentId, studentId },
  });
};

export const studentAssignments = async (studentId: string) => {
  const student = await prisma.student.findUnique({ where: { id: studentId } });
  if (!student?.batchId) {
    throw ApiError.notFound('No batch assigned to this student.');
  }

  const assignments = await prisma.assignment.findMany({
    where: { batchId: student.batchId, status: 'PUBLISHED' },
    orderBy: { dueDate: 'asc' },
    include: {
      batch: { select: { id: true, name: true } },
      course: { select: { id: true, title: true } },
      submissions: { where: { studentId } },
    },
  });

  return assignments.map((a) => ({
    ...a,
    mySubmission: a.submissions[0] ?? null,
  }));
};
