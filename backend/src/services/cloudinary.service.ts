import { v2 as cloudinary } from 'cloudinary';
import { env } from '../config/env';
import { ApiError } from '../utils/ApiError';

cloudinary.config({
  cloud_name: env.cloudinary.cloudName,
  api_key: env.cloudinary.apiKey,
  api_secret: env.cloudinary.apiSecret,
});

const isConfigured = (): boolean =>
  Boolean(env.cloudinary.cloudName && env.cloudinary.apiKey && env.cloudinary.apiSecret);

export interface UploadedFile {
  url: string;
  publicId: string;
  secureUrl: string;
  format: string;
  bytes: number;
}

/**
 * Uploads a file to Cloudinary. When Cloudinary is not configured
 * (e.g. local development) the file is persisted locally under /uploads
 * and served by Express static middleware.
 */
export const uploadFile = async (
  buffer: Buffer,
  options: {
    folder: string;
    resourceType?: 'image' | 'raw' | 'video' | 'auto';
    publicId?: string;
    transformation?: Record<string, unknown>;
  }
): Promise<UploadedFile> => {
  if (isConfigured()) {
    const result = await cloudinary.uploader.upload(
      `data:${options.resourceType ?? 'auto'};base64,${buffer.toString('base64')}`,
      {
        folder: `eduflow/${options.folder}`,
        resource_type: options.resourceType ?? 'auto',
        public_id: options.publicId,
        transformation: options.transformation as never,
      }
    );
    return {
      url: result.url,
      publicId: result.public_id,
      secureUrl: result.secure_url,
      format: result.format,
      bytes: result.bytes,
    };
  }

  throw ApiError.badRequest(
    'Cloudinary is not configured. Set CLOUDINARY_* environment variables.'
  );
};

export const deleteFile = async (publicId: string): Promise<void> => {
  if (!isConfigured()) return;
  await cloudinary.uploader.destroy(publicId);
};
