import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { getUserPlan, PLAN_LIMITS } from "@/lib/plan";
import { getUserFromRequest } from "@/lib/auth";

export async function POST(req: NextRequest) {
  let body: { name?: string; status?: string; status_page_id?: string; monitor_url?: string | null; check_interval_minutes?: number | null };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
  const { name, status, status_page_id, monitor_url, check_interval_minutes } = body;

  if (monitor_url) {
    if (!/^https?:\/\//i.test(monitor_url)) {
      return NextResponse.json({ error: "Monitor URL must start with http:// or https://" }, { status: 400 });
    }
    try {
      const u = new URL(monitor_url);
      const blocked = /^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|169\.254\.)/i;
      if (blocked.test(u.hostname)) {
        return NextResponse.json({ error: "Monitor URL cannot point to a private or local address." }, { status: 400 });
      }
    } catch {
      return NextResponse.json({ error: "Invalid monitor URL." }, { status: 400 });
    }
  }

  if (!name || !status || !status_page_id) {
    return NextResponse.json(
      { error: "Missing required fields." },
      { status: 400 },
    );
  }

  const user = getUserFromRequest(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const supabase = await createClient();

  const { data: page, error: pageError } = await supabase
    .from("status_pages")
    .select("id")
    .eq("id", status_page_id)
    .eq("user_id", user.id)
    .single();

  if (pageError || !page) {
    return NextResponse.json(
      { error: "Status page not found." },
      { status: 404 },
    );
  }

  const plan = await getUserPlan(user.id);
  const limit = PLAN_LIMITS[plan].services;

  const { count, error: countError } = await supabase
    .from("services")
    .select("*", { count: "exact", head: true })
    .eq("status_page_id", status_page_id);

  if (countError) {
    console.error("Service count error:", countError);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }

  if ((count ?? 0) >= limit) {
    return NextResponse.json(
      { error: "Service limit reached." },
      { status: 403 },
    );
  }

  const { data: service, error: insertError } = await supabase
    .from("services")
    .insert({ name, status, status_page_id, user_id: user.id, monitor_url: monitor_url ?? null, check_interval_minutes: check_interval_minutes ?? null })
    .select()
    .single();

  if (insertError) {
    console.error("Service insert error:", insertError);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true, service });
}
