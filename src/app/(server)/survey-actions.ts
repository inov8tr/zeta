"use server";

import { revalidatePath } from "next/cache";
import { sendSurveyInvite } from "@/lib/resend/sendSurveyInvite";

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
