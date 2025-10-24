import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

import { Database } from "@/lib/database.types";
import { buildClassroomConnectUrl } from "@/lib/google/oauth";

const STATE_COOKIE = "gc_oauth_state";
const STATE_TTL_SECONDS = 600;

const sanitizeRedirect = (value: string | null) => {
  if (!value) {
    return "/student/classes";
  }
  if (!value.startsWith("/") || value.startsWith("//")) {
    return "/student/classes";
  }
  return value;
};

const encodeStatePayload = (payload: { state: string; redirect: string }) =>
  Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");

export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createRouteHandlerClient<Database>({
    cookies: () => cookieStore as unknown as ReturnType<typeof cookies>,
  });
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const url = new URL(request.url);
  const redirectParam = sanitizeRedirect(url.searchParams.get("redirect"));

  if (!session) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", redirectParam);
    return NextResponse.redirect(loginUrl);
  }

  const state = crypto.randomUUID();
  const encoded = encodeStatePayload({ state, redirect: redirectParam });
  cookieStore.set({
    name: STATE_COOKIE,
    value: encoded,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: STATE_TTL_SECONDS,
  });

  const authUrl = buildClassroomConnectUrl(state);
  return NextResponse.redirect(authUrl);
}
