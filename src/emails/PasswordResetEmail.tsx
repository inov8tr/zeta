import * as React from "react";

type PasswordResetEmailProps = {
  resetLink: string;
  userName?: string | null;
};

export const PasswordResetEmail = ({ resetLink, userName }: PasswordResetEmailProps) => {
  const safeLink = resetLink.replace(/^["']+|["']+$/g, "").trim();
  const greetingName = userName?.trim();

  return (
    <div style={{ fontFamily: "Arial, sans-serif", color: "#111827", lineHeight: 1.6 }}>
      <h2 style={{ fontSize: "20px", margin: "0 0 16px" }}>Reset your password for Zeta English</h2>
      <p style={{ margin: "0 0 12px" }}>
        {greetingName ? `Hi ${greetingName},` : "Hi there,"} we received a request to reset the password for your Zeta
        English account.
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
        Reset my password
      </a>
      <p style={{ marginTop: "18px", fontSize: "13px", color: "#4b5563" }}>
        If the button above does not work, copy and paste this URL into your browser:
      </p>
      <p style={{ marginTop: "8px", fontSize: "12px", color: "#2563eb", wordBreak: "break-all" }}>{safeLink}</p>
      <p style={{ marginTop: "16px", fontSize: "12px", color: "#6b7280" }}>
        If you did not ask for a new password, you can safely ignore this email.
      </p>
      <p style={{ marginTop: "16px", fontSize: "12px", color: "#6b7280" }}>
        Thank you,
        <br />
        Zeta English
      </p>
    </div>
  );
};

