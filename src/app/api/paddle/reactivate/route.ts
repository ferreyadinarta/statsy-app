import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: sub } = await supabase
        .from("subscriptions")
        .select("paddle_subscription_id, status, current_period_end")
        .eq("user_id", user.id)
        .single();

    if (!sub?.paddle_subscription_id) {
        return NextResponse.json(
            { error: "No subscription found" },
            { status: 400 },
        );
    }

    if (sub.status !== "cancelled") {
        return NextResponse.json(
            { error: "Subscription is not cancelled" },
            { status: 400 },
        );
    }

    if (
        sub.current_period_end &&
        new Date() >= new Date(sub.current_period_end)
    ) {
        return NextResponse.json(
            { error: "Subscription period has already ended" },
            { status: 400 },
        );
    }

    const paddleEnv =
        process.env.NEXT_PUBLIC_PADDLE_ENVIRONMENT === "production"
            ? "api.paddle.com"
            : "sandbox-api.paddle.com";

    const res = await fetch(
        `https://${paddleEnv}/subscriptions/${sub.paddle_subscription_id}`,
        {
            method: "PATCH",
            headers: {
                Authorization: `Bearer ${process.env.PADDLE_API_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ scheduled_change: null }),
        },
    );

    if (!res.ok) {
        return NextResponse.json(
            { error: "Failed to reactivate with Paddle" },
            { status: 500 },
        );
    }

    await supabase
        .from("subscriptions")
        .update({ status: "active" })
        .eq("user_id", user.id);

    return NextResponse.json({ success: true });
}
