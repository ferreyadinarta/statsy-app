import { describe, it, expect } from "vitest";
import { computeTransition, type MaintenanceRow } from "./maintenance";
import { dayKey, maintenanceDayKeys, computeUptimeBars } from "./maintenance";

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

describe("dayKey", () => {
  it("returns YYYY-MM-DD in UTC", () => {
    expect(dayKey(new Date("2026-06-01T23:30:00Z"))).toBe("2026-06-01");
  });
});

describe("maintenanceDayKeys", () => {
  it("ignores scheduled and cancelled windows", () => {
    const keys = maintenanceDayKeys(
      [
        { starts_at: "2026-06-01T02:00:00Z", ends_at: "2026-06-01T04:00:00Z", state: "scheduled" },
        { starts_at: "2026-06-01T02:00:00Z", ends_at: "2026-06-01T04:00:00Z", state: "cancelled" },
      ],
      new Date("2026-06-10T00:00:00Z"),
    );
    expect(keys.size).toBe(0);
  });

  it("marks each day a completed window spans", () => {
    const keys = maintenanceDayKeys(
      [{ starts_at: "2026-06-01T22:00:00Z", ends_at: "2026-06-02T03:00:00Z", state: "completed" }],
      new Date("2026-06-10T00:00:00Z"),
    );
    expect(keys.has("2026-06-01")).toBe(true);
    expect(keys.has("2026-06-02")).toBe(true);
  });

  it("clamps an in_progress window to now", () => {
    const keys = maintenanceDayKeys(
      [{ starts_at: "2026-06-01T00:00:00Z", ends_at: "2026-06-05T00:00:00Z", state: "in_progress" }],
      new Date("2026-06-02T12:00:00Z"),
    );
    expect(keys.has("2026-06-02")).toBe(true);
    expect(keys.has("2026-06-04")).toBe(false);
  });
});

describe("computeUptimeBars", () => {
  const today = new Date("2026-06-10T12:00:00Z");

  it("is 100% with no incidents", () => {
    const { uptimePct, bars } = computeUptimeBars({
      days: 30, today, incidentDayKeys: new Set(), maintenanceDayKeys: new Set(),
    });
    expect(uptimePct).toBe("100.0");
    expect(bars).toHaveLength(30);
  });

  it("incident lowers uptime", () => {
    const { uptimePct } = computeUptimeBars({
      days: 10, today, incidentDayKeys: new Set(["2026-06-05"]), maintenanceDayKeys: new Set(),
    });
    expect(uptimePct).toBe("90.0"); // 9 good / 10
  });

  it("maintenance is excluded from the denominator (neutral)", () => {
    const { uptimePct, bars } = computeUptimeBars({
      days: 10, today,
      incidentDayKeys: new Set(),
      maintenanceDayKeys: new Set(["2026-06-05"]),
    });
    expect(uptimePct).toBe("100.0"); // 9 good / (10 - 1 maintenance)
    expect(bars.find((b) => b.status === "maintenance")).toBeTruthy();
  });

  it("incident wins when a day has both", () => {
    const { bars, uptimePct } = computeUptimeBars({
      days: 10, today,
      incidentDayKeys: new Set(["2026-06-05"]),
      maintenanceDayKeys: new Set(["2026-06-05"]),
    });
    const day5 = bars.find((b) => dayKey(b.date) === "2026-06-05");
    expect(day5?.status).toBe("incident");
    expect(uptimePct).toBe("90.0"); // not excluded, counts as incident
  });
});
