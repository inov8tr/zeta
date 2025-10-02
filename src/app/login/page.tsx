import { cookies, headers } from "next/headers";
import LoginForm from "@/components/auth/LoginForm";
import { getDictionaries, normalizeLanguage, type SupportedLanguage } from "@/lib/i18n";
import { buildBasicMetadata } from "@/lib/seo";

async function resolveLanguage(): Promise<SupportedLanguage> {
  const cookieStore = await cookies();
  const headerStore = await headers();
  const cookieLang = cookieStore.get("lang")?.value;
  const acceptLanguage = headerStore.get("accept-language")?.split(",")[0];
  return normalizeLanguage(cookieLang ?? acceptLanguage ?? "en");
}

export async function generateMetadata() {
  const lng = await resolveLanguage();
  const { login } = getDictionaries(lng);
  return buildBasicMetadata({
    path: "/login",
    title: login.title,
    description: login.description,
    robots: {
      index: false,
      follow: false,
    },
  });
}

const LoginPage = async ({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) => {
  const lng = await resolveLanguage();
  const { login } = getDictionaries(lng);
  const { error } = await searchParams;
  const initialError = error === "role" ? login.errorRole : error === "oauth" ? login.errorGeneric : null;

  return (
    <main className="bg-white pb-32 pt-28">
      <div className="mx-auto max-w-3xl px-6">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold text-neutral-900">{login.title}</h1>
          <p className="mt-4 text-base text-neutral-600">{login.description}</p>
        </div>

        <div className="mt-12">
          <LoginForm dictionary={login} initialError={initialError} />
        </div>
      </div>
    </main>
  );
};

export default LoginPage;
