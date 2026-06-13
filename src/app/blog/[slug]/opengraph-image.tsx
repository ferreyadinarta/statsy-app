import { ImageResponse } from "next/og";
import { getPost } from "@/lib/blog";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: { slug: string } }) {
  const post = await getPost(params.slug);
  const title = post?.title ?? "Statsy Blog";
  const description = post?.description ?? "Status pages and uptime monitoring for developers.";

  return new ImageResponse(
    (
      <div
        style={{
          background: "#f5f2eb",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
        }}
      >
        {/* Top: Statsy brand */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              width: 12,
              height: 12,
              borderRadius: "50%",
              background: "#e8500a",
            }}
          />
          <span
            style={{
              fontSize: 22,
              fontWeight: 900,
              color: "#1a1714",
              letterSpacing: "-0.03em",
            }}
          >
            Statsy
          </span>
          <span
            style={{
              fontSize: 22,
              color: "#c4bdb0",
              marginLeft: 4,
            }}
          >
            · Blog
          </span>
        </div>

        {/* Middle: title + description */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px", maxWidth: 960 }}>
          <div
            style={{
              fontSize: title.length > 50 ? 56 : 64,
              fontWeight: 900,
              color: "#1a1714",
              lineHeight: 1.1,
              letterSpacing: "-0.03em",
            }}
          >
            {title}
          </div>
          <div
            style={{
              fontSize: 24,
              color: "#5a5248",
              lineHeight: 1.5,
              maxWidth: 880,
            }}
          >
            {description.length > 120 ? description.slice(0, 120) + "…" : description}
          </div>
        </div>

        {/* Bottom: URL + orange bar */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 18, color: "#8a8070" }}>statsy.page/blog</span>
          <div
            style={{
              background: "#e8500a",
              borderRadius: 6,
              padding: "8px 20px",
              fontSize: 16,
              fontWeight: 700,
              color: "#ffffff",
            }}
          >
            Free status pages with uptime monitoring
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
