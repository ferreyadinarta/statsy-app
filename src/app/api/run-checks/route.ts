import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { promises as dns } from "dns";
import { isIP } from "net";
import { sendOwnerStatusAlert, sendSubscriberStatusChangeAlert } from "@/lib/email";

const DEFAULT_DEGRADED_THRESHOLD_MS = 3000;
const PING_TIMEOUT_MS = 5000;
const CONSECUTIVE_FAILURE_THRESHOLD = 2;
const CONSECUTIVE_SLOW_THRESHOLD = 2;
const CHECK_CONCURRENCY = 10;
const SUBSCRIBER_LIMIT = 500;
// Only write display metrics (response_time_ms, last_checked_at) this often for stable services.
// Between refreshes, only next_check_at is written — drastically reduces DB writes/autovacuum IO.
const DISPLAY_REFRESH_MS = 15 * 60 * 1000;

function isPrivateIp(ip: string): boolean {
  // Unwrap IPv6-mapped IPv4 (e.g. ::ffff:192.168.1.1 → 192.168.1.1)
  const mapped = ip.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/i);
  if (mapped) ip = mapped[1];

  if (ip === "::1" || ip === "::" || ip === "0:0:0:0:0:0:0:1") return true;
  return [
    /^127\./,
    /^10\./,
    /^172\.(1[6-9]|2\d|3[01])\./,
    /^192\.168\./,
    /^169\.254\./,
    /^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./,
    /^0\./,
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
    // Try IPv4 first, fall back to IPv6 — check both for private ranges
    let address: string;
    try {
      ({ address } = await dns.lookup(hostname, { family: 4 }));
    } catch {
      ({ address } = await dns.lookup(hostname, { family: 6 }));
    }
    return isPrivateIp(address) ? "blocked" : "safe";
  } catch {
    return "unresolvable";
  }
}

