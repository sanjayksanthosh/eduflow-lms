import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { uploadFile } from './cloudinary.service';

const UPLOAD_DIR = path.join(process.cwd(), 'uploads');

fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const getExtension = (mimetype: string): string => {
  const map: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
    'application/pdf': 'pdf',
    'application/zip': 'zip',
    'application/x-zip-compressed': 'zip',
    'application/msword': 'doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
    'text/plain': 'txt',
    'video/mp4': 'mp4',
  };
  return map[mimetype] ?? 'bin';
};

/**
 * Handles an uploaded buffer. Uses Cloudinary when configured; otherwise
 * persists the file locally under ./uploads (served by express static).
 */
export const storeUpload = async (
  file: { buffer: Buffer; originalname: string; mimetype: string },
  folder: string
) => {
  const filename = `${folder}-${crypto.randomBytes(8).toString('hex')}.${getExtension(file.mimetype)}`;

  if (process.env.CLOUDINARY_CLOUD_NAME) {
    const uploaded = await uploadFile(file.buffer, {
      folder,
      resourceType: file.mimetype.startsWith('video')
        ? 'video'
        : file.mimetype.startsWith('image')
          ? 'image'
          : 'raw',
    });
    return {
      url: uploaded.secureUrl,
      name: file.originalname,
      contentType: file.mimetype,
      size: file.buffer.length,
    };
  }

  const subDir = path.join(UPLOAD_DIR, folder);
  fs.mkdirSync(subDir, { recursive: true });
  const filePath = path.join(subDir, filename);
  fs.writeFileSync(filePath, file.buffer);
  return {
    url: `/uploads/${folder}/${filename}`,
    name: file.originalname,
    contentType: file.mimetype,
    size: file.buffer.length,
  };
};
