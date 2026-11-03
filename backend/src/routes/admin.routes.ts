import { Router } from 'express';
import * as admin from '../controllers/admin.controller';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { uploadImage, upload, uploadVideo } from '../middleware/upload';
import {
  createStudentSchema,
  updateStudentSchema,
  studentStatusSchema,
  assignBatchSchema,
  resetPasswordSchema,
  createMentorSchema,
  updateMentorSchema,
  createBatchSchema,
  updateBatchSchema,
  batchStudentsSchema,
  createCourseSchema,
  updateCourseSchema,
  createModuleSchema,
  updateModuleSchema,
  createLessonSchema,
  updateLessonSchema,
  markAttendanceSchema,
  createAssignmentSchema,
  updateAssignmentSchema,
  createAnnouncementSchema,
  updateAnnouncementSchema,
} from '../validators/index.schema';

const router = Router();

router.use(authenticate, authorize('ADMIN'));

// Dashboard
/**
 * @swagger
 * /admin/dashboard:
 *   get:
 *     summary: Admin dashboard statistics and charts
 *     tags: [Admin]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Dashboard data }
 */
router.get('/dashboard', admin.getDashboard);

// ---------------- Students ----------------
router.get('/students', admin.listStudents);
router.post('/students', validate(createStudentSchema), admin.createStudent);
router.get('/students/:id', admin.getStudent);
router.patch('/students/:id', validate(updateStudentSchema), admin.updateStudent);
router.delete('/students/:id', admin.deleteStudent);
router.patch('/students/:id/status', validate(studentStatusSchema), admin.setStudentStatus);
router.patch('/students/:id/batch', validate(assignBatchSchema), admin.assignStudentBatch);
router.post(
  '/students/:id/reset-password',
  validate(resetPasswordSchema),
  admin.resetStudentPassword
);
router.post(
  '/students/:id/profile-picture',
  uploadImage.single('image'),
  admin.uploadStudentPicture
);

// ---------------- Mentors ----------------
router.get('/mentors', admin.listMentors);
router.post('/mentors', validate(createMentorSchema), admin.createMentor);
router.get('/mentors/:id', admin.getMentor);
router.patch('/mentors/:id', validate(updateMentorSchema), admin.updateMentor);
router.delete('/mentors/:id', admin.deleteMentor);
router.post(
  '/mentors/:id/reset-password',
  validate(resetPasswordSchema),
  admin.resetMentorPassword
);
router.post('/mentors/:id/profile-picture', uploadImage.single('image'), admin.uploadMentorPicture);

// ---------------- Batches ----------------
router.get('/batches', admin.listBatches);
router.post('/batches', validate(createBatchSchema), admin.createBatch);
router.get('/batches/:id', admin.getBatch);
router.patch('/batches/:id', validate(updateBatchSchema), admin.updateBatch);
router.delete('/batches/:id', admin.deleteBatch);
router.post('/batches/:id/students', validate(batchStudentsSchema), admin.assignStudents);
router.delete('/batches/:id/students/:studentId', admin.removeStudent);

// ---------------- Courses ----------------
router.get('/courses', admin.listCourses);
router.post('/courses', validate(createCourseSchema), admin.createCourse);
router.get('/courses/:id', admin.getCourse);
router.patch('/courses/:id', validate(updateCourseSchema), admin.updateCourse);
router.delete('/courses/:id', admin.deleteCourse);
router.post('/courses/:courseId/modules', validate(createModuleSchema), admin.createModule);
router.patch('/modules/:id', validate(updateModuleSchema), admin.updateModule);
router.delete('/modules/:id', admin.deleteModule);
router.post('/modules/:moduleId/lessons', validate(createLessonSchema), admin.createLesson);
router.patch('/lessons/:id', validate(updateLessonSchema), admin.updateLesson);
router.delete('/lessons/:id', admin.deleteLesson);
router.post('/lessons/:id/file', upload.single('file'), admin.uploadLessonFile);
router.post('/lessons/:id/video', uploadVideo.single('video'), admin.uploadLessonFile);

// ---------------- Attendance ----------------
router.get('/attendance', admin.getAttendance);
router.post('/attendance', validate(markAttendanceSchema), admin.markAttendance);
router.get('/attendance/students/:id', admin.getStudentAttendance);

// ---------------- Assignments ----------------
router.get('/assignments', admin.listAssignments);
router.post('/assignments', validate(createAssignmentSchema), admin.createAssignment);
router.get('/assignments/:id', admin.getAssignment);
router.patch('/assignments/:id', validate(updateAssignmentSchema), admin.updateAssignment);
router.delete('/assignments/:id', admin.deleteAssignment);

// ---------------- Announcements ----------------
router.get('/announcements', admin.listAnnouncements);
router.post('/announcements', validate(createAnnouncementSchema), admin.createAnnouncement);
router.patch('/announcements/:id', validate(updateAnnouncementSchema), admin.updateAnnouncement);
router.delete('/announcements/:id', admin.deleteAnnouncement);

// ---------------- Reports ----------------
router.get('/reports/attendance', admin.attendanceReport);
router.get('/reports/performance', admin.performanceReport);
router.get('/reports/assignments', admin.assignmentReport);
router.get('/reports/batches', admin.batchReport);
router.get('/reports/mentors', admin.mentorReport);

// ---------------- Settings ----------------
router.get('/settings', admin.getSettings);
router.put('/settings', admin.updateSettings);

// ---------------- Activity logs ----------------
router.get('/activity-logs', admin.getActivityLogs);

export default router;
