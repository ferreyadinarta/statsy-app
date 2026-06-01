import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { getUserPlan, PLAN_LIMITS } from "@/lib/plan";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new Response(null, { headers: CORS_HEADERS });
}

export async function POST(req: NextRequest) {
  let body: { email?: string; status_page_id?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400, headers: CORS_HEADERS });
  }
  const { email, status_page_id } = body;

  if (!email || !status_page_id) {
    return NextResponse.json(
      { error: "Missing required fields." },
      { status: 400, headers: CORS_HEADERS },
    );
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return NextResponse.json(
      { error: "Please enter a valid email address." },
      { status: 400, headers: CORS_HEADERS },
    );
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const { data: page, error: pageError } = await supabase
    .from("status_pages")
    .select("id, user_id")
    .eq("id", status_page_id)
    .single();

  if (pageError || !page) {
    return NextResponse.json(
      { error: "Status page not found." },
      { status: 404, headers: CORS_HEADERS },
    );
  }

  const plan = await getUserPlan(page.user_id);
  const limit = PLAN_LIMITS[plan].subscribers;

  // Rate limit: max 5 new subscribers per page per minute (spam guard)
  const oneMinuteAgo = new Date(Date.now() - 60 * 1000).toISOString();
  const { count: recentCount } = await supabase
    .from("subscribers")
    .select("*", { count: "exact", head: true })
    .eq("status_page_id", status_page_id)
    .gte("created_at", oneMinuteAgo);
  if ((recentCount ?? 0) >= 5) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429, headers: CORS_HEADERS },
    );
  }

  // Insert first, then count-check to avoid TOCTOU race condition.
  const { error: insertError } = await supabase
    .from("subscribers")
    .insert({ email, status_page_id });

  if (insertError) {
    if (insertError.code === "23505") {
      return NextResponse.json(
        { error: "This email is already subscribed." },
        { status: 409, headers: CORS_HEADERS },
      );
    }
    console.error("Subscribe insert error:", insertError);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500, headers: CORS_HEADERS },
    );
  }

  // Count after insert — if over limit, remove the row we just added.
  const { count, error: countError } = await supabase
    .from("subscribers")
    .select("*", { count: "exact", head: true })
    .eq("status_page_id", status_page_id);

  if (countError) {
    // Can't verify limit — roll back the insert to be safe.
    await supabase
      .from("subscribers")
      .delete()
      .eq("status_page_id", status_page_id)
      .eq("email", email);
    console.error("Subscribe count error:", countError);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500, headers: CORS_HEADERS },
    );
  }

  if ((count ?? 0) > limit) {
    await supabase
      .from("subscribers")
      .delete()
      .eq("status_page_id", status_page_id)
      .eq("email", email);

    return NextResponse.json(
      { error: "This page has reached its subscriber limit." },
      { status: 403, headers: CORS_HEADERS },
    );
  }

  return NextResponse.json({ success: true }, { headers: CORS_HEADERS });
}
