import crypto from 'crypto';
import { Request, Response } from 'express';
import { prisma } from '../config/prisma';
import { env } from '../config/env';
import { ApiError } from '../utils/ApiError';
import { asyncHandler } from '../utils/asyncHandler';
import { hashPassword, verifyPassword } from '../utils/password';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../services/token.service';
import { logActivity } from '../services/activity.service';
import { emailTemplates, sendEmail } from '../services/email.service';
import { createNotification } from '../services/notification.service';
import { ACTIVITY_TYPE } from '../constants/enums';
import type { LoginInput } from '../validators/auth.schema';

const ACCESS_TOKEN_COOKIE = 'eduflow_access';
const REFRESH_TOKEN_COOKIE = 'eduflow_refresh';

const getClientIp = (req: Request): string => {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') return forwarded.split(',')[0].trim();
  return req.ip ?? 'unknown';
};

const cookieBaseOptions = (rememberMe: boolean, maxAgeMs?: number) => ({
  httpOnly: true,
  secure: env.nodeEnv === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: maxAgeMs ?? (rememberMe ? 7 * 24 * 60 * 60 * 1000 : 12 * 60 * 60 * 1000),
});

const attachAuthCookies = (res: Response, accessToken: string, refreshToken: string) => {
  res.cookie(ACCESS_TOKEN_COOKIE, accessToken, cookieBaseOptions(true, 15 * 60 * 1000));
  res.cookie(REFRESH_TOKEN_COOKIE, refreshToken, cookieBaseOptions(true));
};

export const login = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body as LoginInput;
  const identifier = body.identifier.trim();

  const user = await prisma.user.findFirst({
    where: {
      OR: [{ email: identifier.toLowerCase() }, { phone: identifier }],
    },
    include: { student: true, mentor: true },
  });

  if (!user || !(await verifyPassword(body.password, user.passwordHash))) {
    throw ApiError.unauthorized('Invalid credentials.');
  }

  if (user.status === 'SUSPENDED') {
    throw ApiError.forbidden('Your account has been suspended. Contact the administrator.');
  }
  if (user.status === 'INACTIVE') {
    throw ApiError.unauthorized('Your account is inactive.');
  }

  const accessToken = signAccessToken(user.id, user.role as 'ADMIN' | 'MENTOR' | 'STUDENT');
  const refreshToken = signRefreshToken(user.id);

  await prisma.user.update({
    where: { id: user.id },
    data: { refreshToken, lastLoginAt: new Date() },
  });

  attachAuthCookies(res, accessToken, refreshToken);

  await logActivity({
    userId: user.id,
    type: ACTIVITY_TYPE.LOGIN,
    action: 'User logged in',
    ip: getClientIp(req),
  });

  res.json({
    success: true,
    message: 'Login successful',
    data: {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        status: user.status,
        profileImage: user.profileImage,
        studentId: user.student?.id ?? null,
        mentorId: user.mentor?.id ?? null,
      },
    },
  });
});

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const token = req.cookies?.[REFRESH_TOKEN_COOKIE] ?? req.body?.refreshToken;
  if (!token) {
    throw ApiError.unauthorized('Refresh token missing.');
  }

  let payload;
  try {
    payload = verifyRefreshToken(token);
  } catch {
    throw ApiError.unauthorized('Invalid or expired refresh token.');
  }

  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user || user.refreshToken !== token) {
    throw ApiError.unauthorized('Refresh token revoked.');
  }
  if (user.status === 'SUSPENDED') {
    throw ApiError.forbidden('Your account has been suspended.');
  }

  const accessToken = signAccessToken(user.id, user.role as 'ADMIN' | 'MENTOR' | 'STUDENT');
  const newRefreshToken = signRefreshToken(user.id);

  await prisma.user.update({
    where: { id: user.id },
    data: { refreshToken: newRefreshToken },
  });

  res.cookie(ACCESS_TOKEN_COOKIE, accessToken, cookieBaseOptions(true, 15 * 60 * 1000));
  res.cookie(REFRESH_TOKEN_COOKIE, newRefreshToken, cookieBaseOptions(true));

  res.json({
    success: true,
    message: 'Token refreshed',
    data: { accessToken, refreshToken: newRefreshToken },
  });
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  const token = req.cookies?.[REFRESH_TOKEN_COOKIE] ?? req.body?.refreshToken;
  if (token) {
    try {
      const payload = verifyRefreshToken(token);
      await prisma.user.update({
        where: { id: payload.sub },
        data: { refreshToken: null },
      });
    } catch {
      // ignore invalid token on logout
    }
  }

  if (req.user) {
    await logActivity({
      userId: req.user.id,
      type: ACTIVITY_TYPE.LOGOUT,
      action: 'User logged out',
      ip: getClientIp(req),
    });
  }

  res.clearCookie(ACCESS_TOKEN_COOKIE, { path: '/' });
  res.clearCookie(REFRESH_TOKEN_COOKIE, { path: '/' });

  res.json({ success: true, message: 'Logged out successfully' });
});

