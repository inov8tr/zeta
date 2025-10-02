import { ImageResponse } from "next/og";
import { SITE_URL } from "@/lib/seo";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default function OpengraphImage() {
  const gradientColors = ["#0f172a", "#1e40af", "#38bdf8"];

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "80px",
          background: `linear-gradient(135deg, ${gradientColors.join(", ")})`,
          color: "white",
          fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
        }}
      >
        <div style={{ fontSize: 72, fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1.1 }}>
          Zeta English Academy
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div style={{ maxWidth: "60%", fontSize: 34, lineHeight: 1.3, opacity: 0.92 }}>
            Guiding K-12 learners through joyful English experiences that build confidence and future-ready skills.
          </div>
          <div style={{ fontSize: 24, fontWeight: 600 }}>{SITE_URL.replace(/^https?:\/\//, "")}</div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
