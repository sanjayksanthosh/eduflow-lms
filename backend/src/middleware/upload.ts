import multer from 'multer';
import { ApiError } from '../utils/ApiError';

const storage = multer.memoryStorage();

const limits = {
  fileSize: 50 * 1024 * 1024, // 50 MB
};

const fileFilter = (
  _req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowed =
    /^(image\/(jpeg|png|webp|gif)|application\/pdf|application\/zip|application\/x-zip-compressed|application\/msword|application\/vnd\.openxmlformats-officedocument\.wordprocessingml\.document|text\/plain|video\/mp4)$/;
  if (!allowed.test(file.mimetype)) {
    cb(new ApiError(400, `File type '${file.mimetype}' is not allowed.`));
    return;
  }
  cb(null, true);
};

export const upload = multer({ storage, limits, fileFilter });

export const uploadAny = multer({
  storage,
  limits,
  fileFilter: (_req, _file, cb) => cb(null, true),
});

export const uploadImage = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!/^image\/(jpeg|png|webp|gif)$/.test(file.mimetype)) {
      cb(new ApiError(400, 'Only JPEG, PNG, WEBP or GIF images are allowed.'));
      return;
    }
    cb(null, true);
  },
});

export const uploadVideo = multer({
  storage,
  limits: { fileSize: 200 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!/^video\/mp4$/.test(file.mimetype)) {
      cb(new ApiError(400, 'Only MP4 videos are allowed.'));
      return;
    }
    cb(null, true);
  },
});
