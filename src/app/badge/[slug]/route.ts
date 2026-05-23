import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

function getServiceClient() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );
}

export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ slug: string }> },
) {
    const { slug } = await params;
    const supabase = getServiceClient();

    const { data: page, error: pageError } = await supabase
        .from("status_pages")
        .select("id, name, slug")
        .eq("slug", slug)
        .single();

    if (pageError || !page) {
        return new NextResponse("Not found", { status: 404 });
    }

    const { data: services } = await supabase
        .from("services")
        .select("status")
        .eq("status_page_id", page.id);

    let status: "operational" | "degraded" | "outage" = "operational";
    if (services && services.some((s) => s.status === "outage")) {
        status = "outage";
    } else if (services && services.some((s) => s.status === "degraded")) {
        status = "degraded";
    }

    const configs = {
        operational: {
            bg: "#e8f5ee",
            border: "#1a7a4a",
            dot: "#1a7a4a",
            text: "#1a7a4a",
            label: "All systems operational",
        },
        degraded: {
            bg: "rgba(232,80,10,0.1)",
            border: "#e8500a",
            dot: "#e8500a",
            text: "#e8500a",
            label: "Degraded performance",
        },
        outage: {
            bg: "#fdeae8",
            border: "#d32f2f",
            dot: "#d32f2f",
            text: "#d32f2f",
            label: "Service outage",
        },
    };

    const c = configs[status];
    const pageUrl = `https://${slug}.statsy.page`;

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="robots" content="noindex" />
  <title>${page.name} - Status</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body {
      width: 100%;
      height: 100%;
      background: transparent;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      display: flex;
      align-items: center;
      justify-content: flex-start;
    }
    a {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 7px 14px;
      border-radius: 999px;
      border: 1.5px solid var(--border);
      background: var(--bg);
      text-decoration: none;
      font-size: 13px;
      font-weight: 600;
      color: var(--text);
      white-space: nowrap;
      transition: opacity 0.15s;
    }
    a:hover { opacity: 0.85; }
    .arrow {
      font-size: 11px;
      color: #c4bfb4;
      opacity: 0.45;
      transform: translate(1px, -1px);
      transition: opacity 0.15s;
      flex-shrink: 0;
    }
    a:hover .arrow { opacity: 1; }
    .dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--dot);
      flex-shrink: 0;
      animation: pulse 2.4s ease-in-out infinite;
    }
    .name {
      color: #1a1714;
      font-weight: 700;
      font-size: 12px;
      letter-spacing: -0.01em;
    }
    .sep { color: #c4bfb4; }
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.4; }
    }
  </style>
</head>
<body>
  <a id="link" href="${pageUrl}" target="_blank" rel="noopener noreferrer">
    <span class="dot" id="dot"></span>
    <span class="name">${page.name}</span>
    <span class="sep">·</span>
    <span id="label">${c.label}</span>
    <span class="arrow">↗</span>
  </a>
  <script>
    var CONFIGS = {
      operational: { bg: '#e8f5ee', border: '#1a7a4a', dot: '#1a7a4a', text: '#1a7a4a', label: 'All systems operational' },
      degraded:    { bg: 'rgba(232,80,10,0.1)', border: '#e8500a', dot: '#e8500a', text: '#e8500a', label: 'Degraded performance' },
      outage:      { bg: '#fdeae8', border: '#d32f2f', dot: '#d32f2f', text: '#d32f2f', label: 'Service outage' }
    };
    function applyConfig(c) {
      var link = document.getElementById('link');
      var root = document.documentElement;
      root.style.setProperty('--bg', c.bg);
      root.style.setProperty('--border', c.border);
      root.style.setProperty('--dot', c.dot);
      root.style.setProperty('--text', c.text);
      document.getElementById('label').textContent = c.label;
    }
    applyConfig(CONFIGS['${status}']);
    setInterval(function() {
      fetch('/api/badge/${slug}')
        .then(function(r) { return r.json(); })
        .then(function(d) { if (CONFIGS[d.status]) applyConfig(CONFIGS[d.status]); })
        .catch(function() {});
    }, 60000);
  </script>
</body>
</html>`;

    return new NextResponse(html, {
        status: 200,
        headers: {
            "Content-Type": "text/html; charset=utf-8",
            // Short cache — fresh enough for a status badge
            "Cache-Control": "public, s-maxage=60, stale-while-revalidate=30",
        },
    });
}
