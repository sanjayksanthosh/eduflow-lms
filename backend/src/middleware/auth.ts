import { NextFunction, Request, Response } from 'express';
import { prisma } from '../config/prisma';
import { ApiError } from '../utils/ApiError';
import { verifyAccessToken } from '../services/token.service';
import { asyncHandler } from '../utils/asyncHandler';
import type { Role } from '../constants/enums';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: Role;
        email: string;
        firstName: string;
        lastName: string;
        status: string;
        mentorId?: string | null;
        studentId?: string | null;
      };
    }
  }
}

export const authenticate = asyncHandler(
  async (req: Request, _res: Response, next: NextFunction) => {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      throw ApiError.unauthorized('Authentication token missing.');
    }

    const token = header.slice(7);
    let payload;
    try {
      payload = verifyAccessToken(token);
    } catch {
      throw ApiError.unauthorized('Invalid or expired token.');
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        role: true,
        email: true,
        firstName: true,
        lastName: true,
        status: true,
        student: { select: { id: true } },
        mentor: { select: { id: true } },
      },
    });

    if (!user) {
      throw ApiError.unauthorized('User account no longer exists.');
    }

    if (user.status === 'SUSPENDED') {
      throw ApiError.forbidden('Your account has been suspended. Contact the administrator.');
    }

    req.user = {
      id: user.id,
      role: user.role as Role,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      status: user.status,
      mentorId: user.mentor?.id ?? null,
      studentId: user.student?.id ?? null,
    };
    next();
  }
);

export const authorize =
  (...roles: Role[]) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(ApiError.unauthorized());
      return;
    }
    if (!roles.includes(req.user.role)) {
      next(ApiError.forbidden('You do not have permission to access this resource.'));
      return;
    }
    next();
  };
