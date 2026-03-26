import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

const FREE_PLAN_LIMIT = 30;

export async function POST(req: NextRequest) {
  const { email, status_page_id } = await req.json();

  // Validation
  if (!email || !status_page_id) {
    return NextResponse.json(
      { error: "Missing required fields." },
      { status: 400 },
    );
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return NextResponse.json(
      { error: "Please enter a valid email address." },
      { status: 400 },
    );
  }

  const supabase = await createClient();

  // Confirm the status page actually exists (and is public)
  const { data: page, error: pageError } = await supabase
    .from("status_pages")
    .select("id, user_id")
    .eq("id", status_page_id)
    .single();

  if (pageError || !page) {
    return NextResponse.json(
      { error: "Status page not found." },
      { status: 404 },
    );
  }

  // TODO (Chat 08): fetch page owner's plan and use their limit
  // For now, everyone is on Free plan = 30 subscribers
  const { count } = await supabase
    .from("subscribers")
    .select("*", { count: "exact", head: true })
    .eq("status_page_id", status_page_id);

  if ((count ?? 0) >= FREE_PLAN_LIMIT) {
    return NextResponse.json(
      { error: "This page has reached its subscriber limit." },
      { status: 403 },
    );
  }

  // Insert — on conflict (duplicate email)
  const { error: insertError } = await supabase
    .from("subscribers")
    .insert({ email, status_page_id });

  if (insertError) {
    if (insertError.code === "23505") {
      // Unique violation — already subscribed
      return NextResponse.json(
        { error: "This email is already subscribed." },
        { status: 409 },
      );
    }
    console.error("Subscribe insert error:", insertError);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true });
}
