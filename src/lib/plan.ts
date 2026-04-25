import { createClient } from "@/lib/supabase/server";
import type { Plan, GraceInfo } from "@/lib/plan-shared";
export type { Plan, GraceInfo } from "@/lib/plan-shared";
export { PLAN_LIMITS } from "@/lib/plan-shared";

export async function getUserPlanAndGrace(
  userId: string,
): Promise<{ plan: Plan; graceInfo: GraceInfo }> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("subscriptions")
    .select("plan, status, current_period_end")
    .eq("user_id", userId)
    .single();

  if (!data) {
    return { plan: "free", graceInfo: { inGrace: false, endsAt: null, daysLeft: 0 } };
  }

  let plan: Plan = "free";
  let graceInfo: GraceInfo = { inGrace: false, endsAt: null, daysLeft: 0 };

  if (data.plan === "pro" && (data.status === "active" || data.status === "trialing")) {
    plan = "pro";
  } else if (data.status === "cancelled" && data.current_period_end) {
    if (new Date() < new Date(data.current_period_end)) plan = "pro";
  } else if (data.status === "past_due" && data.current_period_end) {
    const graceEnd = new Date(data.current_period_end);
    graceEnd.setDate(graceEnd.getDate() + 7);
    const now = new Date();
    if (now < graceEnd) {
      plan = "pro";
      const daysLeft = Math.ceil(
        (graceEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
      );
      graceInfo = { inGrace: true, endsAt: graceEnd, daysLeft };
    } else {
      graceInfo = { inGrace: false, endsAt: graceEnd, daysLeft: 0 };
    }
  }

  return { plan, graceInfo };
}

// Used by API routes and pages that need plan only (no grace info needed).
export async function getUserPlan(userId: string): Promise<Plan> {
  return (await getUserPlanAndGrace(userId)).plan;
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
