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
  const isSuccess = title === "Unsubscribed";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title} — Statsy</title>
  <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='14' fill='%231a1714'/%3E%3Ccircle cx='32' cy='32' r='7' fill='%23e8500a'/%3E%3Ccircle cx='32' cy='32' r='16' fill='none' stroke='%23e8500a' stroke-width='3' opacity='0.5'/%3E%3Ccircle cx='32' cy='32' r='26' fill='none' stroke='%23e8500a' stroke-width='2' opacity='0.25'/%3E%3C%2Fsvg%3E">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Cabinet+Grotesk:wght@700;900&family=Instrument+Sans:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Instrument Sans', -apple-system, BlinkMacSystemFont, sans-serif;
      background: #f5f2eb;
      color: #1a1714;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 24px;
    }
    .card {
      background: white;
      border: 1.5px solid #1a1714;
      border-radius: 4px;
      box-shadow: 6px 6px 0 #1a1714;
      padding: 48px;
      max-width: 440px;
      width: 100%;
      text-align: center;
    }
    .icon {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 20px;
      font-size: 1.3rem;
      background: ${isSuccess ? "#e8f5ee" : "#fdeae8"};
      border: 1.5px solid ${isSuccess ? "#1a7a4a" : "#d32f2f"};
    }
    h1 {
      font-family: 'Cabinet Grotesk', sans-serif;
      font-weight: 900;
      font-size: 1.6rem;
      letter-spacing: -0.03em;
      color: #1a1714;
      margin-bottom: 10px;
    }
    p {
      color: #8a8070;
      font-size: 0.9rem;
      line-height: 1.6;
      margin-bottom: 32px;
    }
    .btn {
      display: inline-block;
      background: #1a1714;
      color: #f5f2eb;
      padding: 10px 24px;
      border-radius: 4px;
      font-size: 0.85rem;
      font-weight: 600;
      text-decoration: none;
      font-family: inherit;
      margin-bottom: 20px;
    }
    .powered {
      font-size: 0.75rem;
      color: #c4bfb4;
      display: block;
    }
    .powered a {
      color: #e8500a;
      text-decoration: none;
      font-weight: 600;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">${isSuccess ? "✓" : "✕"}</div>
    <h1>${title}</h1>
    <p>${message}</p>
    <a href="https://statsy.page" class="btn">Back to Statsy →</a>
    <span class="powered">
      Powered by <a href="https://statsy.page">Statsy</a> — status pages for everyone
    </span>
  </div>
</body>
</html>`;
}
