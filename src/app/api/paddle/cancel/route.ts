import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { getUserFromRequest } from "@/lib/auth";

export async function POST(req: NextRequest) {
    const user = getUserFromRequest(req);
    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createClient();

    const { data: sub } = await supabase
        .from("subscriptions")
        .select("paddle_subscription_id, status")
        .eq("user_id", user.id)
        .single();

    if (!sub?.paddle_subscription_id) {
        return NextResponse.json(
            { error: "No active subscription" },
            { status: 400 },
        );
    }

    if (sub.status === "cancelled") {
        return NextResponse.json(
            { error: "Already cancelled" },
            { status: 400 },
        );
    }

    const paddleEnv =
        process.env.NEXT_PUBLIC_PADDLE_ENVIRONMENT === "production"
            ? "api.paddle.com"
            : "sandbox-api.paddle.com";

    const res = await fetch(
        `https://${paddleEnv}/subscriptions/${sub.paddle_subscription_id}/cancel`,
        {
            method: "POST",
            headers: {
                Authorization: `Bearer ${process.env.PADDLE_API_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ effective_from: "next_billing_period" }),
        },
    );

    if (!res.ok) {
        const err = await res.json();
        // Sub already has a scheduled cancel — treat as success and sync DB
        if (
            err?.error?.code === "subscription_locked_pending_changes"
        ) {
            await supabase
                .from("subscriptions")
                .update({ status: "cancelled" })
                .eq("user_id", user.id);
            revalidateTag(`user-plan-${user.id}`, "seconds");
            return NextResponse.json({ success: true });
        }
        return NextResponse.json(
            { error: "Failed to cancel with Paddle" },
            { status: 500 },
        );
    }

    // Sync DB immediately — don't wait for webhook (unreliable in dev/staging)
    await supabase
        .from("subscriptions")
        .update({ status: "cancelled" })
        .eq("user_id", user.id);
    revalidateTag(`user-plan-${user.id}`, "seconds");

    return NextResponse.json({ success: true });
}
