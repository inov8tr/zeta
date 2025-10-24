import "server-only";

import { render } from "@react-email/render";

import { getResendClient } from "@/lib/resend";
import { SignupConfirmationEmail } from "@/emails/SignupConfirmationEmail";

type SendSignupConfirmationOptions = {
  to: string;
  confirmLink: string;
  userName?: string | null;
};

const sanitizeAddress = (value: string) => value.replace(/\s+/g, "");
const buildTextBody = (confirmLink: string, userName?: string | null) => {
  const safeLink = confirmLink.replace(/^\s+|\s+$/g, "").replace(/^["']+|["']+$/g, "");
  const greeting = userName?.trim() ? `Hi ${userName.trim()},` : "Hi there,";
  return [
    greeting,
    "Thanks for creating an account with Zeta English.",
    "Please confirm your email address by opening the link below:",
    safeLink,
    "If you did not request this email, you can ignore it.",
    "— Zeta English",
  ].join("\n\n");
};

export async function sendSignupConfirmationEmail({ to, confirmLink, userName }: SendSignupConfirmationOptions) {
  const fromAddress = process.env.RESEND_FROM_EMAIL ?? "Zeta English <info@zeta-eng.com>";
  const emailHtml = await render(<SignupConfirmationEmail confirmLink={confirmLink} userName={userName} />);
  const emailText = buildTextBody(confirmLink, userName);
  const resendClient = getResendClient();

  await resendClient.emails.send({
    from: fromAddress,
    to: sanitizeAddress(to),
    subject: "Confirm your email for Zeta English",
    html: emailHtml,
    text: emailText,
  });
}
