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
