import * as React from "react";

type SurveyInviteEmailProps = {
  studentName: string;
  surveyLink: string;
};

export const SurveyInviteEmail = ({ studentName, surveyLink }: SurveyInviteEmailProps) => {
  const safeLink = surveyLink.replace(/^\s+|\s+$/g, "").replace(/^["']+|["']+$/g, "");

  return (
    <div style={{ fontFamily: "Arial, sans-serif", color: "#111827", lineHeight: 1.5 }}>
      <h2 style={{ fontSize: "20px", margin: "0 0 16px" }}>제타영어에서 안내드립니다</h2>
      <p style={{ margin: "0 0 12px" }}>
        안녕하세요. <strong>{studentName}</strong> 학생의 상담 및 레벨 테스트 준비를 위해 학부모 설문을 부탁드립니다.
        아래 버튼을 눌러 설문지를 작성해 주시면 학생에 맞춘 맞춤형 상담을 도와드릴 수 있습니다.
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
        학부모 설문 작성하기
      </a>
      <p style={{ marginTop: "20px", fontSize: "13px", color: "#6b7280" }}>
        링크는 개인정보 보호를 위해 3일 동안만 유효합니다. 기간이 만료되면 다시 요청해 주세요.
      </p>
      <p style={{ marginTop: "16px", fontSize: "12px", color: "#6b7280", wordBreak: "break-all" }}>
        설문 링크: <span style={{ color: "#2563eb" }}>{safeLink}</span>
      </p>
      <p style={{ marginTop: "12px", fontSize: "12px", color: "#6b7280" }}>
        감사합니다. 제타영어 드림
      </p>
    </div>
  );
};
