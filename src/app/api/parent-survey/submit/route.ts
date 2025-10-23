import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabaseAdmin";

type SubmitBody = {
  studentId: string;
  token: string;
  formData: unknown;
  completedBy?: "parent" | "admin";
};

export async function POST(request: NextRequest) {
  const admin = createAdminClient();
  let payload: SubmitBody;

  try {
    payload = (await request.json()) as SubmitBody;
  } catch {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }

  const { studentId, token, formData, completedBy = "parent" } = payload;

  if (!studentId || !token || !formData) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }

  const { data: student, error: studentError } = await admin
    .from("students")
    .select("id, survey_token, survey_token_expiry")
    .eq("id", studentId)
    .maybeSingle();

  if (studentError || !student) {
    return NextResponse.json({ error: "Student not found." }, { status: 404 });
  }

  if (student.survey_token !== token) {
    return NextResponse.json({ error: "Invalid survey token." }, { status: 401 });
  }

  if (student.survey_token_expiry && new Date(student.survey_token_expiry) < new Date()) {
    return NextResponse.json({ error: "Survey link has expired." }, { status: 410 });
  }

  const nowIso = new Date().toISOString();

  const { error: upsertError } = await admin
    .from("parent_surveys")
    .upsert(
      {
        student_id: studentId,
        completed_by: completedBy,
        data: formData,
        created_at: nowIso,
      },
      { onConflict: "student_id" },
    );

  if (upsertError) {
    return NextResponse.json({ error: "Failed to save survey." }, { status: 500 });
  }

  const { error: updateError } = await admin
    .from("students")
    .update({
      survey_completed: true,
      survey_token: null,
      survey_token_expiry: null,
      updated_at: nowIso,
    })
    .eq("id", studentId);

  if (updateError) {
    return NextResponse.json({ error: "Failed to update student status." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
