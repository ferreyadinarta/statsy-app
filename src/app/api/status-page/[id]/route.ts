import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Confirm ownership
  const { data: page, error: pageError } = await supabase
    .from("status_pages")
    .select("id")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (pageError || !page) {
    return NextResponse.json({ error: "Page not found." }, { status: 404 });
  }

  // Fetch incident IDs so we can delete their child updates
  const { data: incidents } = await supabase
    .from("incidents")
    .select("id")
    .eq("status_page_id", id);

  const incidentIds = (incidents ?? []).map((i) => i.id);

  // Delete incident_updates, subscribers, and services in parallel
  // (they are independent of each other — only incidents must go last)
  const [updatesResult, subResult, svcResult] = await Promise.all([
    incidentIds.length > 0
      ? supabase.from("incident_updates").delete().in("incident_id", incidentIds)
      : Promise.resolve({ error: null }),
    supabase.from("subscribers").delete().eq("status_page_id", id),
    supabase.from("services").delete().eq("status_page_id", id),
  ]);

  if (updatesResult.error) {
    console.error("Failed to delete incident_updates:", updatesResult.error);
    return NextResponse.json({ error: "Failed to delete incident updates." }, { status: 500 });
  }
  if (subResult.error) {
    console.error("Failed to delete subscribers:", subResult.error);
    return NextResponse.json({ error: "Failed to delete subscribers." }, { status: 500 });
  }
  if (svcResult.error) {
    console.error("Failed to delete services:", svcResult.error);
    return NextResponse.json({ error: "Failed to delete services." }, { status: 500 });
  }

  // Delete incidents before the parent page
  const { error: incError } = await supabase
    .from("incidents")
    .delete()
    .eq("status_page_id", id);

  if (incError) {
    console.error("Failed to delete incidents:", incError);
    return NextResponse.json({ error: "Failed to delete incidents." }, { status: 500 });
  }

  // Delete the status page last
  const { error: pageDeleteError } = await supabase
    .from("status_pages")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (pageDeleteError) {
    console.error("Failed to delete status page:", pageDeleteError);
    return NextResponse.json({ error: "Failed to delete status page." }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
