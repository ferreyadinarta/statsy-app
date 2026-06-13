import { ImageResponse } from "next/og";
import { getPost } from "@/lib/blog";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPost(slug);
  const title = post?.title ?? "Statsy Blog";
  const description = post?.description ?? "Status pages and uptime monitoring for developers.";
  const tag = post?.tags?.[0] ?? "blog";

  const services = [
    { name: "Website", status: "Operational", color: "#22c55e", textColor: "#16a34a" },
    { name: "API", status: "Operational", color: "#22c55e", textColor: "#16a34a" },
    { name: "Database", status: "Degraded", color: "#f59e0b", textColor: "#d97706" },
    { name: "Email", status: "Operational", color: "#22c55e", textColor: "#16a34a" },
  ];

  return new ImageResponse(
    (
      <div
        style={{
          background: "#f5f2eb",
          width: "100%",
          height: "100%",
          display: "flex",
          padding: "60px 64px",
          gap: "56px",
          alignItems: "center",
        }}
      >
        {/* Left: text */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            flex: 1,
            height: "100%",
          }}
        >
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 8,
                background: "#e8500a",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div style={{ width: 9, height: 9, borderRadius: "50%", background: "#f5f2eb" }} />
            </div>
            <span style={{ fontSize: 22, fontWeight: 900, color: "#1a1714", letterSpacing: "-0.03em" }}>
              Statsy
            </span>
          </div>

          {/* Tag + Title + Description */}
          <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
            <div style={{ display: "flex" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  background: "#ede9e0",
                  borderRadius: 4,
                  padding: "5px 12px",
                }}
              >
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#e8500a" }} />
                <span style={{ fontSize: 12, fontWeight: 700, color: "#5a5248", letterSpacing: "0.07em" }}>
                  {tag.replace(/-/g, " ").toUpperCase()}
                </span>
              </div>
            </div>

            <div
              style={{
                fontSize: title.length > 45 ? 48 : 58,
                fontWeight: 900,
                color: "#1a1714",
                lineHeight: 1.08,
                letterSpacing: "-0.03em",
              }}
            >
              {title}
            </div>

            <div style={{ fontSize: 19, color: "#5a5248", lineHeight: 1.5 }}>
              {description.length > 110 ? description.slice(0, 110) + "…" : description}
            </div>
          </div>

          {/* URL */}
          <div style={{ display: "flex" }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#e8500a", letterSpacing: "0.08em" }}>
              STATSY.PAGE
            </span>
          </div>
        </div>

        {/* Right: status page mockup */}
        <div
          style={{
            width: 400,
            background: "#ffffff",
            borderRadius: 14,
            padding: "28px",
            boxShadow: "0 8px 40px rgba(0,0,0,0.12)",
            display: "flex",
            flexDirection: "column",
            gap: "14px",
          }}
        >
          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 15, fontWeight: 800, color: "#1a1714" }}>YourSite</span>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                background: "#f0fdf4",
                borderRadius: 20,
                padding: "4px 10px",
              }}
            >
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e" }} />
              <span style={{ fontSize: 10, fontWeight: 600, color: "#16a34a" }}>All systems operational</span>
            </div>
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: "#f0ece4", display: "flex" }} />

          {/* Services */}
          {services.map((s) => (
            <div key={s.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 13, color: "#3d3830" }}>{s.name}</span>
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: s.color }} />
                <span style={{ fontSize: 12, fontWeight: 500, color: s.textColor }}>{s.status}</span>
              </div>
            </div>
          ))}

          {/* Divider */}
          <div style={{ height: 1, background: "#f0ece4", display: "flex" }} />

          {/* Uptime bar */}
          <div style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
            <div style={{ display: "flex", gap: 3 }}>
              {Array.from({ length: 32 }).map((_, i) => (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    height: 8,
                    borderRadius: 2,
                    background: i === 7 || i === 21 ? "#e8500a" : "#22c55e",
                  }}
                />
              ))}
            </div>
            <span style={{ fontSize: 11, color: "#8a8070" }}>90-day uptime — 99.4% · 13 days without incident</span>
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
