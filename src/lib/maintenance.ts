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
