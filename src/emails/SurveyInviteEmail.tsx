import * as React from "react";

type SurveyInviteEmailProps = {
  studentName: string;
  surveyLink: string;
};

export const SurveyInviteEmail = ({ studentName, surveyLink }: SurveyInviteEmailProps) => {
  const safeLink = surveyLink.replace(/^\s+|\s+$/g, "").replace(/^["']+|["']+$/g, "");

  return (
    <div style={{ fontFamily: "Arial, sans-serif", color: "#111827", lineHeight: 1.5 }}>
      <h2 style={{ fontSize: "20px", margin: "0 0 16px" }}>Hello from Zeta English!</h2>
      <p style={{ margin: "0 0 12px" }}>
        We look forward to meeting <strong>{studentName}</strong> at their upcoming interview. Please complete this short
        parent survey to help us prepare.
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
        Complete Parent Survey
      </a>
      <p style={{ marginTop: "20px", fontSize: "13px", color: "#6b7280" }}>
        This link will expire in 3 days for your privacy and data security.
      </p>
      <p style={{ marginTop: "16px", fontSize: "12px", color: "#6b7280", wordBreak: "break-all" }}>
        Survey link: <span style={{ color: "#2563eb" }}>{safeLink}</span>
      </p>
    </div>
  );
};
