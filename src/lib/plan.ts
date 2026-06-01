import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { unstable_cache } from "next/cache";
import type { Plan, GraceInfo } from "@/lib/plan-shared";
export type { Plan, GraceInfo } from "@/lib/plan-shared";
export { PLAN_LIMITS } from "@/lib/plan-shared";

type SubscriptionRow = {
  plan: string;
  status: string;
  current_period_end: string | null;
} | null;

export type TrialInfo = {
  isTrialing: boolean;
  endsAt: Date | null;
  daysLeft: number;
};

// Per-user cached subscription fetch — invalidated by Paddle webhook via
// revalidateTag(`user-plan-${userId}`). Service role client used so no
// session cookies are baked into the cache entry.
function getSubscriptionCache(userId: string) {
  return unstable_cache(
    async (): Promise<SubscriptionRow> => {
      const supabase = createServiceClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
      );
      const { data } = await supabase
        .from("subscriptions")
        .select("plan, status, current_period_end")
        .eq("user_id", userId)
        .single();
      return data ?? null;
    },
    [`subscription-${userId}`],
    { tags: [`user-plan-${userId}`], revalidate: 3600 },
  );
}

function computePlanAndGrace(data: SubscriptionRow): { plan: Plan; graceInfo: GraceInfo; trialInfo: TrialInfo } {
  const noTrial: TrialInfo = { isTrialing: false, endsAt: null, daysLeft: 0 };

  if (!data) {
    return { plan: "free", graceInfo: { inGrace: false, endsAt: null, daysLeft: 0 }, trialInfo: noTrial };
  }

  let plan: Plan = "free";
  let graceInfo: GraceInfo = { inGrace: false, endsAt: null, daysLeft: 0 };
  let trialInfo: TrialInfo = noTrial;

  if (data.plan === "pro" && (data.status === "active" || data.status === "trialing")) {
    plan = "pro";
    if (data.status === "trialing" && data.current_period_end) {
      const endsAt = new Date(data.current_period_end);
      const daysLeft = Math.max(0, Math.ceil((endsAt.getTime() - Date.now()) / 86400000));
      trialInfo = { isTrialing: true, endsAt, daysLeft };
    }
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

  return { plan, graceInfo, trialInfo };
}

export async function getUserPlanAndGrace(
  userId: string,
): Promise<{ plan: Plan; graceInfo: GraceInfo; trialInfo: TrialInfo }> {
  const data = await getSubscriptionCache(userId)();
  return computePlanAndGrace(data);
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
