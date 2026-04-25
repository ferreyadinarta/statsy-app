import { createClient } from "@/lib/supabase/server";
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
  const { email, status_page_id } = await req.json();

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

  const supabase = await createClient();

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

  const { count } = await supabase
    .from("subscribers")
    .select("*", { count: "exact", head: true })
    .eq("status_page_id", status_page_id);

  if ((count ?? 0) >= limit) {
    return NextResponse.json(
      { error: "This page has reached its subscriber limit." },
      { status: 403, headers: CORS_HEADERS },
    );
  }

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

  return NextResponse.json({ success: true }, { headers: CORS_HEADERS });
}
