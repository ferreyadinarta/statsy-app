import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { sendWeeklyDigestEmail } from "@/lib/email";

// Run once weekly via cron-job.org — Monday 9:00 AM UTC.
// Same CRON_SECRET as run-checks.

export async function GET(req: NextRequest) {
    const auth = req.headers.get("authorization");
    if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    // Fetch all status pages with their services and recent incidents
    const { data: pages, error } = await supabase
        .from("status_pages")
        .select(`
            id,
            name,
            slug,
            user_id,
            services (id, name, status),
            incidents (id, status, created_at)
        `)
        .gte("incidents.created_at", sevenDaysAgo);

    if (error || !pages) {
        console.error("weekly-digest: failed to fetch pages", error);
        return NextResponse.json({ error: "DB error" }, { status: 500 });
    }

    // Skip users with no services — nothing useful to report
    const activePages = pages.filter((p) => (p.services as unknown[]).length > 0);
    if (activePages.length === 0) return NextResponse.json({ sent: 0 });

    // Group pages by user
    const byUser = new Map<string, typeof activePages>();
    for (const page of activePages) {
        const existing = byUser.get(page.user_id) ?? [];
        existing.push(page);
        byUser.set(page.user_id, existing);
    }

    const userIds = [...byUser.keys()];

    // Fetch emails for all users in parallel
    const emailResults = await Promise.all(
        userIds.map((uid) => supabase.auth.admin.getUserById(uid)),
    );
    const emailMap = new Map<string, string>();
    userIds.forEach((uid, i) => {
        const email = emailResults[i]?.data?.user?.email;
        if (email) emailMap.set(uid, email);
    });

    // Send digests
    const sends = await Promise.allSettled(
        userIds.map(async (userId) => {
            const userEmail = emailMap.get(userId);
            if (!userEmail) return;

            const userPages = (byUser.get(userId) ?? []).map((page) => {
                const services = (page.services as { id: string; name: string; status: "operational" | "degraded" | "outage" }[]);
                const incidents = (page.incidents as { id: string; status: string; created_at: string }[]);
                // Count unique incident days (not every incident row)
                const incidentCount = incidents.filter((i) => i.status !== "resolved" || true).length;

                return {
                    name: page.name,
                    slug: page.slug,
                    services: services.map((s) => ({ name: s.name, status: s.status })),
                    incidentCount,
                };
            });

            await sendWeeklyDigestEmail({ to: userEmail, pages: userPages });
        }),
    );

    const failed = sends.filter((r) => r.status === "rejected").length;
    if (failed > 0) {
        console.error(`weekly-digest: ${failed}/${sends.length} emails failed`);
    }

    return NextResponse.json({ sent: sends.length - failed, failed });
}
