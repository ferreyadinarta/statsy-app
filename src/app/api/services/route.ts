import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { getUserPlan, PLAN_LIMITS } from "@/lib/plan";
import { getUserFromRequest } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { name, status, status_page_id } = await req.json();

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

  const { count } = await supabase
    .from("services")
    .select("*", { count: "exact", head: true })
    .eq("status_page_id", status_page_id);

  if ((count ?? 0) >= limit) {
    return NextResponse.json(
      { error: "Service limit reached." },
      { status: 403 },
    );
  }

  const { data: service, error: insertError } = await supabase
    .from("services")
    .insert({ name, status, status_page_id, user_id: user.id })
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
