import { NextFunction, Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { ApiError } from '../utils/ApiError';
import { logger } from '../utils/logger';

const isPrismaKnownError = (
  error: unknown
): error is Prisma.PrismaClientKnownRequestError => {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof (error as { code: unknown }).code === 'string'
  );
};

const mapPrismaError = (error: Prisma.PrismaClientKnownRequestError): ApiError => {
  switch (error.code) {
    case 'P2002':
      return new ApiError(409, 'A record with this value already exists.', [
        { field: String(error.meta?.target ?? 'unknown'), message: 'Unique constraint violation' },
      ]);
    case 'P2025':
      return new ApiError(404, 'Record not found.');
    case 'P2003':
      return new ApiError(400, 'Related record does not exist.', [
        { field: String(error.meta?.field_name ?? 'unknown'), message: 'Foreign key constraint violation' },
      ]);
    default:
      return new ApiError(500, `Database error (${error.code})`, undefined, false);
  }
};

export const errorHandler = (
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  if (error instanceof ApiError) {
    res.status(error.statusCode).json({
      success: false,
      message: error.message,
      errors: error.errors,
    });
    return;
  }

  if (isPrismaKnownError(error)) {
    const mapped = mapPrismaError(error);
    res.status(mapped.statusCode).json({
      success: false,
      message: mapped.message,
      errors: mapped.errors,
    });
    return;
  }

  if (error instanceof SyntaxError && 'status' in error) {
    res.status(400).json({ success: false, message: 'Invalid JSON payload.' });
    return;
  }

  logger.error({ err: error }, 'Unhandled error');
  res.status(500).json({
    success: false,
    message: 'Internal server error.',
  });
};
