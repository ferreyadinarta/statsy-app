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
        { error: `Your plan allows ${limit} active maintenance ${limit === 1 ? "window" : "windows"}. Upgrade to Pro for unlimited.` },
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

export async function PATCH(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing maintenance id." }, { status: 400 });

  let body: {
    title?: string;
    description?: string;
    starts_at?: string;
    ends_at?: string;
    action?: "start" | "complete" | "cancel";
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const user = getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const supabase = await createClient();

  // Ownership check (also fetch state + times to validate the transition).
  const { data: existing } = await supabase
    .from("maintenance_windows")
    .select("id, user_id, state, starts_at, ends_at")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();
  if (!existing) return NextResponse.json({ error: "Not found." }, { status: 404 });

  // Guard state transitions: start/cancel only from scheduled; complete only from in_progress.
  if (body.action === "start" && existing.state !== "scheduled") {
    return NextResponse.json({ error: "Only scheduled maintenance can be started." }, { status: 409 });
  }
  if (body.action === "cancel" && existing.state !== "scheduled") {
    return NextResponse.json({ error: "Only scheduled maintenance can be cancelled." }, { status: 409 });
  }
  if (body.action === "complete" && existing.state !== "in_progress") {
    return NextResponse.json({ error: "Only in-progress maintenance can be completed." }, { status: 409 });
  }

  // Validate the effective range, even when only one bound is supplied.
  if (body.starts_at !== undefined || body.ends_at !== undefined) {
    const effectiveStart = body.starts_at ?? existing.starts_at;
    const effectiveEnd = body.ends_at ?? existing.ends_at;
    if (new Date(effectiveEnd) <= new Date(effectiveStart)) {
      return NextResponse.json({ error: "End time must be after start time." }, { status: 400 });
    }
  }

  const now = new Date().toISOString();
  const update: Record<string, unknown> = {};

  if (body.title !== undefined) update.title = body.title;
  if (body.description !== undefined) update.description = body.description?.trim() || null;
  if (body.starts_at !== undefined) update.starts_at = body.starts_at;
  if (body.ends_at !== undefined) update.ends_at = body.ends_at;

  if (body.action === "start") {
    update.state = "in_progress";
    update.started_at = now;
  } else if (body.action === "complete") {
    update.state = "completed";
    update.completed_at = now;
  } else if (body.action === "cancel") {
    update.state = "cancelled";
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "No updatable fields provided." }, { status: 400 });
  }

  const { data: mw, error } = await supabase
    .from("maintenance_windows")
    .update(update)
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();
  if (error) {
    console.error("maintenance patch error:", error);
    return NextResponse.json({ error: "Update failed." }, { status: 500 });
  }

  // Tell subscribers a previously-announced maintenance is off (best-effort).
  if (body.action === "cancel" && mw) {
    try {
      const { data: page } = await supabase
        .from("status_pages")
        .select("slug, name")
        .eq("id", mw.status_page_id)
        .single();
      if (page) {
        await notifyMaintenance(getServiceClient(), {
          kind: "cancelled",
          statusPageId: mw.status_page_id,
          pageSlug: page.slug,
          pageName: page.name,
          title: mw.title,
          message: "This scheduled maintenance has been cancelled.",
          startsAt: mw.starts_at,
          endsAt: mw.ends_at,
        });
      }
    } catch (e) {
      console.error("cancellation email error:", e);
    }
  }

  return NextResponse.json({ success: true, maintenance: mw });
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing maintenance id." }, { status: 400 });

  const user = getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("maintenance_windows")
    .select("id, state")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();
  if (!existing) return NextResponse.json({ error: "Not found." }, { status: 404 });

  // A live window must be completed or cancelled before it can be deleted.
  if (existing.state === "in_progress") {
    return NextResponse.json(
      { error: "Complete the maintenance before deleting it." },
      { status: 409 },
    );
  }

  const { error } = await supabase
    .from("maintenance_windows")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) {
    console.error("maintenance delete error:", error);
    return NextResponse.json({ error: "Delete failed." }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
