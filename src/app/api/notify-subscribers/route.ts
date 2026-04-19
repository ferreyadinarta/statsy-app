import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { sendIncidentNotification } from "@/lib/email";
import { getUserPlan } from "@/lib/plan";
import { NextRequest, NextResponse } from "next/server";

// Service role client bypasses RLS to read subscribers
function getServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export async function POST(req: NextRequest) {
  const { status_page_id, incidentTitle, incidentStatus, incidentMessage } =
    await req.json();

  if (
    !status_page_id ||
    !incidentTitle ||
    !incidentStatus ||
    incidentMessage == null
  ) {
    return NextResponse.json({ error: "Missing fields." }, { status: 400 });
  }

  // Verify caller owns this status page
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { data: page } = await supabase
    .from("status_pages")
    .select("id, name, slug, user_id")
    .eq("id", status_page_id)
    .eq("user_id", user.id)
    .single();

  if (!page) {
    return NextResponse.json(
      { error: "Status page not found." },
      { status: 404 },
    );
  }

  // Fetch subscribers using service role (bypasses RLS)
  const serviceClient = getServiceClient();
  const { data: subscribers, error: subError } = await serviceClient
    .from("subscribers")
    .select("email, token")
    .eq("status_page_id", status_page_id);

  if (subError) {
    console.error("Error fetching subscribers:", subError);
    return NextResponse.json(
      { error: "Failed to fetch subscribers." },
      { status: 500 },
    );
  }

  if (!subscribers || subscribers.length === 0) {
    return NextResponse.json({ sent: 0 });
  }

  const emails = subscribers.map((s) => s.email);
  const unsubscribeTokens = Object.fromEntries(
    subscribers.map((s) => [s.email, s.token]),
  );

  const ownerPlan = await getUserPlan(page.user_id);

  await sendIncidentNotification({
    to: emails,
    pageSlug: page.slug,
    pageName: page.name,
    incidentTitle,
    incidentStatus,
    incidentMessage,
    unsubscribeTokens,
    hideBranding: ownerPlan === "pro",
  });

  return NextResponse.json({ sent: emails.length });
}
