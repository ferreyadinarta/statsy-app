import { createClient } from "@/lib/supabase/server";
import type { Plan, GraceInfo } from "@/lib/plan-shared";
export type { Plan, GraceInfo } from "@/lib/plan-shared";
export { PLAN_LIMITS } from "@/lib/plan-shared";

export async function getUserPlan(userId: string): Promise<Plan> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("subscriptions")
    .select("plan, status, current_period_end")
    .eq("user_id", userId)
    .single();

  if (!data) return "free";

  if (
    data.plan === "pro" &&
    (data.status === "active" || data.status === "trialing")
  ) {
    return "pro";
  }

  // Cancelled but still within paid period — keep pro until period ends
  if (data.status === "cancelled" && data.current_period_end) {
    if (new Date() < new Date(data.current_period_end)) return "pro";
  }

  // Past due: treat as pro during 7-day grace window
  if (data.status === "past_due" && data.current_period_end) {
    const graceEnd = new Date(data.current_period_end);
    graceEnd.setDate(graceEnd.getDate() + 7);
    if (new Date() < graceEnd) return "pro";
  }

  return "free";
}

export async function getGraceInfo(userId: string): Promise<GraceInfo> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("subscriptions")
    .select("status, current_period_end")
    .eq("user_id", userId)
    .single();

  if (!data || data.status !== "past_due" || !data.current_period_end) {
    return { inGrace: false, endsAt: null, daysLeft: 0 };
  }

  const graceEnd = new Date(data.current_period_end);
  graceEnd.setDate(graceEnd.getDate() + 7);
  const now = new Date();

  if (now >= graceEnd) return { inGrace: false, endsAt: graceEnd, daysLeft: 0 };

  const daysLeft = Math.ceil((graceEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return { inGrace: true, endsAt: graceEnd, daysLeft };
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
