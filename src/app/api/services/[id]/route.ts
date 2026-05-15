import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;
  let body: { name?: string; status?: string; monitor_url?: string | null; check_interval_minutes?: number | null; degraded_threshold_ms?: number | null };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
  const { name, status, monitor_url, check_interval_minutes, degraded_threshold_ms } = body;

  if (!name?.trim() || !status) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }

  const validStatuses = ["operational", "degraded", "outage"];
  if (!validStatuses.includes(status)) {
    return NextResponse.json({ error: "Invalid status value." }, { status: 400 });
  }

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

  const user = getUserFromRequest(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("services")
    .update({ name: name.trim(), status, monitor_url: monitor_url ?? null, check_interval_minutes: check_interval_minutes ?? null, degraded_threshold_ms: degraded_threshold_ms ?? null })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    console.error("Service update error:", error);
    return NextResponse.json({ error: "Failed to update service." }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const { id } = await params;

  const user = getUserFromRequest(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("services")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    console.error("Service delete error:", error);
    return NextResponse.json({ error: "Failed to delete service." }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
