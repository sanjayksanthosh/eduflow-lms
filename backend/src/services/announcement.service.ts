import { prisma } from '../config/prisma';
import { ApiError } from '../utils/ApiError';
import { getPagination } from '../utils/pagination';
import { notifyMany } from './notification.service';

export const announcementList = async (
  query: Record<string, unknown>,
  role?: string,
  userId?: string
) => {
  const { page, limit, skip } = getPagination(query);
  const target = (query.target as string) ?? undefined;

  // Build a visibility filter based on role.
  const visibility: Record<string, unknown>[] = [{ isActive: true }];

  if (role === 'ADMIN') {
    // Admins see everything.
    if (target) visibility.push({ target });
  } else if (role === 'MENTOR') {
    // Mentors see ALL and announcements authored by themselves.
    visibility.push({ OR: [{ target: 'ALL' }, { authorId: userId }] });
  } else if (role === 'STUDENT') {
    // Students see ALL and announcements for their batch.
    const student = await prisma.student.findUnique({ where: { userId } });
    visibility.push({
      OR: [
        { target: 'ALL' },
        { target: 'BATCH', batchId: student?.batchId },
        { target: 'STUDENT', studentId: userId },
      ],
    });
  }

  const where = { AND: visibility };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (where as any).publishedAt = { lte: new Date() };

  const [total, announcements] = await Promise.all([
    prisma.announcement.count({ where }),
    prisma.announcement.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        author: { select: { firstName: true, lastName: true, role: true } },
        batch: { select: { id: true, name: true } },
      },
    }),
  ]);

  return {
    data: announcements,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
  };
};

export const createAnnouncement = async (input: Record<string, unknown>, authorId: string) => {
  const now = new Date();
  const scheduled = input.scheduledAt ? new Date(input.scheduledAt as string) : undefined;
  const isScheduled = scheduled && scheduled > now;

  if (input.batchId) {
    const batch = await prisma.batch.findUnique({ where: { id: input.batchId as string } });
    if (!batch) throw ApiError.notFound('Batch not found.');
  }
  if (input.studentId) {
    const user = await prisma.user.findUnique({ where: { id: input.studentId as string } });
    if (!user) throw ApiError.notFound('Student user not found.');
  }

  const announcement = await prisma.announcement.create({
    data: {
      authorId,
      title: input.title as string,
      content: input.content as string,
      target: (input.target as string) ?? 'ALL',
      batchId: (input.batchId as string) ?? undefined,
      studentId: (input.studentId as string) ?? undefined,
      scheduledAt: scheduled ?? undefined,
      publishedAt: isScheduled ? undefined : now,
      isActive: true,
    },
  });

  // Notify relevant users if published immediately.
  if (!isScheduled && announcement.target === 'ALL') {
    const users = await prisma.user.findMany({
      where: { status: 'ACTIVE' },
      select: { id: true },
    });
    await notifyMany(
      users.map((u) => u.id),
      {
        title: announcement.title,
        body: announcement.content,
        type: 'ANNOUNCEMENT',
        link: '/announcements',
      }
    );
  } else if (!isScheduled && announcement.target === 'BATCH' && announcement.batchId) {
    const students = await prisma.student.findMany({
      where: { batchId: announcement.batchId },
      select: { userId: true },
    });
    const batch = await prisma.batch.findUnique({ where: { id: announcement.batchId } });
    await notifyMany(
      students.map((s) => s.userId),
      {
        title: `${batch?.name}: ${announcement.title}`,
        body: announcement.content,
        type: 'ANNOUNCEMENT',
        link: '/announcements',
      }
    );
  } else if (!isScheduled && announcement.target === 'STUDENT' && announcement.studentId) {
    await notifyMany([announcement.studentId], {
      title: announcement.title,
      body: announcement.content,
      type: 'ANNOUNCEMENT',
      link: '/announcements',
    });
  }

  return announcement;
};

export const updateAnnouncement = async (
  announcementId: string,
  input: Record<string, unknown>
) => {
  const announcement = await prisma.announcement.findUnique({ where: { id: announcementId } });
  if (!announcement) throw ApiError.notFound('Announcement not found.');

  return prisma.announcement.update({
    where: { id: announcementId },
    data: {
      title: input.title as string | undefined,
      content: input.content as string | undefined,
      target: input.target as string | undefined,
      batchId: input.batchId as string | undefined,
      studentId: input.studentId as string | undefined,
      scheduledAt: input.scheduledAt ? new Date(input.scheduledAt as string) : undefined,
      isActive: input.isActive as boolean | undefined,
    },
  });
};

export const deleteAnnouncement = async (announcementId: string) => {
  const announcement = await prisma.announcement.findUnique({ where: { id: announcementId } });
  if (!announcement) throw ApiError.notFound('Announcement not found.');
  return prisma.announcement.delete({ where: { id: announcementId } });
};
