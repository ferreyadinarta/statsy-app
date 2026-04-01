import { createClient } from "@/lib/supabase/server";

export type Plan = "free" | "pro";

export const PLAN_LIMITS = {
  free: {
    pages: 1,
    services: 3,
    subscribers: 30,
    historyDays: 7,
  },
  pro: {
    pages: 3,
    services: 10,
    subscribers: 500,
    historyDays: 90,
  },
};

export async function getUserPlan(userId: string): Promise<Plan> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("subscriptions")
    .select("plan, status")
    .eq("user_id", userId)
    .single();

  // If no row exists yet, they're on free
  if (!data) return "free";

  // Only count active/trialing as Pro
  if (
    data.plan === "pro" &&
    (data.status === "active" || data.status === "trialing")
  ) {
    return "pro";
  }

  return "free";
}

export async function getUserPlanFull(userId: string) {
  const supabase = await createClient();

  const { data } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)
    .single();

  return data ?? null;
}
