import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

function getVercelDeleteUrl(domain: string) {
  const teamId = process.env.VERCEL_TEAM_ID;
  const projectId = process.env.VERCEL_PROJECT_ID;
  const base = `https://api.vercel.com/v10/projects/${projectId}/domains/${domain}`;
  return teamId ? `${base}?teamId=${teamId}` : base;
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { status_page_id } = await req.json();

  if (!status_page_id) {
    return NextResponse.json({ error: "Missing status_page_id." }, { status: 400 });
  }

  // Confirm ownership and get current domain
  const { data: page, error: pageError } = await supabase
    .from("status_pages")
    .select("id, custom_domain")
    .eq("id", status_page_id)
    .eq("user_id", user.id)
    .single();

  if (pageError || !page) {
    return NextResponse.json({ error: "Page not found." }, { status: 404 });
  }

  if (!page.custom_domain) {
    return NextResponse.json({ error: "No custom domain set." }, { status: 400 });
  }

  // Remove from Vercel — best effort, don't block on failure
  const vercelRes = await fetch(getVercelDeleteUrl(page.custom_domain), {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${process.env.VERCEL_API_TOKEN}`,
    },
  });

  if (!vercelRes.ok && vercelRes.status !== 404) {
    console.error("Vercel domain remove error:", await vercelRes.text());
    // We still clear from DB — Vercel domains can be cleaned up manually
  }

  // Clear from DB
  const { error: updateError } = await supabase
    .from("status_pages")
    .update({ custom_domain: null })
    .eq("id", status_page_id)
    .eq("user_id", user.id);

  if (updateError) {
    console.error("DB clear error:", updateError);
    return NextResponse.json({ error: "Failed to remove domain." }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}