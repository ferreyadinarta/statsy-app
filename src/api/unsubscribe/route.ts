import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");

  if (!token) {
    return new NextResponse(
      renderPage("Invalid link", "This unsubscribe link is invalid."),
      {
        status: 400,
        headers: { "Content-Type": "text/html" },
      },
    );
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("subscribers")
    .delete()
    .eq("token", token);

  if (error) {
    console.error("Unsubscribe error:", error);
    return new NextResponse(
      renderPage(
        "Something went wrong",
        "We couldn't process your unsubscribe request. Please try again or contact support.",
      ),
      { status: 500, headers: { "Content-Type": "text/html" } },
    );
  }

  return new NextResponse(
    renderPage(
      "Unsubscribed",
      "You've been successfully unsubscribed. You won't receive any more notifications from this page.",
    ),
    { status: 200, headers: { "Content-Type": "text/html" } },
  );
}

function renderPage(title: string, message: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title} — Statsy</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      background: #f5f2eb; color: #1a1714; display: flex; align-items: center;
      justify-content: center; min-height: 100vh; margin: 0; padding: 24px; }
    .card { background: white; border: 1.5px solid #1a1714; border-radius: 4px;
      padding: 40px 48px; max-width: 420px; text-align: center; }
    h1 { font-size: 1.3rem; margin: 0 0 12px; }
    p { color: #8a8070; font-size: 0.9rem; line-height: 1.6; margin: 0 0 24px; }
    a { color: #e8500a; font-size: 0.85rem; text-decoration: none; }
  </style>
</head>
<body>
  <div class="card">
    <h1>${title}</h1>
    <p>${message}</p>
    <a href="https://statsy.page">Powered by Statsy</a>
  </div>
</body>
</html>`;
}
