import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const cookieLang = request.cookies.get("lang")?.value;
  const acceptLanguage = request.headers.get("accept-language");
  const language = cookieLang || acceptLanguage?.split(",")[0]?.slice(0, 2) || "en";

  // ✅ Ensure `/` redirects to `/en/`
  if (pathname === "/") {
    return NextResponse.redirect(new URL(`/${language}/`, request.url));
  }

  // ✅ Ensure paths without a language prefix are redirected
  if (!["en", "ko"].includes(pathname.split("/")[1])) {
    return NextResponse.redirect(new URL(`/${language}${pathname}`, request.url));
  }

  const response = NextResponse.next();
  response.cookies.set("lang", language, { path: "/" }); // ✅ Store language in cookies
  return response;
}

export const config = {
  matcher: "/((?!_next|_vercel|api|.*\\..*).*)", // ✅ Apply middleware to all routes
};
