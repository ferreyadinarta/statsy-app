import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { revalidateTag } from "next/cache";
import { timingSafeEqual } from "node:crypto";
import { sendTrialStartedEmail, sendRefundAccessRevokedEmail } from "@/lib/email";

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
    if (Math.abs(Date.now() / 1000 - Number(ts)) > 300) return false;

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

    const a = Buffer.from(computed, "hex");
    const b = Buffer.from(h1, "hex");
    return a.length === b.length && timingSafeEqual(a, b);
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
        console.warn("Paddle webhook: unknown subscription status:", s);
        return s;
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
        const scheduledChange = data?.scheduled_change as Record<
            string,
            unknown
        > | null;
        const isCancelScheduled = scheduledChange?.action === "cancel";

        // Idempotency guard: skip stale out-of-order events.
        // If DB already has "active" and this event says "trialing", it's an older event arriving late.
        const STATUS_RANK: Record<string, number> = { trialing: 0, active: 1, past_due: 2, paused: 3, cancelled: 4 };
        const incomingRank = STATUS_RANK[isCancelScheduled ? "cancelled" : mappedStatus] ?? -1;
        if (incomingRank >= 0) {
            const { data: existingSub } = await supabase
                .from("subscriptions")
                .select("status")
                .eq("user_id", userId)
                .single();
            const existingRank = STATUS_RANK[existingSub?.status ?? ""] ?? -1;
            // Only skip if existing is "active" and incoming is "trialing" (clear regression)
            // Allow other transitions (e.g. cancelled → trialing on resubscribe)
            if (existingSub && existingSub.status === "active" && mappedStatus === "trialing" && !isCancelScheduled) {
                console.warn("Paddle webhook: skipping stale trialing event for active subscription", userId);
                return NextResponse.json({ received: true });
            }
            void existingRank; // suppress unused warning
        }

        const { error } = await supabase.from("subscriptions").upsert(
            {
                user_id: userId,
                paddle_subscription_id: paddleSubId,
                paddle_customer_id: customerId,
                plan: "pro",
                status: isCancelScheduled ? "cancelled" : mappedStatus,
                current_period_end: currentPeriodEnd,
            },
            { onConflict: "user_id" },
        );

        if (error) {
            console.error("Supabase upsert error:", error);
            return NextResponse.json({ error: "DB error" }, { status: 500 });
        }
        revalidateTag(`user-plan-${userId}`, "seconds");

        // Send trial started email
        if (eventType === "subscription.created" && mapStatus(statusRaw) === "trialing") {
            const { data: userData } = await supabase.auth.admin.getUserById(userId);
            const userEmail = userData?.user?.email;
            if (userEmail) {
                sendTrialStartedEmail({ to: userEmail }).catch((e) =>
                    console.error("Failed to send trial started email:", e),
                );
            }
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
        revalidateTag(`user-plan-${userId}`, "seconds");
    }

    // Refund: revoke Pro access immediately + notify user
    if (eventType === "transaction.refunded") {
        const transactionSubId = data?.subscription_id as string | null;
        if (transactionSubId) {
            const { data: sub } = await supabase
                .from("subscriptions")
                .select("user_id")
                .eq("paddle_subscription_id", transactionSubId)
                .single();

            if (sub?.user_id) {
                await supabase
                    .from("subscriptions")
                    .update({ plan: "free", status: "cancelled" })
                    .eq("user_id", sub.user_id);
                revalidateTag(`user-plan-${sub.user_id}`, "seconds");

                const { data: userData } = await supabase.auth.admin.getUserById(sub.user_id);
                const userEmail = userData?.user?.email;
                if (userEmail) {
                    sendRefundAccessRevokedEmail({ to: userEmail }).catch((e) =>
                        console.error("Failed to send refund email:", e),
                    );
                }
            }
        }
    }

    return NextResponse.json({ received: true });
}
