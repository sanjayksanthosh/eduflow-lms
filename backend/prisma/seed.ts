import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import {
  ATTENDANCE_STATUS,
  BATCH_STATUS,
  GENDERS,
} from '../src/constants/enums';

const prisma = new PrismaClient();

const SALT_ROUNDS = 12;

const hash = (plain: string) => bcrypt.hash(plain, SALT_ROUNDS);

const day = (offset: number) => {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  d.setHours(0, 0, 0, 0);
  return d;
};

async function main() {
  console.log('Seeding EduFlow LMS database...');

  // ---------------- Admin ----------------
  const admin = await prisma.user.upsert({
    where: { email: 'admin@eduflow.app' },
    update: {},
    create: {
      email: 'admin@eduflow.app',
      passwordHash: await hash('Admin@123'),
      firstName: 'System',
      lastName: 'Administrator',
      role: 'ADMIN',
      status: 'ACTIVE',
    },
  });
  console.log('Admin:', admin.email);

  // ---------------- Settings ----------------
  await prisma.settings.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      data: {
        instituteName: 'EduFlow Institute',
        logo: null,
        address: '123 Learning Avenue, Tech City',
        theme: 'light',
        academicYear: '2026',
        semester: 'Spring',
        holidays: [],
      },
    },
  });

  // ---------------- Courses + Modules + Lessons ----------------
  const courses = [
    {
      title: 'Full Stack Web Development',
      code: 'FSWD-101',
      slug: 'full-stack-web-development',
      color: '#6366f1',
      description: 'Master frontend and backend development with modern tools.',
      modules: [
        {
          title: 'Frontend Fundamentals',
          lessons: [
            { title: 'Introduction to HTML & CSS', duration: 45 },
            { title: 'JavaScript Essentials', duration: 60 },
          ],
        },
        {
          title: 'React & Modern Tooling',
          lessons: [
            { title: 'React Hooks in Depth', duration: 75 },
            { title: 'State Management with TanStack Query', duration: 50 },
          ],
        },
      ],
    },
    {
      title: 'Data Science & Analytics',
      code: 'DSA-102',
      slug: 'data-science-analytics',
      color: '#0ea5e9',
      description: 'Learn data analysis, visualization and machine learning fundamentals.',
      modules: [
        {
          title: 'Python for Data Science',
          lessons: [
            { title: 'NumPy & Pandas Basics', duration: 55 },
            { title: 'Data Visualization', duration: 40 },
          ],
        },
      ],
    },
    {
      title: 'UI/UX Design',
      code: 'UIUX-103',
      slug: 'ui-ux-design',
      color: '#f59e0b',
      description: 'Design beautiful, usable digital products.',
      modules: [
        {
          title: 'Design Principles',
          lessons: [
            { title: 'Typography & Color Theory', duration: 35 },
            { title: 'Prototyping with Figma', duration: 65 },
          ],
        },
      ],
    },
  ];

  for (const courseData of courses) {
    const course = await prisma.course.upsert({
      where: { code: courseData.code },
      update: {},
      create: {
        title: courseData.title,
        code: courseData.code,
        slug: courseData.slug,
        color: courseData.color,
        description: courseData.description,
        modules: {
          create: courseData.modules.map((m, mi) => ({
            title: m.title,
            order: mi + 1,
            lessons: {
              create: m.lessons.map((l, li) => ({
                title: l.title,
                duration: l.duration,
                order: li + 1,
              })),
            },
          })),
        },
      },
    });
    console.log('Course:', course.code);
  }

  // ---------------- Mentors ----------------
  const mentorSeed = [
    {
      email: 'mentor.john@eduflow.app',
      firstName: 'John',
      lastName: 'Doe',
      department: 'Computer Science',
      qualification: 'M.Tech CSE',
      experience: 6,
      subjects: ['React', 'Node.js', 'TypeScript'],
    },
    {
      email: 'mentor.sarah@eduflow.app',
      firstName: 'Sarah',
      lastName: 'Lee',
      department: 'Data Science',
      qualification: 'M.Sc. Statistics',
      experience: 4,
      subjects: ['Python', 'Machine Learning'],
    },
  ];

  const mentors: { id: string; userId: string; email: string }[] = [];

  for (const m of mentorSeed) {
    const user = await prisma.user.upsert({
      where: { email: m.email },
      update: {},
      create: {
        email: m.email,
        passwordHash: await hash('Mentor@123'),
        firstName: m.firstName,
        lastName: m.lastName,
        phone: '+1 555 0100',
        role: 'MENTOR',
        status: 'ACTIVE',
        mentor: {
          create: {
            department: m.department,
            qualification: m.qualification,
            experience: m.experience,
            subjects: m.subjects,
          },
        },
      },
    });
    const mentor = await prisma.mentor.findUniqueOrThrow({ where: { userId: user.id } });
    mentors.push({ id: mentor.id, userId: user.id, email: user.email });
    console.log('Mentor:', user.email);
  }

  // ---------------- Batches ----------------
  const fswdCourse = await prisma.course.findUniqueOrThrow({ where: { code: 'FSWD-101' } });
  const dsaCourse = await prisma.course.findUniqueOrThrow({ where: { code: 'DSA-102' } });

  const batchSeed = [
    { name: 'FSWD Batch A', code: 'FSWD-A', courseId: fswdCourse.id, mentorId: mentors[0].id },
    { name: 'FSWD Batch B', code: 'FSWD-B', courseId: fswdCourse.id, mentorId: mentors[0].id },
    { name: 'DSA Batch A', code: 'DSA-A', courseId: dsaCourse.id, mentorId: mentors[1].id },
  ];

  const createdBatches: {
    id: string;
    code: string;
    courseId: string;
    mentorId: string | null;
  }[] = [];

  for (const b of batchSeed) {
    const batch = await prisma.batch.upsert({
      where: { code: b.code },
      update: {},
      create: {
        name: b.name,
        code: b.code,
        courseId: b.courseId,
        mentorId: b.mentorId,
        capacity: 30,
        status: BATCH_STATUS.ACTIVE,
        startDate: day(-30),
        endDate: day(150),
        description: `${b.name} cohort`,
      },
    });
    createdBatches.push({
      id: batch.id,
      code: batch.code,
      courseId: batch.courseId,
      mentorId: batch.mentorId,
    });
    console.log('Batch:', batch.code);
  }

  // ---------------- Students ----------------
  const studentSeed = [
    { email: 'student.alice@eduflow.app', firstName: 'Alice', lastName: 'Johnson', batchCode: 'FSWD-A' },
    { email: 'student.bob@eduflow.app', firstName: 'Bob', lastName: 'Smith', batchCode: 'FSWD-A' },
    { email: 'student.carol@eduflow.app', firstName: 'Carol', lastName: 'Williams', batchCode: 'FSWD-B' },
    { email: 'student.david@eduflow.app', firstName: 'David', lastName: 'Brown', batchCode: 'DSA-A' },
    { email: 'student.emma@eduflow.app', firstName: 'Emma', lastName: 'Davis', batchCode: 'DSA-A' },
  ];

  const students: { id: string; userId: string; batchId: string }[] = [];

  for (const [idx, s] of studentSeed.entries()) {
    const batch = createdBatches.find((b) => b.code === s.batchCode)!;
    const admissionNumber = `EDF-${new Date().getFullYear()}-${String(idx + 1).padStart(4, '0')}`;
    const user = await prisma.user.upsert({
      where: { email: s.email },
      update: {},
      create: {
        email: s.email,
        passwordHash: await hash('Student@123'),
        firstName: s.firstName,
        lastName: s.lastName,
        phone: `+1 555 02${idx + 10}`,
        address: `${100 + idx} Campus Street, City ${idx + 1}`,
        role: 'STUDENT',
        status: 'ACTIVE',
        student: {
          create: {
            admissionNumber,
            gender: idx % 2 === 0 ? GENDERS.FEMALE : GENDERS.MALE,
            dateOfBirth: new Date(`2004-0${(idx % 9) + 1}-15`),
            parentName: `Mr./Ms. ${s.lastName}`,
            parentPhone: `+1 555 09${idx + 10}`,
            emergencyContact: `+1 555 09${idx + 10}`,
            batchId: batch.id,
          },
        },
      },
    });
    const student = await prisma.student.findUniqueOrThrow({ where: { userId: user.id } });
    students.push({ id: student.id, userId: user.id, batchId: batch.id });

    const existingEnrollment = await prisma.courseEnrollment.findFirst({
      where: { studentId: student.id, courseId: batch.courseId },
    });
    if (!existingEnrollment) {
      await prisma.courseEnrollment.create({
        data: { studentId: student.id, courseId: batch.courseId, batchId: batch.id },
      });
    }
    console.log('Student:', user.email, `(${admissionNumber})`);
  }

  // ---------------- Attendance ----------------
  const statuses = [
    ATTENDANCE_STATUS.PRESENT,
    ATTENDANCE_STATUS.PRESENT,
    ATTENDANCE_STATUS.PRESENT,
    ATTENDANCE_STATUS.ABSENT,
    ATTENDANCE_STATUS.LATE,
    ATTENDANCE_STATUS.LEAVE,
  ];

  for (const batch of createdBatches) {
    const batchStudents = students.filter((s) => s.batchId === batch.id);
    if (batchStudents.length === 0 || !batch.mentorId) continue;
    for (let d = 10; d >= 1; d--) {
      const date = day(-d);
      for (const s of batchStudents) {
        const existing = await prisma.attendance.findFirst({
          where: { batchId: batch.id, studentId: s.id, date },
        });
        if (existing) continue;
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        await prisma.attendance.create({
          data: {
            batchId: batch.id,
            studentId: s.id,
            mentorId: batch.mentorId,
            date,
            status,
            markedById: admin.id,
          },
        });
      }
    }
  }
  console.log('Attendance seeded.');

  // ---------------- Assignments + Submissions ----------------
  for (const batch of createdBatches) {
    const batchStudents = students.filter((s) => s.batchId === batch.id);
    if (batchStudents.length === 0 || !batch.mentorId) continue;
    const assignment = await prisma.assignment.create({
      data: {
        batchId: batch.id,
        courseId: batch.courseId,
        mentorId: batch.mentorId,
        title: `${batch.code} — Weekly Assignment`,
        description: 'Complete the weekly task and submit your solution.',
        instructions: 'Write clean, documented code. Submit as a PDF or ZIP file.',
        maxMarks: 100,
        dueDate: day(3),
        lateSubmissionAllowed: true,
      },
    });

    for (const s of batchStudents) {
      const graded = Math.random() > 0.4;
      await prisma.assignmentSubmission.create({
        data: {
          assignmentId: assignment.id,
          studentId: s.id,
          content: 'Solution submission',
          status: graded ? 'APPROVED' : 'SUBMITTED',
          marks: graded ? Math.floor(Math.random() * 30) + 60 : null,
          feedback: graded ? 'Good work! Keep it up.' : null,
          submittedAt: day(-1),
          gradedAt: graded ? day(0) : null,
          gradedByMentorId: graded ? batch.mentorId : null,
          isLate: Math.random() > 0.8,
        },
      });
    }
  }
  console.log('Assignments seeded.');

  // ---------------- Announcements ----------------
  await prisma.announcement.create({
    data: {
      authorId: admin.id,
      title: 'Welcome to EduFlow!',
      content:
        'Welcome to the new academic year. Please explore the dashboard and make sure your profile is up to date.',
      target: 'ALL',
      publishedAt: new Date(),
    },
  });
  await prisma.announcement.create({
    data: {
      authorId: mentors[0].userId,
      title: 'FSWD Batch A — Weekend Workshop',
      content:
        'We are hosting a hands-on React workshop this Saturday at 10 AM in Lab 3. Attendance is optional but highly recommended.',
      target: 'BATCH',
      batchId: createdBatches[0].id,
      publishedAt: day(1),
    },
  });
  console.log('Announcements seeded.');

  // ---------------- Notifications ----------------
  for (const s of students) {
    await prisma.notification.createMany({
      data: [
        {
          recipientId: s.userId,
          title: 'New assignment available',
          body: 'A new weekly assignment has been published to your batch.',
          type: 'ASSIGNMENT_REMINDER',
          link: '/assignments',
        },
        {
          recipientId: s.userId,
          title: 'Attendance update',
          body: 'Your attendance for this week has been recorded.',
          type: 'ATTENDANCE_ALERT',
          link: '/attendance',
        },
      ],
    });
  }
  console.log('Notifications seeded.');

  console.log('\nSeed complete!');
  console.log('------------------------------');
  console.log('Admin  : admin@eduflow.app / Admin@123');
  console.log('Mentor : mentor.john@eduflow.app / Mentor@123');
  console.log('Student: student.alice@eduflow.app / Student@123');
  console.log('------------------------------');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
