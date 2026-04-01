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
    return NextResponse.json({ error: "Already cancelled" }, { status: 400 });
  }

  const paddleEnv =
    process.env.PADDLE_ENVIRONMENT === "production"
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
    console.error("Paddle cancel error:", err);
    return NextResponse.json(
      { error: "Failed to cancel with Paddle" },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true });
}
