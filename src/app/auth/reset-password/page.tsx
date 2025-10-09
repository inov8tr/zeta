import type { Metadata } from "next";
import ResetPasswordForm from "@/components/auth/ResetPasswordForm";
import { buildBasicMetadata } from "@/lib/seo";

export const metadata: Metadata = buildBasicMetadata({
  path: "/auth/reset-password",
  title: "Update Password | Zeta English Academy",
  description: "Choose a new password to regain access to your account.",
  robots: {
    index: false,
    follow: false,
  },
});

const ResetPasswordPage = () => {
  return (
    <main className="bg-white pb-24 pt-28">
      <div className="mx-auto max-w-xl px-6">
        <h1 className="text-3xl font-extrabold text-neutral-900">Choose a new password</h1>
        <p className="mt-3 text-sm text-neutral-600">
          Enter and confirm your new password below. Once saved, you can sign in again.
        </p>
        <div className="mt-8 rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
          <ResetPasswordForm />
        </div>
      </div>
    </main>
  );
};

export default ResetPasswordPage;