export const getMe = asyncHandler(async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      status: true,
      phone: true,
      address: true,
      profileImage: true,
      createdAt: true,
      student: {
        select: {
          id: true,
          admissionNumber: true,
          parentName: true,
          parentPhone: true,
          emergencyContact: true,
          dateOfBirth: true,
          gender: true,
          batch: {
            select: {
              id: true,
              name: true,
              code: true,
              course: { select: { id: true, title: true } },
            },
          },
        },
      },
      mentor: {
        select: {
          id: true,
          department: true,
          qualification: true,
          experience: true,
          subjects: true,
          batches: { select: { id: true, name: true, code: true } },
        },
      },
    },
  });

  if (!user) {
    throw ApiError.unauthorized('User not found.');
  }

  res.json({ success: true, data: user });
});

export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body as { email: string };

  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });

  // Always return the same response to avoid user enumeration.
  const genericMessage =
    'If an account exists for that email, a password reset link has been sent.';

  if (!user) {
    res.json({ success: true, message: genericMessage });
    return;
  }

  const token = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

  await prisma.passwordReset.create({
    data: { userId: user.id, tokenHash, expiresAt },
  });

  const resetLink = `${env.clientUrl}/reset-password?token=${token}`;

  await sendEmail({
    to: user.email,
    subject: 'Reset your EduFlow password',
    html: emailTemplates.resetPassword(user.firstName, resetLink),
  });

  await logActivity({
    userId: user.id,
    type: ACTIVITY_TYPE.RESET_PASSWORD,
    action: 'Password reset requested',
    ip: getClientIp(req),
  });

  res.json({ success: true, message: genericMessage });
});

export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  const { token, password } = req.body as { token: string; password: string };
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

  const record = await prisma.passwordReset.findUnique({
    where: { tokenHash },
  });

  if (!record || record.usedAt) {
    throw ApiError.badRequest('This reset link is invalid or has already been used.');
  }
  if (record.expiresAt < new Date()) {
    throw ApiError.badRequest('This reset link has expired. Please request a new one.');
  }

  const passwordHash = await hashPassword(password);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: record.userId },
      data: { passwordHash, refreshToken: null },
    }),
    prisma.passwordReset.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    }),
  ]);

  const user = await prisma.user.findUnique({ where: { id: record.userId } });

  if (user) {
    await sendEmail({
      to: user.email,
      subject: 'Your password has been changed',
      html: emailTemplates.passwordChanged(user.firstName),
    });
    await createNotification({
      userId: user.id,
      title: 'Password changed',
      body: 'Your password was successfully reset.',
      type: 'SYSTEM',
      link: '/profile',
    });
  }

  res.json({ success: true, message: 'Password reset successfully. You can now log in.' });
});

export const changePassword = asyncHandler(async (req: Request, res: Response) => {
  const { currentPassword, newPassword } = req.body as {
    currentPassword: string;
    newPassword: string;
  };

  const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
  if (!user) throw ApiError.unauthorized();

  if (!(await verifyPassword(currentPassword, user.passwordHash))) {
    throw ApiError.badRequest('Current password is incorrect.');
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await hashPassword(newPassword), refreshToken: null },
  });

  res.clearCookie(REFRESH_TOKEN_COOKIE, { path: '/' });

  await logActivity({
    userId: user.id,
    type: ACTIVITY_TYPE.RESET_PASSWORD,
    action: 'Password changed',
    ip: getClientIp(req),
  });

  res.json({ success: true, message: 'Password changed successfully. Please log in again.' });
});
