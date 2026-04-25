import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { getUserPlan } from "@/lib/plan";

function getVercelApiBase() {
  const teamId = process.env.VERCEL_TEAM_ID;
  const projectId = process.env.VERCEL_PROJECT_ID;
  const base = `https://api.vercel.com/v10/projects/${projectId}/domains`;
  return teamId ? `${base}?teamId=${teamId}` : base;
}

async function removeVercelDomain(domain: string) {
  const teamId = process.env.VERCEL_TEAM_ID;
  const projectId = process.env.VERCEL_PROJECT_ID;
  const url = teamId
    ? `https://api.vercel.com/v10/projects/${projectId}/domains/${domain}?teamId=${teamId}`
    : `https://api.vercel.com/v10/projects/${projectId}/domains/${domain}`;
  await fetch(url, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${process.env.VERCEL_API_TOKEN}` },
  });
}

function isValidDomain(domain: string): boolean {
  // Must look like a real hostname — no protocol, no path, no port
  const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  return domainRegex.test(domain) && !domain.startsWith("http");
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const plan = await getUserPlan(user.id);
  if (plan !== "pro") {
    return NextResponse.json(
      { error: "Custom domains are a Pro feature. Please upgrade." },
      { status: 403 }
    );
  }

  const { domain, status_page_id } = await req.json();

  if (!domain || !status_page_id) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }

  const cleanDomain = domain.trim().toLowerCase().replace(/^https?:\/\//, "");

  if (!isValidDomain(cleanDomain)) {
    return NextResponse.json(
      { error: "Invalid domain. Enter something like status.yoursite.com — no http://, no trailing slash." },
      { status: 400 }
    );
  }

  // Confirm this page belongs to the logged-in user
  const { data: page, error: pageError } = await supabase
    .from("status_pages")
    .select("id, slug, custom_domain")
    .eq("id", status_page_id)
    .eq("user_id", user.id)
    .single();

  if (pageError || !page) {
    return NextResponse.json({ error: "Page not found." }, { status: 404 });
  }

  // If they already have this exact domain set, no-op
  if (page.custom_domain === cleanDomain) {
    return NextResponse.json({ success: true, domain: cleanDomain });
  }

  // Register domain with Vercel
  const vercelRes = await fetch(getVercelApiBase(), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.VERCEL_API_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name: cleanDomain }),
  });

  const vercelData = await vercelRes.json();

  // 409 means domain already added to Vercel — that's fine, continue.
  // Track whether we freshly added it so we know whether to clean up on DB failure.
  const vercelFreshlyAdded = vercelRes.ok;

  if (!vercelRes.ok && vercelRes.status !== 409) {
    console.error("Vercel domain add error:", vercelData);
    return NextResponse.json(
      { error: "Failed to register domain with Vercel. Check it's a valid domain you own." },
      { status: 500 }
    );
  }

  // Save to DB
  const { error: updateError } = await supabase
    .from("status_pages")
    .update({ custom_domain: cleanDomain })
    .eq("id", status_page_id)
    .eq("user_id", user.id);

  if (updateError) {
    // Only remove from Vercel if we added it — don't touch pre-existing registrations.
    if (vercelFreshlyAdded) {
      await removeVercelDomain(cleanDomain);
    }

    if (updateError.code === "23505") {
      return NextResponse.json(
        { error: "This domain is already linked to another status page." },
        { status: 409 }
      );
    }
    console.error("DB update error:", updateError);
    return NextResponse.json({ error: "Failed to save domain." }, { status: 500 });
  }

  return NextResponse.json({ success: true, domain: cleanDomain });
}