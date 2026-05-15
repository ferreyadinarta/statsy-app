import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { promises as dns } from "dns";
import { isIP } from "net";
import { sendOwnerStatusAlert, sendSubscriberStatusChangeAlert } from "@/lib/email";

const DEFAULT_DEGRADED_THRESHOLD_MS = 3000;
const PING_TIMEOUT_MS = 5000;
const CONSECUTIVE_FAILURE_THRESHOLD = 2;
const CONSECUTIVE_SLOW_THRESHOLD = 2;

function isPrivateIp(ip: string): boolean {
  if (ip === "::1" || ip === "::" || ip === "0:0:0:0:0:0:0:1") return true;
  return [
    /^127\./,
    /^10\./,
    /^172\.(1[6-9]|2\d|3[01])\./,
    /^192\.168\./,
    /^169\.254\./,
    /^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./,
    /^0\./,
    /^::ffff:127\./,
  ].some((re) => re.test(ip));
}

type UrlCheck = "safe" | "blocked" | "unresolvable";

async function checkUrl(urlStr: string): Promise<UrlCheck> {
  let url: URL;
  try {
    url = new URL(urlStr);
  } catch {
    return "unresolvable";
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return "blocked";
  const hostname = url.hostname;
  if (isIP(hostname)) return isPrivateIp(hostname) ? "blocked" : "safe";
  try {
    const { address } = await dns.lookup(hostname, { family: 4 });
    return isPrivateIp(address) ? "blocked" : "safe";
  } catch {
    return "unresolvable";
  }
}

type ServiceRow = {
  id: string;
  name: string;
  user_id: string;
  status_page_id: string;
  monitor_url: string;
  last_checked_at: string | null;
  next_check_at: string | null;
  check_interval_minutes: number | null;
  degraded_threshold_ms: number | null;
  status: "operational" | "degraded" | "outage";
  consecutive_failures: number;
  consecutive_slow_responses: number;
};

type SubscriptionRow = {
  user_id: string;
  plan: string;
  status: string;
  current_period_end: string | null;
};

type PageRow = {
  id: string;
  name: string;
  slug: string;
  user_id: string;
};

function resolvePlan(sub: SubscriptionRow | undefined): "free" | "pro" {
  if (!sub) return "free";
  if (sub.plan === "pro" && (sub.status === "active" || sub.status === "trialing")) return "pro";
  if (sub.status === "cancelled" && sub.current_period_end && new Date() < new Date(sub.current_period_end)) return "pro";
  return "free";
}

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  // Only fetch services that are due — uses index on next_check_at
  const { data: dueServices, error } = await supabase
    .from("services")
    .select("id, name, user_id, status_page_id, monitor_url, last_checked_at, next_check_at, check_interval_minutes, degraded_threshold_ms, status, consecutive_failures, consecutive_slow_responses")
    .not("monitor_url", "is", null)
    .or(`next_check_at.is.null,next_check_at.lte.${new Date().toISOString()}`);

  if (error || !dueServices) {
    console.error("run-checks fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch services" }, { status: 500 });
  }

  if (dueServices.length === 0) return NextResponse.json({ checked: 0 });

  // Only fetch subscriptions for users with due services
  const userIds = [...new Set((dueServices as ServiceRow[]).map((s) => s.user_id))];
  const { data: subscriptions } = await supabase
    .from("subscriptions")
    .select("user_id, plan, status, current_period_end")
    .in("user_id", userIds);

  const planMap = new Map<string, "free" | "pro">();
  for (const userId of userIds) {
    const sub = (subscriptions as SubscriptionRow[] | null)?.find((s) => s.user_id === userId);
    planMap.set(userId, resolvePlan(sub));
  }

  // Batch-fetch status pages for notification emails
  const pageIds = [...new Set(dueServices.map((s) => s.status_page_id))];
  const { data: pages } = await supabase
    .from("status_pages")
    .select("id, name, slug, user_id")
    .in("id", pageIds);
  const pageMap = new Map<string, PageRow>((pages as PageRow[] | null)?.map((p) => [p.id, p]) ?? []);

  await Promise.all(
    dueServices.map(async (service) => {
      const start = Date.now();
      let statusCode: number | null = null;
      let responseTimeMs: number | null = null;
      let pingFailed = false;

      try {
        const urlCheck = await checkUrl(service.monitor_url);
        if (urlCheck === "blocked") {
          const p = planMap.get(service.user_id) ?? "free";
          const iMs = p === "pro" ? Math.max(1, service.check_interval_minutes ?? 1) * 60_000 : 5 * 60_000;
          await supabase
            .from("services")
            .update({ last_checked_at: new Date().toISOString(), next_check_at: new Date(Date.now() + iMs).toISOString(), last_status_code: null })
            .eq("id", service.id);
          return;
        }
        if (urlCheck === "unresolvable") {
          pingFailed = true;
          responseTimeMs = Date.now() - start;
        } else {

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), PING_TIMEOUT_MS);
        const res = await fetch(service.monitor_url, {
          method: "GET",
          signal: controller.signal,
          redirect: "manual",
        });
        clearTimeout(timeoutId);
        responseTimeMs = Date.now() - start;
        statusCode = res.status;

        const isUp = res.ok || (res.status >= 300 && res.status < 400) || res.status === 401 || res.status === 403;
        if (!isUp) pingFailed = true;
        } // end else (safe url)
      } catch {
        responseTimeMs = Date.now() - start;
        pingFailed = true;
      }

      // Determine new status using consecutive thresholds for both outage and degraded
      const degradedThresholdMs = service.degraded_threshold_ms ?? DEFAULT_DEGRADED_THRESHOLD_MS;

      let newConsecutiveFailures: number;
      let newConsecutiveSlowResponses: number;
      let newStatus: "operational" | "degraded" | "outage";

      if (pingFailed) {
        newConsecutiveFailures = (service.consecutive_failures ?? 0) + 1;
        newConsecutiveSlowResponses = 0;
        newStatus = newConsecutiveFailures >= CONSECUTIVE_FAILURE_THRESHOLD
          ? "outage"
          : service.status;
      } else {
        newConsecutiveFailures = 0;
        const isSlow = (responseTimeMs ?? 0) >= degradedThresholdMs;
        newConsecutiveSlowResponses = isSlow ? (service.consecutive_slow_responses ?? 0) + 1 : 0;
        if (isSlow && newConsecutiveSlowResponses >= CONSECUTIVE_SLOW_THRESHOLD) {
          newStatus = "degraded";
        } else if (!isSlow) {
          newStatus = "operational";
        } else {
          newStatus = service.status;
        }
      }

      const statusChanged = newStatus !== service.status;
      const countsChanged =
        newConsecutiveFailures !== (service.consecutive_failures ?? 0) ||
        newConsecutiveSlowResponses !== (service.consecutive_slow_responses ?? 0);

      const plan = planMap.get(service.user_id) ?? "free";
      const intervalMs = plan === "pro"
        ? Math.max(1, service.check_interval_minutes ?? 1) * 60_000
        : 5 * 60_000;
      const nextCheckAt = new Date(Date.now() + intervalMs).toISOString();
      const now_iso = new Date().toISOString();

      if (statusChanged || countsChanged) {
        await supabase
          .from("services")
          .update({
            status: newStatus,
            last_checked_at: now_iso,
            next_check_at: nextCheckAt,
            last_status_code: statusCode,
            response_time_ms: responseTimeMs,
            consecutive_failures: newConsecutiveFailures,
            consecutive_slow_responses: newConsecutiveSlowResponses,
          })
          .eq("id", service.id);
      } else {
        await supabase
          .from("services")
          .update({ last_checked_at: now_iso, next_check_at: nextCheckAt, response_time_ms: responseTimeMs })
          .eq("id", service.id);
      }

      // Send notifications only on status change
      if (newStatus !== service.status) {
        const page = pageMap.get(service.status_page_id);
        if (!page) return;

        const isPro = planMap.get(service.user_id) === "pro";

        // Owner alert — fetch email only when needed
        const { data: ownerData } = await supabase.auth.admin.getUserById(service.user_id);
        const ownerEmail = ownerData.user?.email;
        if (ownerEmail) {
          sendOwnerStatusAlert({
            to: ownerEmail,
            serviceName: service.name,
            newStatus,
            pageSlug: page.slug,
            pageName: page.name,
          }).catch((e) => console.error("Owner alert failed:", e));
        }

        // Subscriber alerts
        const { data: subscribers } = await supabase
          .from("subscribers")
          .select("email, token")
          .eq("status_page_id", service.status_page_id);

        if (subscribers && subscribers.length > 0) {
          sendSubscriberStatusChangeAlert({
            subscribers,
            serviceName: service.name,
            newStatus,
            pageSlug: page.slug,
            pageName: page.name,
            isPro,
          }).catch((e) => console.error("Subscriber alerts failed:", e));
        }
      }
    }),
  );

  return NextResponse.json({ checked: dueServices.length });
}
