import { Router } from 'express';
import * as common from '../controllers/common.controller';
import { authenticate } from '../middleware/auth';
import { uploadImage } from '../middleware/upload';
import { z } from 'zod';
import { validate } from '../middleware/validate';

const router = Router();

const profileSchema = z.object({
  firstName: z.string().trim().min(1).optional(),
  lastName: z.string().trim().min(1).optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
});

router.patch('/profile', authenticate, validate(profileSchema), common.updateProfile);
router.post('/profile/picture', authenticate, uploadImage.single('image'), common.uploadProfilePicture);
router.get('/search', authenticate, common.globalSearch);

export default router;
