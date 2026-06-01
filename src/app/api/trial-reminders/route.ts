import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { sendTrialEndingEmail } from "@/lib/email";

// Run once daily via cron-job.org.
// Uses a ±12h window around the 3-day and 1-day marks so each user is hit exactly once.

export async function GET(req: NextRequest) {
    const auth = req.headers.get("authorization");
    if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    const now = Date.now();
    const DAY = 24 * 60 * 60 * 1000;
    const HALF_DAY = DAY / 2;

    // 3-day window: trials ending between 2.5 and 3.5 days from now
    const threeDayStart = new Date(now + 2.5 * DAY).toISOString();
    const threeDayEnd = new Date(now + 3.5 * DAY).toISOString();

    // 1-day window: trials ending between 0.5 and 1.5 days from now
    const oneDayStart = new Date(now + HALF_DAY).toISOString();
    const oneDayEnd = new Date(now + 1.5 * DAY).toISOString();

    const [{ data: threeDayTrials }, { data: oneDayTrials }] = await Promise.all([
        supabase
            .from("subscriptions")
            .select("user_id")
            .eq("status", "trialing")
            .gte("current_period_end", threeDayStart)
            .lte("current_period_end", threeDayEnd),
        supabase
            .from("subscriptions")
            .select("user_id")
            .eq("status", "trialing")
            .gte("current_period_end", oneDayStart)
            .lte("current_period_end", oneDayEnd),
    ]);

    const tasks: { userId: string; daysLeft: number }[] = [
        ...(threeDayTrials ?? []).map((s) => ({ userId: s.user_id, daysLeft: 3 })),
        ...(oneDayTrials ?? []).map((s) => ({ userId: s.user_id, daysLeft: 1 })),
    ];

    if (tasks.length === 0) return NextResponse.json({ sent: 0 });

    const emailResults = await Promise.allSettled(
        tasks.map(async ({ userId, daysLeft }) => {
            const { data: userData } = await supabase.auth.admin.getUserById(userId);
            const email = userData?.user?.email;
            if (!email) return;
            await sendTrialEndingEmail({ to: email, daysLeft });
        }),
    );

    const failed = emailResults.filter((r) => r.status === "rejected").length;
    if (failed > 0) {
        console.error(`trial-reminders: ${failed}/${tasks.length} emails failed`);
    }

    return NextResponse.json({ sent: tasks.length - failed, failed });
}
