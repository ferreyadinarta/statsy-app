import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { getUserPlan, PLAN_LIMITS } from "@/lib/plan";

function computeLastUpdated(
  services: { created_at: string }[],
  incidents: {
    created_at: string;
    incident_updates: { created_at: string }[];
  }[],
): string | null {
  const allDates = [
    ...services.map((s) => new Date(s.created_at).getTime()),
    ...incidents.map((i) => new Date(i.created_at).getTime()),
    ...incidents.flatMap((i) =>
      i.incident_updates.map((u) => new Date(u.created_at).getTime()),
    ),
  ];
  if (allDates.length === 0) return null;
  const diffMs = new Date().getTime() - Math.max(...allDates);
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? "" : "s"} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
  return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: page, error: pageError } = await supabase
    .from("status_pages")
    .select("*")
    .eq("slug", slug)
    .single();

  if (pageError || !page) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const [{ data: services }, ownerPlan, { data: ownerPages }] = await Promise.all([
    supabase
      .from("services")
      .select("*")
      .eq("status_page_id", page.id)
      .order("created_at", { ascending: true }),
    getUserPlan(page.user_id),
    createClient().then((sb) =>
      sb
        .from("status_pages")
        .select("id")
        .eq("user_id", page.user_id)
        .order("created_at", { ascending: true }),
    ),
  ]);

  const pageLimit = PLAN_LIMITS[ownerPlan].pages;
  const allowedPageIds = (ownerPages ?? []).slice(0, pageLimit).map((p) => p.id);
  const pagePaused = !allowedPageIds.includes(page.id);

  const daysToShow = PLAN_LIMITS[ownerPlan].historyDays;
  const dateThreshold = new Date();
  dateThreshold.setDate(dateThreshold.getDate() - daysToShow);

  const { data: incidents } = await supabase
    .from("incidents")
    .select(`*, incident_updates(*)`)
    .eq("status_page_id", page.id)
    .gte("created_at", dateThreshold.toISOString())
    .order("created_at", { ascending: false });

  const trimmedServices = (services ?? []).slice(0, PLAN_LIMITS[ownerPlan].services);
  const lastUpdated = computeLastUpdated(trimmedServices, incidents ?? []);

  return NextResponse.json({
    pagePaused,
    services: trimmedServices,
    incidents: incidents ?? [],
    incidentDays: daysToShow,
    lastUpdated,
  });
}
