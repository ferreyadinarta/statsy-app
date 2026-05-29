import { describe, it, expect } from "vitest";
import { computeTransition, type MaintenanceRow } from "./maintenance";

function row(overrides: Partial<MaintenanceRow>): MaintenanceRow {
  return {
    id: "m1",
    starts_at: "2026-06-01T02:00:00.000Z",
    ends_at: "2026-06-01T04:00:00.000Z",
    state: "scheduled",
    started_at: null,
    completed_at: null,
    notified_scheduled: false,
    notified_completed: false,
    ...overrides,
  };
}

describe("computeTransition", () => {
  it("keeps scheduled before start", () => {
    expect(computeTransition(row({}), new Date("2026-06-01T01:00:00Z")))
      .toEqual({ type: "none" });
  });

  it("moves scheduled -> in_progress at start", () => {
    expect(computeTransition(row({}), new Date("2026-06-01T02:00:00Z")))
      .toEqual({ type: "to_in_progress" });
  });

  it("moves in_progress -> completed at end", () => {
    expect(computeTransition(row({ state: "in_progress" }), new Date("2026-06-01T04:00:00Z")))
      .toEqual({ type: "to_completed" });
  });

  it("moves scheduled straight to completed if start was missed past end", () => {
    expect(computeTransition(row({}), new Date("2026-06-01T05:00:00Z")))
      .toEqual({ type: "to_completed" });
  });

  it("never transitions cancelled", () => {
    expect(computeTransition(row({ state: "cancelled" }), new Date("2026-06-01T05:00:00Z")))
      .toEqual({ type: "none" });
  });

  it("never transitions already completed", () => {
    expect(computeTransition(row({ state: "completed" }), new Date("2026-06-01T05:00:00Z")))
      .toEqual({ type: "none" });
  });
});
