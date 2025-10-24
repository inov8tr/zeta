import * as React from "react";

type SignupConfirmationEmailProps = {
  confirmLink: string;
  userName?: string | null;
};

export const SignupConfirmationEmail = ({ confirmLink, userName }: SignupConfirmationEmailProps) => {
  const safeLink = confirmLink.replace(/^\s+|\s+$/g, "").replace(/^["']+|["']+$/g, "");
  const greetingName = userName?.trim();

  return (
    <div style={{ fontFamily: "Arial, sans-serif", color: "#111827", lineHeight: 1.6 }}>
      <h2 style={{ fontSize: "20px", margin: "0 0 16px" }}>Verify your email with Zeta English</h2>
      <p style={{ margin: "0 0 12px" }}>
        {greetingName ? `Hi ${greetingName},` : "Hi there,"} thanks for creating an account with Zeta English.
        Please confirm your email address to finish setting up your account.
      </p>
      <a
        href={safeLink}
        style={{
          backgroundColor: "#2563eb",
          color: "#ffffff",
          padding: "10px 18px",
          borderRadius: "6px",
          textDecoration: "none",
          display: "inline-block",
          marginTop: "16px",
        }}
      >
        Confirm my email
      </a>
      <p style={{ marginTop: "18px", fontSize: "13px", color: "#4b5563" }}>
        If the button above does not work, copy and paste this URL into your browser:
      </p>
      <p style={{ marginTop: "8px", fontSize: "12px", color: "#2563eb", wordBreak: "break-all" }}>{safeLink}</p>
      <p style={{ marginTop: "16px", fontSize: "12px", color: "#6b7280" }}>
        This verification link will expire after a short period for your security. If it expires, you can request a new
        one from the login page.
      </p>
      <p style={{ marginTop: "16px", fontSize: "12px", color: "#6b7280" }}>
        Thank you,<br />
        Zeta English
      </p>
    </div>
  );
};
