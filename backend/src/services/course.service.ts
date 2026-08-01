import { Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';
import { ApiError } from '../utils/ApiError';
import { getPagination, buildSearchFilter } from '../utils/pagination';

export const courseList = async (query: Record<string, unknown>) => {
  const { page, limit, skip, sortOrder } = getPagination(query);
  const search = (query.search as string) ?? undefined;

  const orFilter = buildSearchFilter(search, ['title', 'code', 'description']);

  const where: Prisma.CourseWhereInput = orFilter ? { OR: orFilter } : {};

  const [total, courses] = await Promise.all([
    prisma.course.count({ where }),
    prisma.course.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: sortOrder },
      include: {
        _count: { select: { modules: true, batches: true } },
      },
    }),
  ]);

  return { data: courses, meta: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 } };
};

export const createCourse = async (input: Record<string, unknown>) => {
  const existing = await prisma.course.findFirst({
    where: {
      OR: [
        { code: input.code as string },
        { slug: (input.title as string).toLowerCase().replace(/[^a-z0-9]+/g, '-') },
      ],
    },
  });
  if (existing) throw ApiError.conflict('A course with this code or title already exists.');

  return prisma.course.create({
    data: {
      title: input.title as string,
      code: input.code as string,
      slug: (input.title as string).toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      description: (input.description as string) ?? undefined,
      color: (input.color as string) ?? '#6366f1',
    },
  });
};

export const getCourse = async (courseId: string) => {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      modules: {
        orderBy: { order: 'asc' },
        include: { lessons: { orderBy: { order: 'asc' } } },
      },
      batches: { select: { id: true, name: true, code: true, status: true } },
    },
  });
  if (!course) throw ApiError.notFound('Course not found.');

  const lessonCount = course.modules.reduce((acc, m) => acc + m.lessons.length, 0);
  const totalDuration = course.modules.reduce(
    (acc, m) => acc + m.lessons.reduce((a, l) => a + l.duration, 0),
    0
  );

  return { ...course, stats: { modules: course.modules.length, lessons: lessonCount, totalDuration } };
};

export const updateCourse = async (courseId: string, input: Record<string, unknown>) => {
  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) throw ApiError.notFound('Course not found.');

  return prisma.course.update({
    where: { id: courseId },
    data: {
      title: input.title as string | undefined,
      code: input.code as string | undefined,
      description: input.description as string | undefined,
      color: input.color as string | undefined,
      thumbnail: input.thumbnail as string | undefined,
    },
  });
};

export const deleteCourse = async (courseId: string) => {
  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) throw ApiError.notFound('Course not found.');

  const batches = await prisma.batch.count({ where: { courseId } });
  if (batches > 0) {
    throw ApiError.badRequest(
      'Cannot delete this course because batches are attached to it.'
    );
  }

  return prisma.course.delete({ where: { id: courseId } });
};

export const createModule = async (courseId: string, input: Record<string, unknown>) => {
  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) throw ApiError.notFound('Course not found.');

  const moduleCount = await prisma.module.count({ where: { courseId } });

  return prisma.module.create({
    data: {
      courseId,
      title: input.title as string,
      description: (input.description as string) ?? undefined,
      order: (input.order as number) ?? moduleCount + 1,
    },
  });
};

export const updateModule = async (moduleId: string, input: Record<string, unknown>) => {
  const module = await prisma.module.findUnique({ where: { id: moduleId } });
  if (!module) throw ApiError.notFound('Module not found.');

  return prisma.module.update({
    where: { id: moduleId },
    data: {
      title: input.title as string | undefined,
      description: input.description as string | undefined,
      order: input.order as number | undefined,
    },
  });
};

export const deleteModule = async (moduleId: string) => {
  const module = await prisma.module.findUnique({ where: { id: moduleId } });
  if (!module) throw ApiError.notFound('Module not found.');
  return prisma.module.delete({ where: { id: moduleId } });
};

export const createLesson = async (moduleId: string, input: Record<string, unknown>) => {
  const module = await prisma.module.findUnique({ where: { id: moduleId } });
  if (!module) throw ApiError.notFound('Module not found.');

  const lessonCount = await prisma.lesson.count({ where: { moduleId } });

  return prisma.lesson.create({
    data: {
      moduleId,
      title: input.title as string,
      description: (input.description as string) ?? undefined,
      videoUrl: (input.videoUrl as string) ?? undefined,
      duration: (input.duration as number) ?? 0,
      order: (input.order as number) ?? lessonCount + 1,
      isPublished: (input.isPublished as boolean) ?? true,
    },
  });
};

export const updateLesson = async (lessonId: string, input: Record<string, unknown>) => {
  const lesson = await prisma.lesson.findUnique({ where: { id: lessonId } });
  if (!lesson) throw ApiError.notFound('Lesson not found.');

  return prisma.lesson.update({
    where: { id: lessonId },
    data: {
      title: input.title as string | undefined,
      description: input.description as string | undefined,
      videoUrl: input.videoUrl as string | undefined,
      attachmentUrl: input.attachmentUrl as string | undefined,
      attachmentName: input.attachmentName as string | undefined,
      contentType: input.contentType as string | undefined,
      duration: input.duration as number | undefined,
      order: input.order as number | undefined,
      isPublished: input.isPublished as boolean | undefined,
    },
  });
};

export const deleteLesson = async (lessonId: string) => {
  const lesson = await prisma.lesson.findUnique({ where: { id: lessonId } });
  if (!lesson) throw ApiError.notFound('Lesson not found.');
  return prisma.lesson.delete({ where: { id: lessonId } });
};

export const attachLessonFile = async (
  lessonId: string,
  file: { url: string; name: string; contentType: string; size: number }
) => {
  const lesson = await prisma.lesson.findUnique({ where: { id: lessonId } });
  if (!lesson) throw ApiError.notFound('Lesson not found.');

  return prisma.lesson.update({
    where: { id: lessonId },
    data: {
      attachmentUrl: file.url,
      attachmentName: file.name,
      contentType: file.contentType,
    },
  });
};
