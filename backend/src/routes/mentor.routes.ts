import { Router } from 'express';
import * as mentor from '../controllers/mentor.controller';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { upload } from '../middleware/upload';
import {
  markAttendanceSchema,
  createAssignmentSchema,
  updateAssignmentSchema,
  createAnnouncementSchema,
  updateAnnouncementSchema,
  gradeSubmissionSchema,
} from '../validators/index.schema';

const router = Router();

router.use(authenticate, authorize('MENTOR'));

// Dashboard
router.get('/dashboard', mentor.getDashboard);

// ---------------- Batches ----------------
router.get('/batches', mentor.listBatches);
router.get('/batches/:id', mentor.getBatch);

// ---------------- Attendance ----------------
router.get('/batches/:batchId/attendance', mentor.getAttendance);
router.post('/batches/:batchId/attendance', validate(markAttendanceSchema), mentor.markAttendance);
router.get('/attendance/students/:studentId', mentor.getStudentAttendance);

// ---------------- Assignments ----------------
router.get('/assignments', mentor.listAssignments);
router.post('/assignments', validate(createAssignmentSchema), mentor.createAssignment);
router.post('/assignments/attachment', upload.single('file'), mentor.uploadAssignmentAttachment);
router.get('/assignments/:id', mentor.getAssignment);
router.patch('/assignments/:id', validate(updateAssignmentSchema), mentor.updateAssignment);
router.delete('/assignments/:id', mentor.deleteAssignment);
router.post('/assignments/:id/submissions/:submissionId/grade', validate(gradeSubmissionSchema), mentor.gradeSubmission);

// ---------------- Students ----------------
router.get('/students/:id', mentor.getStudent);

// ---------------- Announcements ----------------
router.get('/announcements', mentor.listAnnouncements);
router.post('/announcements', validate(createAnnouncementSchema), mentor.createAnnouncement);
router.patch('/announcements/:id', validate(updateAnnouncementSchema), mentor.updateAnnouncement);
router.delete('/announcements/:id', mentor.deleteAnnouncement);

// ---------------- Messaging ----------------
router.get('/batches/:batchId/messages', mentor.listMessages);
router.post('/batches/:batchId/messages', mentor.sendMessage);

export default router;
