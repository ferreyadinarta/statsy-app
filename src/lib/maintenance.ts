import type { SupabaseClient } from "@supabase/supabase-js";
import { sendMaintenanceScheduled, sendMaintenanceCompleted } from "@/lib/email";

export type MaintenanceState =
  | "scheduled"
  | "in_progress"
  | "completed"
  | "cancelled";

export interface MaintenanceRow {
  id: string;
  starts_at: string;
  ends_at: string;
  state: MaintenanceState;
  started_at: string | null;
  completed_at: string | null;
  notified_scheduled: boolean;
  notified_completed: boolean;
}

export type TransitionAction =
  | { type: "none" }
  | { type: "to_in_progress" }
  | { type: "to_completed" };

// Pure: given a window and the current time, what time-derived transition applies.
// Manual terminal states (completed, cancelled) are never moved.
export function computeTransition(row: MaintenanceRow, now: Date): TransitionAction {
  if (row.state === "completed" || row.state === "cancelled") return { type: "none" };
  const starts = new Date(row.starts_at);
  const ends = new Date(row.ends_at);
  if (now >= ends) return { type: "to_completed" };
  if (now >= starts) return { type: "to_in_progress" };
  return { type: "none" };
}

export type DayStatus = "operational" | "incident" | "maintenance";

export function dayKey(d: Date): string {
  const x = new Date(d);
  x.setUTCHours(0, 0, 0, 0);
  return x.toISOString().split("T")[0];
}

// Day-keys (UTC) covered by windows that actually happened (in_progress or completed),
// clamped so an in_progress window never extends past `now`.
export function maintenanceDayKeys(
  windows: { starts_at: string; ends_at: string; state: MaintenanceState }[],
  now: Date,
): Set<string> {
  const keys = new Set<string>();
  for (const w of windows) {
    if (w.state === "scheduled" || w.state === "cancelled") continue;
    const start = new Date(w.starts_at);
    const end = new Date(
      Math.min(new Date(w.ends_at).getTime(), now.getTime()),
    );
    const cursor = new Date(start);
    cursor.setUTCHours(0, 0, 0, 0);
    while (cursor <= end) {
      keys.add(dayKey(cursor));
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }
  }
  return keys;
}

// Builds the public-page uptime bars. A day is "maintenance" only when it has a
// maintenance window AND no incident (incident wins). Maintenance days are
// excluded from the uptime % denominator.
export function computeUptimeBars(opts: {
  days: number;
  today: Date;
  incidentDayKeys: Set<string>;
  maintenanceDayKeys: Set<string>;
}): { bars: { date: Date; status: DayStatus }[]; uptimePct: string } {
  const { days, today, incidentDayKeys, maintenanceDayKeys: mKeys } = opts;
  const base = new Date(today);
  base.setUTCHours(0, 0, 0, 0);

  const bars: { date: Date; status: DayStatus }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(base);
    d.setUTCDate(d.getUTCDate() - i);
    const key = dayKey(d);
    let status: DayStatus = "operational";
    if (incidentDayKeys.has(key)) status = "incident";
    else if (mKeys.has(key)) status = "maintenance";
    bars.push({ date: d, status });
  }

  const maintenanceDays = bars.filter((b) => b.status === "maintenance").length;
  const goodDays = bars.filter((b) => b.status === "operational").length;
  const denom = days - maintenanceDays;
  const uptimePct = denom > 0 ? ((goodDays / denom) * 100).toFixed(1) : "100.0";
  return { bars, uptimePct };
}

// Formats the window range for emails/UI, e.g. "Sat, Jun 6, 2:00 AM – 4:00 AM UTC".
export function formatWindowRange(startsAt: string, endsAt: string): string {
  const opts: Intl.DateTimeFormatOptions = {
    weekday: "short", month: "short", day: "numeric",
    hour: "numeric", minute: "2-digit", timeZone: "UTC",
  };
  const s = new Date(startsAt).toLocaleString("en-US", opts);
  const e = new Date(endsAt).toLocaleString("en-US", {
    hour: "numeric", minute: "2-digit", timeZone: "UTC",
  });
  return `${s} – ${e} UTC`;
}

// Fetches subscribers (service role bypasses RLS) and sends the chosen email kind.
export async function notifyMaintenance(
  serviceClient: SupabaseClient,
  opts: {
    kind: "scheduled" | "completed";
    statusPageId: string;
    pageSlug: string;
    pageName: string;
    title: string;
    message: string;
    startsAt: string;
    endsAt: string;
  },
): Promise<number> {
  const { data: subscribers } = await serviceClient
    .from("subscribers")
    .select("email, token")
    .eq("status_page_id", opts.statusPageId);

  if (!subscribers || subscribers.length === 0) return 0;

  const to = subscribers.map((s) => s.email as string);
  const unsubscribeTokens = Object.fromEntries(
    subscribers.map((s) => [s.email as string, s.token as string]),
  );
  const payload = {
    to,
    pageSlug: opts.pageSlug,
    pageName: opts.pageName,
    title: opts.title,
    message: opts.message,
    whenLabel: formatWindowRange(opts.startsAt, opts.endsAt),
    unsubscribeTokens,
  };

  if (opts.kind === "scheduled") await sendMaintenanceScheduled(payload);
  else await sendMaintenanceCompleted(payload);
  return to.length;
}
