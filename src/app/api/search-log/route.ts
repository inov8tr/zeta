import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const payload = await request.json();

    if (typeof payload.query !== "string" || !payload.query.trim()) {
      return NextResponse.json({ ok: false, error: "Invalid query" }, { status: 400 });
    }

    const entry = {
      query: payload.query.trim(),
      results: typeof payload.results === "number" ? payload.results : undefined,
      lng: typeof payload.lng === "string" ? payload.lng : undefined,
      timestamp: payload.timestamp ?? new Date().toISOString(),
    };

    console.info("[search-log]", entry);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[search-log] failed", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
