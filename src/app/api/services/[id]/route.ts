import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;
  let body: { name?: string; status?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
  const { name, status } = body;

  if (!name?.trim() || !status) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }

  const validStatuses = ["operational", "degraded", "outage"];
  if (!validStatuses.includes(status)) {
    return NextResponse.json({ error: "Invalid status value." }, { status: 400 });
  }

  const user = getUserFromRequest(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const supabase = await createClient();

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
