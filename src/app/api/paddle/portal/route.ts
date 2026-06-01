import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";

export async function POST(req: NextRequest) {
    const user = getUserFromRequest(req);
    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createClient();
    const { data: sub } = await supabase
        .from("subscriptions")
        .select("paddle_customer_id")
        .eq("user_id", user.id)
        .single();

    if (!sub?.paddle_customer_id) {
        return NextResponse.json({ error: "No customer found" }, { status: 404 });
    }

    const paddleEnv = process.env.NEXT_PUBLIC_PADDLE_ENVIRONMENT === "production"
        ? "api.paddle.com"
        : "sandbox-api.paddle.com";

    let res: Response;
    try {
        res = await fetch(
            `https://${paddleEnv}/customers/${sub.paddle_customer_id}/portal-sessions`,
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${process.env.PADDLE_API_KEY}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({}),
            },
        );
    } catch {
        return NextResponse.json({ error: "Failed to reach Paddle" }, { status: 500 });
    }

    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        console.error("Paddle portal error:", err);
        return NextResponse.json({ error: "Failed to create portal session" }, { status: 500 });
    }

    const data = await res.json();
    const url = data?.data?.urls?.general?.overview as string | undefined;

    if (!url) {
        return NextResponse.json({ error: "No portal URL returned" }, { status: 500 });
    }

    return NextResponse.json({ url });
}