async function runWithConcurrency<T>(
  items: T[],
  concurrency: number,
  fn: (item: T) => Promise<void>,
): Promise<void> {
  const queue = [...items];
  async function worker() {
    while (queue.length > 0) {
      const item = queue.shift()!;
      await fn(item);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, worker));
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

type NotificationTask = {
  serviceName: string;
  statusPageId: string;
  newStatus: "operational" | "degraded" | "outage";
  isPro: boolean;
  ownerEmail: string | undefined;
};

function resolvePlan(sub: SubscriptionRow | undefined): "free" | "pro" {
  if (!sub) return "free";
  if (sub.plan === "pro" && (sub.status === "active" || sub.status === "trialing")) return "pro";
  if (sub.status === "cancelled" && sub.current_period_end && new Date() < new Date(sub.current_period_end)) return "pro";
  return "free";
}

function getIntervalMs(plan: "free" | "pro", checkIntervalMinutes: number | null): number {
  return plan === "pro" ? Math.max(1, checkIntervalMinutes ?? 1) * 60_000 : 10 * 60_000;
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

  const runAt = new Date().toISOString();

  // Only fetch services that are due — uses index on next_check_at
  const { data: dueServices, error } = await supabase
    .from("services")
    .select("id, name, user_id, status_page_id, monitor_url, last_checked_at, next_check_at, check_interval_minutes, degraded_threshold_ms, status, consecutive_failures, consecutive_slow_responses")
    .not("monitor_url", "is", null)
    .or(`next_check_at.is.null,next_check_at.lte.${runAt}`);

  if (error || !dueServices) {
    console.error("run-checks fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch services" }, { status: 500 });
  }

  if (dueServices.length === 0) return NextResponse.json({ checked: 0 });

  const userIds = [...new Set((dueServices as ServiceRow[]).map((s) => s.user_id))];

  // Fetch plans and owner emails upfront — both needed before checks run to resolve intervals
  const [subscriptionsResult, ...ownerResults] = await Promise.all([
    supabase
      .from("subscriptions")
      .select("user_id, plan, status, current_period_end")
      .in("user_id", userIds),
    ...userIds.map((uid) => supabase.auth.admin.getUserById(uid)),
  ]);

  const planMap = new Map<string, "free" | "pro">();
  for (const userId of userIds) {
    const sub = (subscriptionsResult.data as SubscriptionRow[] | null)?.find((s) => s.user_id === userId);
    planMap.set(userId, resolvePlan(sub));
  }

  const ownerEmailMap = new Map<string, string>();
  userIds.forEach((uid, i) => {
    const email = ownerResults[i]?.data?.user?.email;
    if (email) ownerEmailMap.set(uid, email);
  });

  // Collect status changes during checks — status_pages fetched lazily below only if needed
  const notificationTasks: NotificationTask[] = [];

  await runWithConcurrency(dueServices as ServiceRow[], CHECK_CONCURRENCY, async (service) => {
    const plan = planMap.get(service.user_id) ?? "free";
    const intervalMs = getIntervalMs(plan, service.check_interval_minutes);
    const nextCheckAt = new Date(Date.now() + intervalMs).toISOString();
    const lastWrite = service.last_checked_at
      ? Date.now() - new Date(service.last_checked_at).getTime()
      : Infinity;

    const start = Date.now();
    let statusCode: number | null = null;
    let responseTimeMs: number | null = null;
    let pingFailed = false;

    try {
      const urlCheck = await checkUrl(service.monitor_url);
      if (urlCheck === "blocked" || urlCheck === "unresolvable") {
        // blocked = SSRF-protected; unresolvable = DNS flap or invalid domain.
        // Both advance the schedule without counting as a failure to avoid false positives.
        const payload = lastWrite >= DISPLAY_REFRESH_MS
          ? { last_checked_at: runAt, next_check_at: nextCheckAt, last_status_code: null }
          : { next_check_at: nextCheckAt };
        await supabase.from("services").update(payload).eq("id", service.id);
        return;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), PING_TIMEOUT_MS);
      try {
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
      } catch (fetchErr) {
        clearTimeout(timeoutId);
        responseTimeMs = Date.now() - start;
        pingFailed = true;
        if (!(fetchErr instanceof Error && fetchErr.name === "AbortError")) {
          console.error(`run-checks fetch error for service ${service.id}:`, fetchErr);
        }
      }
    } catch (err) {
      responseTimeMs = Date.now() - start;
      pingFailed = true;
      console.error(`run-checks unexpected error for service ${service.id}:`, err);
    }

    const degradedThresholdMs = service.degraded_threshold_ms ?? DEFAULT_DEGRADED_THRESHOLD_MS;

    let newConsecutiveFailures: number;
    let newConsecutiveSlowResponses: number;
    let newStatus: "operational" | "degraded" | "outage";

    if (pingFailed) {
      newConsecutiveFailures = (service.consecutive_failures ?? 0) + 1;
      newConsecutiveSlowResponses = 0;
      newStatus = newConsecutiveFailures >= CONSECUTIVE_FAILURE_THRESHOLD ? "outage" : service.status;
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

    if (statusChanged || countsChanged) {
      await supabase
        .from("services")
        .update({
          status: newStatus,
          last_checked_at: runAt,
          next_check_at: nextCheckAt,
          last_status_code: statusCode,
          response_time_ms: responseTimeMs,
          consecutive_failures: newConsecutiveFailures,
          consecutive_slow_responses: newConsecutiveSlowResponses,
        })
        .eq("id", service.id);
    } else {
      const payload = lastWrite >= DISPLAY_REFRESH_MS
        ? { last_checked_at: runAt, next_check_at: nextCheckAt, response_time_ms: responseTimeMs }
        : { next_check_at: nextCheckAt };
      await supabase.from("services").update(payload).eq("id", service.id);
    }

    if (statusChanged) {
      notificationTasks.push({
        serviceName: service.name,
        statusPageId: service.status_page_id,
        newStatus,
        isPro: plan === "pro",
        ownerEmail: ownerEmailMap.get(service.user_id),
      });
    }
  });

  // Only fetch status_pages when there are actual status changes to notify about
  if (notificationTasks.length > 0) {
    const changedPageIds = [...new Set(notificationTasks.map((t) => t.statusPageId))];
    const { data: pages } = await supabase
      .from("status_pages")
      .select("id, name, slug, user_id")
      .in("id", changedPageIds);
    const pageMap = new Map<string, PageRow>((pages as PageRow[] | null)?.map((p) => [p.id, p]) ?? []);

    for (const task of notificationTasks) {
      const page = pageMap.get(task.statusPageId);
      if (!page) continue;

      if (task.ownerEmail) {
        sendOwnerStatusAlert({
          to: task.ownerEmail,
          serviceName: task.serviceName,
          newStatus: task.newStatus,
          pageSlug: page.slug,
          pageName: page.name,
        }).catch((e) => console.error("Owner alert failed:", e));
      }

      let offset = 0;
      while (true) {
        const { data: subscribers } = await supabase
          .from("subscribers")
          .select("email, token")
          .eq("status_page_id", task.statusPageId)
          .range(offset, offset + SUBSCRIBER_LIMIT - 1);

        if (!subscribers || subscribers.length === 0) break;

        sendSubscriberStatusChangeAlert({
          subscribers,
          serviceName: task.serviceName,
          newStatus: task.newStatus,
          pageSlug: page.slug,
          pageName: page.name,
          isPro: task.isPro,
        }).catch((e) => console.error("Subscriber alerts failed:", e));

        if (subscribers.length < SUBSCRIBER_LIMIT) break;
        offset += SUBSCRIBER_LIMIT;
      }
    }
  }

  return NextResponse.json({ checked: dueServices.length });
}
