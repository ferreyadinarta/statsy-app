import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const incidentId = searchParams.get("id");

  if (!incidentId) {
    return NextResponse.json({ error: "Missing incident id." }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  // Confirm ownership via the parent status page
  const { data: incident, error: fetchError } = await supabase
    .from("incidents")
    .select("id, status_pages!inner(user_id)")
    .eq("id", incidentId)
    .eq("status_pages.user_id", user.id)
    .single();

  if (fetchError || !incident) {
    return NextResponse.json({ error: "Incident not found." }, { status: 404 });
  }

  // Delete child updates first
  const { error: updatesError } = await supabase
    .from("incident_updates")
    .delete()
    .eq("incident_id", incidentId);

  if (updatesError) {
    console.error("Failed to delete incident_updates:", updatesError);
    return NextResponse.json({ error: "Failed to delete incident updates." }, { status: 500 });
  }

  const { error: incidentError } = await supabase
    .from("incidents")
    .delete()
    .eq("id", incidentId);

  if (incidentError) {
    console.error("Failed to delete incident:", incidentError);
    return NextResponse.json({ error: "Failed to delete incident." }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

export async function POST(req: NextRequest) {
  const { title, description, status, status_page_id } = await req.json();

  if (!title || !status || !status_page_id) {
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

  const { data: incident, error: insertError } = await supabase
    .from("incidents")
    .insert({
      title,
      description: description?.trim() || null,
      status,
      status_page_id,
      user_id: user.id,
    })
    .select()
    .single();

  if (insertError) {
    console.error("Incident insert error:", insertError);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true, incident });
}
