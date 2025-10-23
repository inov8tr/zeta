"use server";

import { revalidatePath } from "next/cache";
import { randomUUID } from "crypto";
import { sendSurveyInvite } from "@/lib/resend/sendSurveyInvite";
import { createAdminClient } from "@/lib/supabaseAdmin";

const SURVEY_EXPIRY_HOURS = 72;

const sanitizeUrl = (value: string) => value.replace(/^\s+|\s+$/g, "").replace(/^['"]+|['"]+$/g, "");

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

const buildSurveyLink = (studentId: string, token: string, admin: boolean) => {
  const url = new URL(SURVEY_BASE_URL);
  url.searchParams.set("student_id", studentId);
  url.searchParams.set("token", token);
  if (admin) {
    url.searchParams.set("admin", "true");
  }
  return url.toString();
};

type SendSurveyInviteInput = {
  studentId: string;
  parentEmail: string;
  studentName?: string | null;
  revalidate?: string;
};

export async function sendSurveyInviteAction(input: SendSurveyInviteInput) {
  try {
    await sendSurveyInvite(input.studentId, input.parentEmail, input.studentName ?? "학생");
    if (input.revalidate) {
      revalidatePath(input.revalidate);
    }
    return { ok: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "설문 초대 이메일 전송에 실패했습니다.";
    console.error("sendSurveyInviteAction error:", error);
    return { ok: false, error: message };
  }
}

export async function ensureSurveyTokenAction({ studentId }: { studentId: string }) {
  try {
    const admin = createAdminClient();
    const { data: student, error } = await admin
      .from("students")
      .select("id, survey_token, survey_token_expiry")
      .eq("id", studentId)
      .maybeSingle();

    if (error || !student) {
      return { ok: false, error: "학생 정보를 불러오지 못했습니다." };
    }

    const now = new Date();
    let token = student.survey_token ?? undefined;
    const expiry = student.survey_token_expiry ? new Date(student.survey_token_expiry) : null;
    const needsNewToken = !token || (expiry && expiry < now);

    if (needsNewToken) {
      token = randomUUID();
      const newExpiry = new Date(now.getTime() + SURVEY_EXPIRY_HOURS * 60 * 60 * 1000).toISOString();
      const { error: updateError } = await admin
        .from("students")
        .upsert({ id: studentId, survey_token: token, survey_token_expiry: newExpiry }, { onConflict: "id" });

      if (updateError) {
        console.error("ensureSurveyTokenAction upsert error:", updateError);
        return { ok: false, error: "설문 링크를 생성하지 못했습니다." };
      }
    }

    const link = buildSurveyLink(studentId, token!, true);
    return { ok: true, link };
  } catch (error) {
    const message = error instanceof Error ? error.message : "설문 링크를 생성하지 못했습니다.";
    console.error("ensureSurveyTokenAction error:", error);
    return { ok: false, error: message };
  }
}
