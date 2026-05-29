import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { getUserPlan, PLAN_LIMITS } from "@/lib/plan";
import { notifyMaintenance } from "@/lib/maintenance";

function getServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export async function POST(req: NextRequest) {
  let body: {
    status_page_id?: string;
    title?: string;
    description?: string;
    starts_at?: string;
    ends_at?: string;
    service_ids?: string[];
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
  const { status_page_id, title, description, starts_at, ends_at, service_ids } = body;

  if (!status_page_id || !title || !starts_at || !ends_at) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }
  if (new Date(ends_at) <= new Date(starts_at)) {
    return NextResponse.json({ error: "End time must be after start time." }, { status: 400 });
  }

  const user = getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const supabase = await createClient();

  const { data: page } = await supabase
    .from("status_pages")
    .select("id, name, slug, user_id")
    .eq("id", status_page_id)
    .eq("user_id", user.id)
    .single();
  if (!page) return NextResponse.json({ error: "Status page not found." }, { status: 404 });

  // Plan gate: free users may have at most N active/upcoming windows.
  const plan = await getUserPlan(user.id);
  const limit = PLAN_LIMITS[plan].activeMaintenance;
  if (limit != null) {
    const { count } = await supabase
      .from("maintenance_windows")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .in("state", ["scheduled", "in_progress"]);
    if ((count ?? 0) >= limit) {
      return NextResponse.json(
        { error: `Your plan allows ${limit} active maintenance window. Upgrade to Pro for unlimited.` },
        { status: 403 },
      );
    }
  }

  const { data: mw, error: insertError } = await supabase
    .from("maintenance_windows")
    .insert({
      status_page_id,
      user_id: user.id,
      title,
      description: description?.trim() || null,
      starts_at,
      ends_at,
      state: "scheduled",
      notified_scheduled: true,
    })
    .select()
    .single();
  if (insertError || !mw) {
    console.error("maintenance insert error:", insertError);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }

  // Optional affected-service links.
  if (service_ids && service_ids.length > 0) {
    const links = service_ids.map((sid) => ({ maintenance_window_id: mw.id, service_id: sid }));
    const { error: linkError } = await supabase.from("maintenance_window_services").insert(links);
    if (linkError) console.error("maintenance link error:", linkError);
  }

  // Fire scheduled email (service role to read subscribers).
  try {
    await notifyMaintenance(getServiceClient(), {
      kind: "scheduled",
      statusPageId: status_page_id,
      pageSlug: page.slug,
      pageName: page.name,
      title,
      message: description?.trim() || "Maintenance has been scheduled.",
      startsAt: starts_at,
      endsAt: ends_at,
    });
  } catch (e) {
    console.error("scheduled maintenance email error:", e);
  }

  return NextResponse.json({ success: true, maintenance: mw });
}
