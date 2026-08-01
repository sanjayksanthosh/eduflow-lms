import { Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';

const DEFAULT_SETTINGS = {
  instituteName: 'EduFlow Institute',
  logo: null,
  address: '',
  theme: 'light',
  academicYear: new Date().getFullYear().toString(),
  semester: 'Semester 1',
  holidays: [] as string[],
};

export const getSettings = async (): Promise<Prisma.JsonObject> => {
  const settings = await prisma.settings.findUnique({ where: { id: 'default' } });
  if (!settings) {
    await prisma.settings.create({
      data: { id: 'default', data: DEFAULT_SETTINGS },
    });
    return DEFAULT_SETTINGS as unknown as Prisma.JsonObject;
  }
  return settings.data as Prisma.JsonObject;
};

export const updateSettings = async (data: Record<string, unknown>) => {
  return prisma.settings.upsert({
    where: { id: 'default' },
    update: { data: data as Prisma.InputJsonObject },
    create: { id: 'default', data: data as Prisma.InputJsonObject },
  });
};
