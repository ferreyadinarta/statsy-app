import { ImageResponse } from "next/og";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const alt = "Status Page";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

type Props = { params: Promise<{ slug: string }> };

export default async function OGImage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: page } = await supabase
    .from("status_pages")
    .select("name")
    .eq("slug", slug)
    .single();

  const name = page?.name ?? slug;

  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          background: "#1a1714",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "space-between",
          padding: "80px",
          fontFamily: "sans-serif",
        }}
      >
        {/* Status dot indicator */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 14,
              height: 14,
              borderRadius: "50%",
              background: "#e8500a",
            }}
          />
          <span
            style={{
              fontSize: 20,
              color: "#8a8070",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
            }}
          >
            Status Page
          </span>
        </div>

        {/* Page name */}
        <div
          style={{
            fontSize: 72,
            fontWeight: 900,
            color: "#f5f2eb",
            lineHeight: 1.05,
            letterSpacing: "-0.03em",
            maxWidth: 900,
          }}
        >
          {name}
        </div>

        {/* Footer */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: "#e8500a",
            }}
          />
          <span
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: "#f5f2eb",
              letterSpacing: "-0.02em",
            }}
          >
            Statsy
          </span>
          <span
            style={{
              fontSize: 18,
              color: "#8a8070",
              marginLeft: 4,
            }}
          >
            — Status pages for everyone
          </span>
        </div>
      </div>
    ),
    size,
  );
}
