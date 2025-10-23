import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabaseAdmin";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const studentId = url.searchParams.get("student_id");
  const token = url.searchParams.get("token");

  if (!studentId || !token) {
    return NextResponse.json({ error: "Missing student_id or token." }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: student, error: studentError } = await admin
    .from("students")
    .select("id, student_name, parent_email, survey_token, survey_token_expiry, survey_completed")
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

  const { data: existingSurvey } = await admin
    .from("parent_surveys")
    .select("data, completed_by, created_at")
    .eq("student_id", studentId)
    .maybeSingle();

  return NextResponse.json({
    student: {
      id: student.id,
      name: student.student_name,
      parentEmail: student.parent_email,
      surveyCompleted: student.survey_completed,
    },
    existingSurvey,
  });
}
