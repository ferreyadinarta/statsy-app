import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

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
