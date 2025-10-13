import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

import { Database } from "@/lib/database.types";
import { finalizeTest } from "@/lib/tests/finalize";

type RouteParams = Record<string, string | string[] | undefined>;

export async function POST(
  _req: NextRequest,
  context: { params: Promise<RouteParams> }
) {
  const params = await context.params;
  const rawTestId = params?.testId;
  const testId = Array.isArray(rawTestId) ? rawTestId[0] : rawTestId;

  if (typeof testId !== "string" || testId.length === 0) {
    return NextResponse.json({ error: "Invalid test id" }, { status: 400 });
  }

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
    .eq("id", testId)
    .maybeSingle<Pick<Database["public"]["Tables"]["tests"]["Row"], "student_id">>();

  if (error || !test) {
    return NextResponse.json({ error: "Test not found" }, { status: 404 });
  }

  if (test.student_id !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const summary = await finalizeTest(supabase, testId);
    return NextResponse.json({ finalized: true, summary });
  } catch (finalizeError) {
    console.error("finalize route: failed", finalizeError);
    return NextResponse.json({ error: "Unable to finalize test" }, { status: 500 });
  }
}
