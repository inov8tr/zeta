import type { Metadata } from "next";
import ForgotPasswordForm from "@/components/auth/ForgotPasswordForm";
import { buildBasicMetadata } from "@/lib/seo";

export const metadata: Metadata = buildBasicMetadata({
  path: "/auth/forgot-password",
  title: "Forgot Password | Zeta English Academy",
  description: "Send yourself a password reset email to regain access to your account.",
  robots: {
    index: false,
    follow: false,
  },
});

const ForgotPasswordPage = () => {
  return (
    <main className="bg-white pb-24 pt-28">
      <div className="mx-auto max-w-xl px-6">
        <h1 className="text-3xl font-extrabold text-neutral-900">Reset your password</h1>
        <p className="mt-3 text-sm text-neutral-600">
          Enter the email associated with your account and we&apos;ll send a reset link.
        </p>
        <div className="mt-8 rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
          <ForgotPasswordForm />
        </div>
      </div>
    </main>
  );
};

export default ForgotPasswordPage;
