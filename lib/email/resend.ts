import "server-only";
import { Resend } from "resend";
import { env } from "@/lib/env";

/**
 * Resend クライアント（サーバー専用）。
 * レシピ CRUD 時に admin 全員へ通知メールを送る用途で使用する。
 */
let cached: Resend | null = null;

export function getResend(): Resend {
  if (cached) return cached;
  cached = new Resend(env.resendApiKey);
  return cached;
}

export type SendEmailParams = {
  to: string | string[];
  subject: string;
  html: string;
};

export async function sendEmail({ to, subject, html }: SendEmailParams) {
  const resend = getResend();
  return resend.emails.send({
    from: env.resendFromEmail,
    to,
    subject,
    html,
  });
}
