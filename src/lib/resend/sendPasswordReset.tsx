import "server-only";

import { render } from "@react-email/render";

import { PasswordResetEmail } from "@/emails/PasswordResetEmail";
import { getResendClient } from "@/lib/resend";

type SendPasswordResetOptions = {
  to: string;
  resetLink: string;
  userName?: string | null;
};

const sanitizeAddress = (value: string) => value.replace(/\s+/g, "");

const buildTextBody = (resetLink: string, userName?: string | null) => {
  const safeLink = resetLink.replace(/^["']+|["']+$/g, "").trim();
  const greeting = userName?.trim() ? `Hi ${userName.trim()},` : "Hi there,";

  return [
    greeting,
    "We received a request to reset the password for your Zeta English account.",
    "You can set a new password using the secure link below:",
    safeLink,
    "If you did not ask for this email, you can ignore it.",
    "— Zeta English",
  ].join("\n\n");
};

export async function sendPasswordResetEmail({ to, resetLink, userName }: SendPasswordResetOptions) {
  const fromAddress = process.env.RESEND_FROM_EMAIL ?? "Zeta English <info@zeta-eng.com>";
  const emailHtml = await render(<PasswordResetEmail resetLink={resetLink} userName={userName} />);
  const emailText = buildTextBody(resetLink, userName);
  const resendClient = getResendClient();

  await resendClient.emails.send({
    from: fromAddress,
    to: sanitizeAddress(to),
    subject: "Reset your password for Zeta English",
    html: emailHtml,
    text: emailText,
  });
}

