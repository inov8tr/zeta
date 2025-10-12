import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

import { Database } from "@/lib/database.types";
import { finalizeTest } from "@/lib/tests/finalize";

export async function POST(_req: Request, { params }: { params: { testId: string } }) {
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: test, error } = await supabase
    .from("tests")
    .select("student_id")
    .eq("id", params.testId)
    .maybeSingle();

  if (error || !test) {
    return NextResponse.json({ error: "Test not found" }, { status: 404 });
  }

  if (test.student_id !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const summary = await finalizeTest(supabase, params.testId);
    return NextResponse.json({ finalized: true, summary });
  } catch (finalizeError) {
    console.error("finalize route: failed", finalizeError);
    return NextResponse.json({ error: "Unable to finalize test" }, { status: 500 });
  }
}
