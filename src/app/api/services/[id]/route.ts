import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const { name, status } = await req.json();

  if (!name || !status) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }

  const validStatuses = ["operational", "degraded", "outage"];
  if (!validStatuses.includes(status)) {
    return NextResponse.json({ error: "Invalid status value." }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { error } = await supabase
    .from("services")
    .update({ name: name.trim(), status })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    console.error("Service update error:", error);
    return NextResponse.json({ error: "Failed to update service." }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

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
