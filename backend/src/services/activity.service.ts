import { Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';
import { ACTIVITY_TYPE, type ActivityType } from '../constants/enums';

interface LogActivityOptions {
  userId?: string;
  type: ActivityType;
  action: string;
  metadata?: Prisma.InputJsonValue;
  ip?: string;
}

export const logActivity = async (options: LogActivityOptions): Promise<void> => {
  try {
    await prisma.activityLog.create({
      data: {
        userId: options.userId,
        type: options.type,
        action: options.action,
        metadata: options.metadata,
        ip: options.ip,
      },
    });
  } catch (error) {
    // Activity logging must never break the main request.
    // eslint-disable-next-line no-console
    console.error('Failed to log activity:', error);
  }
};
