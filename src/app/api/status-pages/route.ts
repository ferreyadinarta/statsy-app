import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { getUserPlan, PLAN_LIMITS } from "@/lib/plan";

export async function POST(req: NextRequest) {
  const { name, slug } = await req.json();

  if (!name || !slug) {
    return NextResponse.json(
      { error: "Missing required fields." },
      { status: 400 },
    );
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const plan = await getUserPlan(user.id);
  const limit = PLAN_LIMITS[plan].pages;

  const { count } = await supabase
    .from("status_pages")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  if ((count ?? 0) >= limit) {
    return NextResponse.json(
      { error: "Page limit reached." },
      { status: 403 },
    );
  }

  const { data: page, error: insertError } = await supabase
    .from("status_pages")
    .insert({ name, slug, user_id: user.id })
    .select()
    .single();

  if (insertError) {
    if (insertError.code === "23505") {
      return NextResponse.json(
        { error: "This slug is already taken. Try another." },
        { status: 409 },
      );
    }
    console.error("Status page insert error:", insertError);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true, page });
}
