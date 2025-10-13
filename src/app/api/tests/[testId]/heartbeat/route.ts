import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

import { Database } from "@/lib/database.types";
import { finalizeTest } from "@/lib/tests/finalize";

type RouteParams = Record<string, string | string[] | undefined>;

export async function POST(
  req: Request,
  context: { params: Promise<RouteParams> }
) {
  const params = await context.params;
  const rawTestId = params?.testId;
  const testId = Array.isArray(rawTestId) ? rawTestId[0] : rawTestId;
  if (typeof testId !== "string" || testId.length === 0) {
    return NextResponse.json({ error: "Invalid test id" }, { status: 400 });
  }

  const { elapsedMs } = await req.json();

  if (typeof elapsedMs !== "number" || elapsedMs < 0) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
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
    .select("student_id, time_limit_seconds, elapsed_ms")
    .eq("id", testId)
    .maybeSingle<
      Pick<
        Database["public"]["Tables"]["tests"]["Row"],
        "student_id" | "time_limit_seconds" | "elapsed_ms"
      >
    >();

  if (error || !test) {
    return NextResponse.json({ error: "Test not found" }, { status: 404 });
  }

  if (test.student_id !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const limitMs = (test.time_limit_seconds ?? 3000) * 1000;
  const newElapsed = Math.min(limitMs, (test.elapsed_ms ?? 0) + elapsedMs);

  const updateResult = await supabase
    .from("tests")
    .update({ elapsed_ms: newElapsed, last_seen_at: new Date().toISOString() } as never)
    .eq("id", testId);

  if (updateResult.error) {
    console.error("heartbeat route: failed", updateResult.error);
    return NextResponse.json({ error: "Unable to update timer" }, { status: 500 });
  }

  const timeRemainingSeconds = Math.max(0, Math.floor((limitMs - newElapsed) / 1000));

  if (newElapsed >= limitMs) {
    const summary = await finalizeTest(supabase, testId);
    return NextResponse.json({ timeRemainingSeconds: 0, expired: true, summary });
  }

  return NextResponse.json({ timeRemainingSeconds, expired: false });
}
