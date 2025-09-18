import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { normalizeLanguage } from "@/lib/i18n";

export default async function RootPage() {
  const cookieStore = await cookies();
  const rawCookieLang = cookieStore.get("lang")?.value;
  if (rawCookieLang) {
    redirect(`/${normalizeLanguage(rawCookieLang)}`);
  }

  const headerStore = await headers();
  const acceptLanguage = headerStore.get("accept-language")?.split(",")[0];
  const fallbackLang = normalizeLanguage(acceptLanguage);

  redirect(`/${fallbackLang}`);
}
