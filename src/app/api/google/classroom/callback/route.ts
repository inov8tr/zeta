import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

import { Database } from "@/lib/database.types";
import { exchangeCodeForTokens } from "@/lib/google/oauth";
import { upsertGoogleToken } from "@/lib/google/tokenStore";

const STATE_COOKIE = "gc_oauth_state";

const decodeState = (raw: string | undefined) => {
  if (!raw) {
    return null;
  }
  try {
    const decoded = Buffer.from(raw, "base64url").toString("utf8");
    const parsed = JSON.parse(decoded) as { state: string; redirect: string };
    if (parsed && typeof parsed.state === "string" && typeof parsed.redirect === "string") {
      return parsed;
    }
  } catch (error) {
    console.error("Google Classroom callback: failed to decode state", error);
  }
  return null;
};

const sanitizeRedirect = (value: string | undefined, origin: string) => {
  if (!value) {
    return new URL("/student/classes", origin);
  }
  if (!value.startsWith("/") || value.startsWith("//")) {
    return new URL("/student/classes", origin);
  }
  return new URL(value, origin);
};

export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createRouteHandlerClient<Database>({
    cookies: () => cookieStore as unknown as ReturnType<typeof cookies>,
  });
  const stateCookie = cookieStore.get(STATE_COOKIE);
  const storedState = decodeState(stateCookie?.value);
  const url = new URL(request.url);
  const incomingState = url.searchParams.get("state") ?? "";
  const errorParam = url.searchParams.get("error");
  const origin = request.nextUrl.origin;

  const targetUrl = sanitizeRedirect(storedState?.redirect, origin);

  const redirectWithMessage = (message: string, type: "error" | "success") => {
    if (stateCookie) {
      cookieStore.set({
        name: STATE_COOKIE,
        value: "",
        path: "/",
        maxAge: 0,
      });
    }
    targetUrl.searchParams.set(type, message);
    return NextResponse.redirect(targetUrl);
  };

  if (errorParam) {
    return redirectWithMessage("Google authorization was cancelled.", "error");
  }

  if (!storedState || !incomingState || storedState.state !== incomingState) {
    return redirectWithMessage("Google authorization state mismatch. Please try again.", "error");
  }

  const code = url.searchParams.get("code");
  if (!code) {
    return redirectWithMessage("Google authorization code missing.", "error");
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return redirectWithMessage("You must be signed in to connect Google Classroom.", "error");
  }

  try {
    const tokenResponse = await exchangeCodeForTokens(code);
    await upsertGoogleToken(supabase, session.user.id, {
      access_token: tokenResponse.access_token,
      expires_in: tokenResponse.expires_in,
      scope: tokenResponse.scope,
      token_type: tokenResponse.token_type,
      refresh_token: tokenResponse.refresh_token,
    });
  } catch (error) {
    console.error("Google Classroom callback: token exchange failed", error);
    return redirectWithMessage("We couldn’t connect to Google Classroom. Please try again.", "error");
  }

  if (stateCookie) {
    cookieStore.set({
      name: STATE_COOKIE,
      value: "",
      path: "/",
      maxAge: 0,
    });
  }

  targetUrl.searchParams.set("success", "Google Classroom connected.");
  return NextResponse.redirect(targetUrl);
}
