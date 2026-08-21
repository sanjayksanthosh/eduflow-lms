import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Removes ALL application data (mock/demo data) while preserving:
 *  - ADMIN users
 *  - Settings
 *
 * Usage: npx tsx prisma/wipe-data.ts
 */
async function main() {
  console.log('Wiping all non-admin data...');

  await prisma.notification.deleteMany({});
  await prisma.message.deleteMany({});
  await prisma.activityLog.deleteMany({});
  await prisma.passwordReset.deleteMany({});
  await prisma.assignmentSubmission.deleteMany({});
  await prisma.assignment.deleteMany({});
  await prisma.attendance.deleteMany({});
  await prisma.announcement.deleteMany({});
  await prisma.lessonProgress.deleteMany({});
  await prisma.courseEnrollment.deleteMany({});
  await prisma.student.deleteMany({});
  await prisma.mentor.deleteMany({});
  await prisma.batch.deleteMany({});
  await prisma.lesson.deleteMany({});
  await prisma.module.deleteMany({});
  await prisma.course.deleteMany({});

  // Remove non-admin users (students/mentors)
  const deletedUsers = await prisma.user.deleteMany({
    where: { role: { not: 'ADMIN' } },
  });

  console.log(`Deleted ${deletedUsers.count} non-admin users.`);
  console.log('Wipe complete. Admin accounts and settings preserved.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
