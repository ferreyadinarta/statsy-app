export type Plan = "free" | "pro";

export type GraceInfo = {
  inGrace: boolean;
  endsAt: Date | null;
  daysLeft: number;
};

export const PLAN_LIMITS = {
  free: {
    pages: 1,
    services: 3,
    subscribers: 30,
    historyDays: 30,
    activeMaintenance: 1 as number | null,
  },
  pro: {
    pages: 3,
    services: 10,
    subscribers: 500,
    historyDays: 90,
    activeMaintenance: null as number | null,
  },
};
