import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const SALT_ROUNDS = 12;

/**
 * Minimal production seed: creates only the initial admin account and
 * default settings. All other data (courses, mentors, students, batches,
 * attendance, assignments, announcements) is created through the app.
 *
 * Set ADMIN_EMAIL / ADMIN_PASSWORD env vars before running in production.
 */
async function main() {
  const email = process.env.ADMIN_EMAIL ?? 'admin@eduflow.app';
  const password = process.env.ADMIN_PASSWORD ?? 'Admin@123';

  if (process.env.NODE_ENV === 'production' && !process.env.ADMIN_PASSWORD) {
    throw new Error('ADMIN_PASSWORD env var is required to seed in production.');
  }

  console.log('Seeding EduFlow LMS database (admin + settings only)...');

  await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      passwordHash: await bcrypt.hash(password, SALT_ROUNDS),
      firstName: 'System',
      lastName: 'Administrator',
      role: 'ADMIN',
      status: 'ACTIVE',
    },
  });
  console.log('Admin:', email);

  await prisma.settings.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      data: {
        instituteName: 'EduFlow Institute',
        logo: null,
        address: '',
        theme: 'light',
        academicYear: String(new Date().getFullYear()),
        semester: 'Spring',
        holidays: [],
      },
    },
  });
  console.log('Settings: default');

  console.log('\nSeed complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
