import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';
import { prisma } from '../config/prisma';
import { storeUpload } from '../services/upload.service';

export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  const { firstName, lastName, phone, address } = req.body;
  const user = await prisma.user.update({
    where: { id: req.user!.id },
    data: {
      firstName: firstName ?? undefined,
      lastName: lastName ?? undefined,
      phone: phone ?? undefined,
      address: address ?? undefined,
    },
  });
  res.json({
    success: true,
    message: 'Profile updated.',
    data: {
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      address: user.address,
    },
  });
});

export const uploadProfilePicture = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) throw ApiError.badRequest('No image provided.');
  const file = await storeUpload(req.file, 'profile-images');
  await prisma.user.update({
    where: { id: req.user!.id },
    data: { profileImage: file.url },
  });
  res.json({ success: true, message: 'Profile picture updated.', data: { url: file.url } });
});

export const globalSearch = asyncHandler(async (req: Request, res: Response) => {
  const term = String(req.query.q ?? '').trim();
  if (!term) {
    res.json({ success: true, data: { students: [], mentors: [], batches: [], courses: [] } });
    return;
  }

  const [students, mentors, batches, courses] = await Promise.all([
    prisma.student.findMany({
      where: {
        user: {
          OR: [
            { firstName: { contains: term, mode: 'insensitive' } },
            { lastName: { contains: term, mode: 'insensitive' } },
            { email: { contains: term, mode: 'insensitive' } },
          ],
        },
      },
      take: 5,
      include: {
        user: { select: { firstName: true, lastName: true, email: true, profileImage: true } },
      },
    }),
    prisma.mentor.findMany({
      where: {
        user: {
          OR: [
            { firstName: { contains: term, mode: 'insensitive' } },
            { lastName: { contains: term, mode: 'insensitive' } },
            { email: { contains: term, mode: 'insensitive' } },
          ],
        },
      },
      take: 5,
      include: {
        user: { select: { firstName: true, lastName: true, email: true, profileImage: true } },
      },
    }),
    prisma.batch.findMany({
      where: {
        OR: [
          { name: { contains: term, mode: 'insensitive' } },
          { code: { contains: term, mode: 'insensitive' } },
        ],
      },
      take: 5,
      include: { course: { select: { title: true } } },
    }),
    prisma.course.findMany({
      where: {
        OR: [
          { title: { contains: term, mode: 'insensitive' } },
          { code: { contains: term, mode: 'insensitive' } },
        ],
      },
      take: 5,
    }),
  ]);

  res.json({
    success: true,
    data: {
      students: students.map((s) => ({
        id: s.id,
        name: `${s.user.firstName} ${s.user.lastName}`,
        subtitle: s.user.email,
        image: s.user.profileImage,
        type: 'student',
      })),
      mentors: mentors.map((m) => ({
        id: m.id,
        name: `${m.user.firstName} ${m.user.lastName}`,
        subtitle: m.user.email,
        image: m.user.profileImage,
        type: 'mentor',
      })),
      batches: batches.map((b) => ({
        id: b.id,
        name: b.name,
        subtitle: `${b.code} · ${b.course.title}`,
        type: 'batch',
      })),
      courses: courses.map((c) => ({
        id: c.id,
        name: c.title,
        subtitle: c.code,
        type: 'course',
      })),
    },
  });
});
