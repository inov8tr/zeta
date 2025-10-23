import "server-only";

import { createAdminClient } from "@/lib/supabaseAdmin";
import { resend } from "@/lib/resend";
import { SurveyInviteEmail } from "@/emails/SurveyInviteEmail";
import { render } from "@react-email/render";

const SURVEY_EXPIRY_HOURS = 72;

const sanitizeUrl = (value: string) =>
  value.replace(/^\s+|\s+$/g, "").replace(/^["']+|["']+$/g, "");

const normalizeBaseUrl = (rawValue: string | undefined, defaultValue: string) => {
  const candidate = sanitizeUrl(rawValue ?? "");
  if (!candidate) {
    return defaultValue;
  }

  const lower = candidate.toLowerCase();
  if (lower.startsWith("http://") || lower.startsWith("https://")) {
    return candidate.replace(/\/+$/, "");
  }
  if (lower.startsWith("//")) {
    return `https:${candidate}`.replace(/\/+$/, "");
  }
  if (candidate.startsWith("/")) {
    return `${defaultValue.replace(/\/+$/, "")}${candidate}`.replace(/\/+$/, "");
  }
  if (candidate.includes(".")) {
    return `https://${candidate}`.replace(/\/+$/, "");
  }
  return `${defaultValue.replace(/\/+$/, "")}/${candidate}`.replace(/\/+$/, "");
};

const DEFAULT_SITE_URL = normalizeBaseUrl(process.env.NEXT_PUBLIC_SITE_URL, "https://www.zeta-eng.com");
const SURVEY_BASE_URL = normalizeBaseUrl(
  process.env.NEXT_PUBLIC_PARENT_SURVEY_URL ?? `${DEFAULT_SITE_URL}/survey`,
  `${DEFAULT_SITE_URL}/survey`,
);

export async function sendSurveyInvite(studentId: string, parentEmail: string, studentName: string) {
  if (!studentId || !parentEmail) {
    throw new Error("Student ID and parent email are required to send survey invite.");
  }

  const admin = createAdminClient();
  const token = crypto.randomUUID();
  const expiry = new Date(Date.now() + SURVEY_EXPIRY_HOURS * 60 * 60 * 1000);

  const { error: upsertError } = await admin
    .from("students")
    .upsert(
      {
        id: studentId,
        parent_email: parentEmail,
        student_name: studentName,
        survey_token: token,
        survey_token_expiry: expiry.toISOString(),
        survey_completed: false,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" },
    );

  if (upsertError) {
    throw upsertError;
  }

  const surveyUrl = new URL(SURVEY_BASE_URL);
  surveyUrl.searchParams.set("student_id", studentId);
  surveyUrl.searchParams.set("token", token);
  const surveyLink = surveyUrl.toString();

  const emailHtml = await render(<SurveyInviteEmail studentName={studentName} surveyLink={surveyLink} />);

  const fromAddress = process.env.RESEND_FROM_EMAIL ?? "Zeta English <info@zeta-eng.com>";

  await resend.emails.send({
    from: fromAddress,
    to: parentEmail,
    subject: "Please complete the Zeta English Parent Survey",
    html: emailHtml,
  });
}
