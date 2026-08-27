import { ImageResponse } from "@vercel/og";
import type { VercelRequest } from "@vercel/node";

export const config = {
  runtime: "edge",
};

export default function handler(req: VercelRequest) {
  const url = new URL(req.url || "", "https://small-steps-seven.vercel.app");
  const title = url.searchParams.get("title") || "Small Steps — small steps back to life";
  const tag = url.searchParams.get("tag") || "Journal";
  const description = url.searchParams.get("description") || "A gentle journal for people recovering from burnout. No streaks, no guilt.";

  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "56px 64px",
          background: "#fdfcf8",
          color: "#2c2925",
          fontFamily: "Fraunces, Georgia, serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 20, color: "#6f675b" }}>
          <span style={{ fontSize: 22 }}>🌱</span> Small Steps
          <span style={{ marginLeft: 12, padding: "4px 10px", borderRadius: 999, background: "#eef4eb", color: "#5e775f", fontSize: 13, fontWeight: 600 }}>{tag}</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ fontSize: 52, fontWeight: 700, lineHeight: 1.1, maxWidth: 980 }}>{title}</div>
          <div style={{ fontSize: 20, color: "#6f675b", maxWidth: 900, lineHeight: 1.5 }}>{description.slice(0, 140)}</div>
        </div>
        <div style={{ fontSize: 14, color: "#9a9590" }}>small-steps-seven.vercel.app — one small step a day</div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
