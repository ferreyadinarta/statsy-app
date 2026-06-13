import { ImageResponse } from "next/og";
import { getPost } from "@/lib/blog";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Load a Google Font as TTF (old UA forces ttf, not woff2 which satori can't parse).
async function loadGoogle(family: string, weight: number): Promise<ArrayBuffer | null> {
  try {
    const css = await fetch(
      `https://fonts.googleapis.com/css2?family=${family}:wght@${weight}`,
      { headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; rv:10.0) Gecko/20100101 Firefox/10.0" } }
    ).then((r) => r.text());
    const match = css.match(/src:\s*url\((https:\/\/[^)]+?)\)\s*format\(['"](?:truetype|opentype|woff)['"]\)/);
    if (!match) return null;
    return await fetch(match[1]).then((r) => r.arrayBuffer());
  } catch {
    return null;
  }
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPost(slug);
  const title = (post?.title ?? "Statsy Blog").replace(/\s+/g, " ").trim();
  const description = post?.description ?? "Status pages and uptime monitoring for developers.";
  const tag = post?.tags?.[0] ?? "blog";

  // Schibsted Grotesk (heavy, close to brand's Cabinet Grotesk) for headings,
  // Instrument Sans (brand body) for everything else.
  const [head800, inst400] = await Promise.all([
    loadGoogle("Schibsted+Grotesk", 800),
    loadGoogle("Instrument+Sans", 400),
  ]);

  const fonts: { name: string; data: ArrayBuffer; weight: 400 | 800; style: "normal" }[] = [];
  if (head800) fonts.push({ name: "Head", data: head800, weight: 800, style: "normal" });
  if (inst400) fonts.push({ name: "Instrument", data: inst400, weight: 400, style: "normal" });

  const head = head800 ? "Head" : "sans-serif";
  const body = inst400 ? "Instrument" : "sans-serif";

  const services = [
    { name: "Website", status: "Operational", dot: "#16a34a", text: "#16a34a" },
    { name: "API", status: "Operational", dot: "#16a34a", text: "#16a34a" },
    { name: "Database", status: "Degraded", dot: "#f59e0b", text: "#d97706" },
    { name: "Email", status: "Operational", dot: "#16a34a", text: "#16a34a" },
  ];

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "#f5f2eb",
          backgroundImage:
            "radial-gradient(circle at 0% 0%, rgba(232,80,10,0.06), transparent 45%), radial-gradient(circle at 100% 100%, rgba(232,80,10,0.05), transparent 40%)",
          padding: "58px 64px",
          gap: "52px",
          alignItems: "center",
          fontFamily: body,
        }}
      >
        {/* Left column */}
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
          <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 9,
                background: "#1a1714",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#e8500a" }} />
            </div>
            <span style={{ fontFamily: head, fontSize: 25, fontWeight: 900, color: "#1a1714", letterSpacing: "-0.03em" }}>
              Statsy
            </span>
          </div>

          {/* Tag + title + description */}
          <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
            <div style={{ display: "flex" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                  background: "#1a1714",
                  borderRadius: 6,
                  padding: "7px 14px",
                }}
              >
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#e8500a" }} />
                <span style={{ fontFamily: head, fontSize: 12, fontWeight: 700, color: "#f5f2eb", letterSpacing: "0.1em" }}>
                  {tag.replace(/-/g, " ").toUpperCase()}
                </span>
              </div>
            </div>

            <div
              style={{
                fontFamily: head,
                fontSize: title.length > 44 ? 52 : 62,
                fontWeight: 900,
                color: "#1a1714",
                lineHeight: 1.04,
                letterSpacing: "-0.035em",
              }}
            >
              {title}
            </div>

            <div style={{ fontFamily: body, fontSize: 21, color: "#5a5248", lineHeight: 1.45, maxWidth: 540 }}>
              {description.length > 105 ? description.slice(0, 105).trimEnd() + "…" : description}
            </div>
          </div>

          {/* Footer */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontFamily: head, fontSize: 15, fontWeight: 700, color: "#e8500a", letterSpacing: "0.06em" }}>
              STATSY.PAGE
            </span>
            <div style={{ width: 4, height: 4, borderRadius: "50%", background: "#c4bdb0" }} />
            <span style={{ fontFamily: body, fontSize: 15, color: "#8a8070" }}>Free status pages</span>
          </div>
        </div>

        {/* Right: browser-chrome status mockup */}
        <div
          style={{
            width: 432,
            background: "#ffffff",
            borderRadius: 16,
            border: "1px solid #e9e3d8",
            boxShadow: "0 24px 60px rgba(26,23,20,0.16)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          {/* Browser bar */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "13px 16px",
              background: "#f7f4ee",
              borderBottom: "1px solid #ece6da",
            }}
          >
            <div style={{ display: "flex", gap: 6 }}>
              <div style={{ width: 9, height: 9, borderRadius: "50%", background: "#ec6a5e" }} />
              <div style={{ width: 9, height: 9, borderRadius: "50%", background: "#f4bf4f" }} />
              <div style={{ width: 9, height: 9, borderRadius: "50%", background: "#61c554" }} />
            </div>
            <div
              style={{
                flex: 1,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                background: "#ffffff",
                border: "1px solid #ece6da",
                borderRadius: 6,
                padding: "5px 0",
                marginLeft: 4,
              }}
            >
              <span style={{ fontFamily: body, fontSize: 12, color: "#8a8070" }}>status.yoursite.com</span>
            </div>
          </div>

          {/* Card body */}
          <div style={{ display: "flex", flexDirection: "column", gap: 15, padding: "24px 26px 26px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontFamily: head, fontSize: 17, fontWeight: 700, color: "#1a1714" }}>YourSite</span>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  background: "#f0fdf4",
                  borderRadius: 20,
                  padding: "5px 11px",
                }}
              >
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e" }} />
                <span style={{ fontFamily: body, fontSize: 11, fontWeight: 400, color: "#16a34a" }}>
                  All systems operational
                </span>
              </div>
            </div>

            <div style={{ height: 1, background: "#f0ece4", display: "flex" }} />

            {services.map((s) => (
              <div key={s.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontFamily: body, fontSize: 14, color: "#3d3830" }}>{s.name}</span>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: s.dot }} />
                  <span style={{ fontFamily: body, fontSize: 13, color: s.text }}>{s.status}</span>
                </div>
              </div>
            ))}

            <div style={{ height: 1, background: "#f0ece4", display: "flex" }} />

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ display: "flex", gap: 3 }}>
                {Array.from({ length: 34 }).map((_, i) => (
                  <div
                    key={i}
                    style={{
                      flex: 1,
                      height: 26,
                      borderRadius: 2,
                      background: i === 9 || i === 23 ? "#e8500a" : "#22c55e",
                    }}
                  />
                ))}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontFamily: body, fontSize: 11, color: "#8a8070" }}>90-day uptime</span>
                <span style={{ fontFamily: body, fontSize: 11, color: "#8a8070" }}>99.4% · 13 days without incident</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
    { ...size, fonts: fonts.length ? fonts : undefined }
  );
}
