import nodemailer, { Transporter } from 'nodemailer';
import { env } from '../config/env';
import { logger } from '../utils/logger';

let transporter: Transporter | null = null;

const getTransporter = (): Transporter | null => {
  if (transporter) return transporter;
  if (!env.smtp.user) return null;
  transporter = nodemailer.createTransport({
    host: env.smtp.host,
    port: env.smtp.port,
    secure: env.smtp.port === 465,
    auth: { user: env.smtp.user, pass: env.smtp.pass },
  });
  return transporter;
};

interface SendMailOptions {
  to: string;
  subject: string;
  html: string;
}

const renderLayout = (title: string, bodyHtml: string): string => `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title}</title>
  </head>
  <body style="margin:0;padding:0;background:#f4f5f7;font-family:'Segoe UI',Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f5f7;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 8px 24px rgba(15,23,42,0.08);">
            <tr>
              <td style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:24px 32px;">
                <span style="color:#ffffff;font-size:20px;font-weight:700;">EduFlow LMS</span>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;color:#1e293b;font-size:15px;line-height:1.6;">
                ${bodyHtml}
              </td>
            </tr>
            <tr>
              <td style="padding:20px 32px;background:#f8fafc;color:#64748b;font-size:12px;text-align:center;">
                &copy; ${new Date().getFullYear()} EduFlow LMS &middot; This is an automated message, please do not reply.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
`;

export const sendEmail = async (options: SendMailOptions): Promise<boolean> => {
  const sender = getTransporter();
  if (!sender) {
    logger.warn(
      'SMTP not configured (SMTP_USER empty). Email skipped in favor of in-app notification.'
    );
    return false;
  }
  try {
    await sender.sendMail({
      from: env.smtp.from,
      to: options.to,
      subject: options.subject,
      html: renderLayout(options.subject, options.html),
    });
    return true;
  } catch (error) {
    logger.error({ err: error }, 'Failed to send email');
    return false;
  }
};

export const emailTemplates = {
  welcome: (name: string, email: string, password: string, role: string): string => `
    <h2 style="margin:0 0 16px;color:#0f172a;">Welcome to EduFlow!</h2>
    <p>Hi ${name},</p>
    <p>Your ${role.toLowerCase()} account has been created successfully.</p>
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:16px 0;background:#f1f5f9;border-radius:8px;padding:16px;width:100%;">
      <tr><td style="padding:4px 0;color:#475569;">Email: <strong>${email}</strong></td></tr>
      <tr><td style="padding:4px 0;color:#475569;">Temporary password: <strong>${password}</strong></td></tr>
    </table>
    <p style="color:#475569;">Please sign in and change your password as soon as possible.</p>
  `,
  resetPassword: (name: string, link: string): string => `
    <h2 style="margin:0 0 16px;color:#0f172a;">Reset your password</h2>
    <p>Hi ${name},</p>
    <p>We received a request to reset your password. Click the button below to continue. This link expires in 1 hour.</p>
    <p style="margin:24px 0;">
      <a href="${link}" style="display:inline-block;background:#6366f1;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:600;">Reset Password</a>
    </p>
    <p style="color:#64748b;font-size:13px;">If you did not request this, you can safely ignore this email.</p>
  `,
  passwordChanged: (name: string): string => `
    <h2 style="margin:0 0 16px;color:#0f172a;">Password changed</h2>
    <p>Hi ${name},</p>
    <p>Your password was successfully changed. If you did not do this, please contact your administrator immediately.</p>
  `,
};
