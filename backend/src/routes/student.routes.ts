import { Router } from 'express';
import * as student from '../controllers/student.controller';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { upload } from '../middleware/upload';
import { lessonProgressSchema, submitAssignmentSchema } from '../validators/index.schema';

const router = Router();

router.use(authenticate, authorize('STUDENT'));

// Dashboard
router.get('/dashboard', student.getDashboard);
router.get('/me', student.getMe);

// ---------------- Courses ----------------
router.get('/courses', student.getCourses);
router.get('/courses/:id', student.getCourse);
router.post('/lessons/:lessonId/progress', validate(lessonProgressSchema), student.updateLessonProgress);

// ---------------- Attendance ----------------
router.get('/attendance', student.getAttendance);

// ---------------- Assignments ----------------
router.get('/assignments', student.getAssignments);
router.get('/assignments/:id', student.getAssignment);
router.post(
  '/assignments/:id/submit',
  upload.single('file'),
  student.submitAssignment
);

// ---------------- Announcements ----------------
router.get('/announcements', student.getAnnouncements);

// ---------------- Notifications ----------------
router.get('/notifications', student.getNotifications);
router.patch('/notifications/:id/read', student.markNotificationRead);
router.patch('/notifications/read-all', student.markAllNotificationsRead);

// ---------------- Messaging ----------------
router.get('/messages', student.listMessages);
router.post('/messages', student.sendMessage);

export default router;
