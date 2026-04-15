import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getServiceClient() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );
}

async function verifyPaddleSignature(
    rawBody: string,
    signatureHeader: string | null,
    secret: string,
): Promise<boolean> {
    if (!signatureHeader) return false;

    const ts = signatureHeader.match(/ts=(\d+)/)?.[1];
    const h1 = signatureHeader.match(/h1=([a-f0-9]+)/)?.[1];

    if (!ts || !h1) return false;

    const payload = `${ts}:${rawBody}`;
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
        "raw",
        encoder.encode(secret),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"],
    );
    const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
    const computed = Array.from(new Uint8Array(sig))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

    return computed === h1;
}

export async function POST(req: NextRequest) {
    const rawBody = await req.text();
    const signatureHeader = req.headers.get("paddle-signature");
    const secret = process.env.PADDLE_WEBHOOK_SECRET!;

    const isValid = await verifyPaddleSignature(
        rawBody,
        signatureHeader,
        secret,
    );
    if (!isValid) {
        console.error("Invalid Paddle webhook signature");
        console.error("Header:", signatureHeader);
        console.error("Secret length:", secret?.length);
        return NextResponse.json(
            { error: "Invalid signature" },
            { status: 401 },
        );
    }

    let event: Record<string, unknown>;
    try {
        event = JSON.parse(rawBody);
    } catch {
        return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const eventType = event.event_type as string;
    const data = event.data as Record<string, unknown>;

    const supabase = getServiceClient();

    const paddleSubId = data?.id as string;
    const customerId = data?.customer_id as string;
    const userId = (data?.custom_data as Record<string, string>)?.user_id;
    const statusRaw = data?.status as string;
    const currentPeriodEnd =
        (data?.current_billing_period as Record<string, string>)?.ends_at ??
        null;

    function mapStatus(s: string): string {
        if (s === "active") return "active";
        if (s === "trialing") return "trialing";
        if (s === "canceled" || s === "cancelled") return "cancelled";
        if (s === "past_due") return "past_due";
        if (s === "paused") return "paused";
        return "active";
    }

    if (!userId) {
        console.warn("Paddle webhook: no user_id in custom_data", eventType);
        return NextResponse.json({ received: true });
    }

    if (
        eventType === "subscription.created" ||
        eventType === "subscription.updated"
    ) {
        const mappedStatus = mapStatus(statusRaw);
        const plan =
            mappedStatus === "cancelled" || mappedStatus === "paused"
                ? "free"
                : "pro";

        const { error } = await supabase.from("subscriptions").upsert(
            {
                user_id: userId,
                paddle_subscription_id: paddleSubId,
                paddle_customer_id: customerId,
                plan,
                status: mappedStatus,
                current_period_end: currentPeriodEnd,
            },
            { onConflict: "user_id" },
        );

        if (error) {
            console.error("Supabase upsert error:", error);
            return NextResponse.json({ error: "DB error" }, { status: 500 });
        }
    }

    if (eventType === "subscription.cancelled") {
        const { error } = await supabase.from("subscriptions").upsert(
            {
                user_id: userId,
                paddle_subscription_id: paddleSubId,
                paddle_customer_id: customerId,
                plan: "free",
                status: "cancelled",
                current_period_end: currentPeriodEnd,
            },
            { onConflict: "user_id" },
        );

        if (error) {
            console.error("Supabase upsert error:", error);
            return NextResponse.json({ error: "DB error" }, { status: 500 });
        }
    }

    return NextResponse.json({ received: true });
}
