import { prisma } from '../config/prisma';
import { sendEmail } from './email.service';
import { NOTIFICATION_TYPE, type NotificationType } from '../constants/enums';

interface NotifyOptions {
  userId: string;
  title: string;
  body: string;
  type?: NotificationType;
  link?: string;
  sendMail?: boolean;
}

export const createNotification = async (options: NotifyOptions): Promise<void> => {
  // Prefix the link with the recipient's role segment (frontend routes are
  // role-scoped, e.g. /student/announcements).
  let link = options.link;
  if (link) {
    const user = await prisma.user.findUnique({
      where: { id: options.userId },
      select: { role: true },
    });
    if (user) link = `/${user.role.toLowerCase()}${link}`;
  }

  await prisma.notification.create({
    data: {
      recipientId: options.userId,
      title: options.title,
      body: options.body,
      type: options.type ?? NOTIFICATION_TYPE.SYSTEM,
      link,
    },
  });

  if (options.sendMail) {
    const user = await prisma.user.findUnique({
      where: { id: options.userId },
      select: { email: true, firstName: true },
    });
    if (user) {
      await sendEmail({
        to: user.email,
        subject: options.title,
        html: `<p>Hi ${user.firstName},</p><p>${options.body}</p>`,
      });
    }
  }
};

export const notifyMany = async (
  userIds: string[],
  options: Omit<NotifyOptions, 'userId'>
): Promise<void> => {
  if (userIds.length === 0) return;

  // Resolve each recipient's role so links can be prefixed correctly
  // (frontend routes are role-scoped, e.g. /student/announcements).
  let linkByUser = new Map<string, string | null>();
  if (options.link) {
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, role: true },
    });
    linkByUser = new Map(users.map((u) => [u.id, `/${u.role.toLowerCase()}${options.link}`]));
  }

  await prisma.notification.createMany({
    data: userIds.map((id) => ({
      recipientId: id,
      title: options.title,
      body: options.body,
      type: options.type ?? NOTIFICATION_TYPE.SYSTEM,
      link: options.link ? (linkByUser.get(id) ?? options.link) : undefined,
    })),
  });

  if (options.sendMail) {
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, email: true, firstName: true },
    });
    await Promise.all(
      users.map((u) =>
        sendEmail({
          to: u.email,
          subject: options.title,
          html: `<p>Hi ${u.firstName},</p><p>${options.body}</p>`,
        })
      )
    );
  }
};
