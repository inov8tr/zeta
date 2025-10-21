import { NextRequest, NextResponse } from "next/server";
import { normalizeLanguage, SUPPORTED_LANGUAGES } from "@/lib/i18n";
import { SITE_URL } from "@/lib/seo";

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // Enforce canonical host in production
  try {
    const canonicalHostname = new URL(SITE_URL).hostname;
    const requestHostname = request.nextUrl.hostname;
    if (
      process.env.NODE_ENV === "production" &&
      requestHostname &&
      canonicalHostname &&
      requestHostname !== canonicalHostname &&
      requestHostname !== "localhost"
    ) {
      const url = new URL(`${pathname}${search}`, SITE_URL);
      return NextResponse.redirect(url, 308);
    }
  } catch {
    // ignore malformed SITE_URL
  }
  const cookieLang = request.cookies.get("lang")?.value;
  const acceptLanguage = request.headers.get("accept-language")?.split(",")[0];
  const language = normalizeLanguage(cookieLang ?? acceptLanguage ?? "en");

  if (pathname === "/") {
    return NextResponse.redirect(new URL(`/${language}/`, request.url));
  }

  const firstSegment = pathname.split("/")[1];
  const rootExempt = new Set(["admin", "login", "teacher", "student", "parent"]);
  if (firstSegment && rootExempt.has(firstSegment)) {
    const response = NextResponse.next();
    response.cookies.set("lang", language, { path: "/" });
    return response;
  }

  const [, maybeLang] = pathname.split("/");
  if (!SUPPORTED_LANGUAGES.includes((maybeLang ?? "") as (typeof SUPPORTED_LANGUAGES)[number])) {
    return NextResponse.redirect(new URL(`/${language}${pathname}`, request.url));
  }

  const response = NextResponse.next();
  response.cookies.set("lang", language, { path: "/" });
  return response;
}

export const config = {
  matcher: "/((?!_next|_vercel|api|.*\\..*).*)",
};
