import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { createSign, timingSafeEqual } from "crypto";

// Read-only marketing stats for the daily SEO agent: Google Search Console
// performance + signup counts. Protected by SEO_STATS_TOKEN (Bearer).
//
// Env:
//   SEO_STATS_TOKEN              random secret shared with the agent
//   GSC_SERVICE_ACCOUNT_JSON     Google service account key (JSON string)
//   GSC_SITE_URL                 e.g. "sc-domain:statsy.page" or "https://statsy.page/"

export const dynamic = "force-dynamic";

const DAY_MS = 24 * 60 * 60 * 1000;
// Search Console data lags ~2-3 days; end the window before the gap.
const GSC_LAG_DAYS = 3;
const WINDOW_DAYS = 28;

function authorized(req: NextRequest): boolean {
  const expected = process.env.SEO_STATS_TOKEN;
  const header = req.headers.get("authorization") ?? "";
  const given = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!expected || !given) return false;
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function base64url(input: Buffer | string): string {
  return Buffer.from(input).toString("base64url");
}

async function getGoogleAccessToken(): Promise<string> {
  const key = JSON.parse(process.env.GSC_SERVICE_ACCOUNT_JSON!) as {
    client_email: string;
    private_key: string;
  };
  const now = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claims = base64url(
    JSON.stringify({
      iss: key.client_email,
      scope: "https://www.googleapis.com/auth/webmasters.readonly",
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600,
    }),
  );
  const signer = createSign("RSA-SHA256");
  signer.update(`${header}.${claims}`);
  const signature = base64url(signer.sign(key.private_key));

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: `${header}.${claims}.${signature}`,
    }),
  });
  if (!res.ok) throw new Error(`google_token_${res.status}`);
  const data = (await res.json()) as { access_token: string };
  return data.access_token;
}

type GscRow = { keys?: string[]; clicks: number; impressions: number; ctr: number; position: number };

async function querySearchConsole(
  token: string,
  startDate: string,
  endDate: string,
  dimensions: string[],
  rowLimit: number,
) {
  const site = encodeURIComponent(process.env.GSC_SITE_URL!);
  const res = await fetch(
    `https://www.googleapis.com/webmasters/v3/sites/${site}/searchAnalytics/query`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ startDate, endDate, dimensions, rowLimit }),
    },
  );
  if (!res.ok) throw new Error(`gsc_${res.status}`);
  const data = (await res.json()) as { rows?: GscRow[] };
  return (data.rows ?? []).map((r) => ({
    key: r.keys?.join(" | ") ?? "total",
    clicks: r.clicks,
    impressions: r.impressions,
    ctr: Math.round(r.ctr * 1000) / 10,
    position: Math.round(r.position * 10) / 10,
  }));
}

async function getSearchConsoleStats() {
  if (!process.env.GSC_SERVICE_ACCOUNT_JSON || !process.env.GSC_SITE_URL) {
    return { error: "gsc_not_configured" };
  }
  const end = new Date(Date.now() - GSC_LAG_DAYS * DAY_MS);
  const start = new Date(end.getTime() - (WINDOW_DAYS - 1) * DAY_MS);
  const [startDate, endDate] = [isoDate(start), isoDate(end)];

  try {
    const token = await getGoogleAccessToken();
    const [totals, byQuery, byPage, byDate] = await Promise.all([
      querySearchConsole(token, startDate, endDate, [], 1),
      querySearchConsole(token, startDate, endDate, ["query"], 100),
      querySearchConsole(token, startDate, endDate, ["page"], 50),
      querySearchConsole(token, startDate, endDate, ["date"], WINDOW_DAYS),
    ]);
    return { startDate, endDate, totals: totals[0] ?? null, byQuery, byPage, byDate };
  } catch (e) {
    return { startDate, endDate, error: e instanceof Error ? e.message : "gsc_failed" };
  }
}

async function getSignupStats() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
  const since = new Date(Date.now() - WINDOW_DAYS * DAY_MS).toISOString();

  const [{ data: pages, error: pagesError }, { data: users, error: usersError }] =
    await Promise.all([
      supabase.from("status_pages").select("created_at").gte("created_at", since),
      supabase.auth.admin.listUsers({ perPage: 1000 }),
    ]);
  if (pagesError || usersError) return { error: "db_failed" };

  const perDay = (dates: string[]) =>
    dates.reduce<Record<string, number>>((acc, d) => {
      const day = d.slice(0, 10);
      acc[day] = (acc[day] ?? 0) + 1;
      return acc;
    }, {});

  const recentSignups = users.users.map((u) => u.created_at).filter((d) => d >= since);
  const pageDates = (pages ?? []).map((p) => p.created_at as string);

  return {
    since: since.slice(0, 10),
    totalUsers: users.users.length,
    signups: recentSignups.length,
    signupsPerDay: perDay(recentSignups),
    statusPagesCreated: pageDates.length,
    statusPagesPerDay: perDay(pageDates),
  };
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const [searchConsole, signups] = await Promise.all([getSearchConsoleStats(), getSignupStats()]);
  return NextResponse.json(
    { generatedAt: new Date().toISOString(), searchConsole, signups },
    { headers: { "Cache-Control": "no-store" } },
  );
}
