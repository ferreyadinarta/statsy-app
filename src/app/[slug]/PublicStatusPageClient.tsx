"use client";

import IncidentCard from "@/components/incidents/IncidentCard";
import { useEffect, useState } from "react";

type IncidentUpdate = {
  id: string;
  message: string;
  status: "investigating" | "identified" | "monitoring" | "resolved";
  created_at: string;
};

type Incident = {
  id: string;
  title: string;
  description: string | null;
  status: "investigating" | "identified" | "monitoring" | "resolved";
  status_page_id: string;
  created_at: string;
  incident_updates: IncidentUpdate[];
};

type Service = {
  id: string;
  name: string;
  status: "operational" | "degraded" | "outage";
  created_at: string;
};

type StatusPage = {
  id: string;
  name: string;
  slug: string;
};

type Props = {
  page: StatusPage;
  services: Service[];
  incidents: Incident[];
  incidentDays: number;
  lastUpdated: string | null;
};

const POLL_INTERVAL = 60_000;

const INITIAL_SHOW = 3;

type UptimeBar = { date: Date; status: "operational" | "incident" };

function UptimeBarTrack({
  bars,
  barHeight,
  gap,
  showLabel,
  labelText,
  className = "",
}: {
  bars: UptimeBar[];
  barHeight: number;
  gap: number;
  showLabel?: boolean;
  labelText?: string;
  className?: string;
}) {
  return (
    <div className={`w-full ${className}`}>
      <div className="flex" style={{ gap: `${gap}px` }}>
        {bars.map((bar, i) => {
          const total = bars.length;
          const isFirst = i < 4;
          const isLast = i > total - 5;
          const tooltipAlign = isFirst ? "left-0" : isLast ? "right-0" : "left-1/2 -translate-x-1/2";
          const arrowAlign = isFirst ? "left-3" : isLast ? "right-3" : "left-1/2 -translate-x-1/2";
          return (
            <div key={i} className="flex-1 relative group" style={{ minWidth: 0 }}>
              <div
                className="w-full rounded-[3px] cursor-default transition-all duration-150 group-hover:brightness-125 group-hover:scale-y-110 origin-bottom"
                style={{
                  height: `${barHeight}px`,
                  background: bar.status === "operational" ? "#1a7a4a" : "#e8500a",
                }}
              />
              <div className={`absolute bottom-full mb-2 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-20 ${tooltipAlign}`}>
                <div className="px-2.5 py-1.5 rounded-[5px] shadow-xl" style={{ background: "#1a1714", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <p className="text-[11px] font-bold whitespace-nowrap" style={{ color: "#f5f2eb" }}>
                    {bar.date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </p>
                  <p className="text-[11px] font-medium whitespace-nowrap" style={{ color: bar.status === "operational" ? "#4ade80" : "#fb923c" }}>
                    {bar.status === "operational" ? "Operational" : "Incident"}
                  </p>
                </div>
                <div className={`absolute top-full ${arrowAlign} w-0 h-0`} style={{ borderLeft: "5px solid transparent", borderRight: "5px solid transparent", borderTop: "5px solid #1a1714" }} />
              </div>
            </div>
          );
        })}
      </div>
      {showLabel && labelText && (
        <p className="text-[11px] mt-1.5" style={{ color: "#b0a898" }}>{labelText}</p>
      )}
    </div>
  );
}

function ActiveIncidentsSection({ incidents }: { incidents: Incident[] }) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? incidents : incidents.slice(0, INITIAL_SHOW);
  const hidden = incidents.length - INITIAL_SHOW;

  return (
    <section className="mt-10 mb-10">
      <h2
        className="text-xl font-black mb-6"
        style={{
          fontFamily: "var(--font-head)",
          color: "#1a1714",
          letterSpacing: "-0.03em",
        }}
      >
        Active Incidents
      </h2>
      <div className="flex flex-col gap-6">
        {visible.map((incident) => (
          <IncidentCard key={incident.id} incident={incident} isOwner={false} />
        ))}
      </div>
      {hidden > 0 && !expanded && (
        <button
          onClick={() => setExpanded(true)}
          className="mt-4 text-sm font-semibold cursor-pointer text-[#7c6f5e] hover:text-[#282625]"
        >
          + {hidden} more incident{hidden !== 1 ? "s" : ""} ▾
        </button>
      )}
      {expanded && incidents.length > INITIAL_SHOW && (
        <button
          onClick={() => setExpanded(false)}
          className="mt-4 text-sm font-semibold cursor-pointer text-[#7c6f5e] hover:text-[#282625]"
        >
          Show less ▴
        </button>
      )}
    </section>
  );
}

export default function PublicStatusPageClient({
  page,
  services: initialServices,
  incidents: initialIncidents,
  incidentDays: initialIncidentDays,
  lastUpdated: initialLastUpdated,
}: Props) {
  const [services, setServices] = useState<Service[]>(initialServices);
  const [incidents, setIncidents] = useState<Incident[]>(initialIncidents);
  const [incidentDays, setIncidentDays] = useState(initialIncidentDays);
  const [lastUpdated, setLastUpdated] = useState<string | null>(initialLastUpdated);

  useEffect(() => {
    const poll = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/public-status/${page.slug}`);
        if (!res.ok) return;
        const data = await res.json();
        setServices(data.services);
        setIncidents(data.incidents);
        setIncidentDays(data.incidentDays);
        setLastUpdated(data.lastUpdated);
      } catch {
        // silently ignore network errors
      }
    };

    const id = setInterval(poll, POLL_INTERVAL);
    return () => clearInterval(id);
  }, [page.slug]);
  function getOverallStatus() {
    if (services.length === 0) return "operational";
    if (services.some((s) => s.status === "outage")) return "outage";
    if (services.some((s) => s.status === "degraded")) return "degraded";
    return "operational";
  }

  const overallStatus = getOverallStatus();

  function getOverallStatusConfig() {
    switch (overallStatus) {
      case "operational":
        return {
          bg: "#e8f5ee",
          border: "#1a7a4a",
          text: "#1a7a4a",
          label: "All systems operational",
        };
      case "degraded":
        return {
          bg: "rgba(232,80,10,0.08)",
          border: "#e8500a",
          text: "#e8500a",
          label: "Some systems degraded",
        };
      case "outage":
        return {
          bg: "#fdeae8",
          border: "#d32f2f",
          text: "#d32f2f",
          label: "Service outage",
        };
      default:
        return {
          bg: "#e8f5ee",
          border: "#1a7a4a",
          text: "#1a7a4a",
          label: "All systems operational",
        };
    }
  }

  function getServiceStatusColor(status: Service["status"]) {
    switch (status) {
      case "operational":
        return { bg: "#e8f5ee", text: "#1a7a4a", border: "#1a7a4a" };
      case "degraded":
        return {
          bg: "rgba(232,80,10,0.08)",
          text: "#e8500a",
          border: "#e8500a",
        };
      case "outage":
        return { bg: "#fdeae8", text: "#d32f2f", border: "#d32f2f" };
    }
  }

  function getServiceStatusDot(status: Service["status"]) {
    const colorMap = {
      operational: "#1a7a4a",
      degraded: "#e8500a",
      outage: "#d32f2f",
    };
    return (
      <div
        className="w-2 h-2 rounded-full flex-shrink-0"
        style={{ background: colorMap[status] }}
      />
    );
  }

  function getServiceStatusLabel(status: Service["status"]) {
    switch (status) {
      case "operational":
        return "Operational";
      case "degraded":
        return "Degraded";
      case "outage":
        return "Outage";
    }
  }

  function computeUptimeBars() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const badDays = new Set<string>();
    incidents.forEach((incident) => {
      const d = new Date(incident.created_at);
      d.setHours(0, 0, 0, 0);
      badDays.add(d.toISOString().split("T")[0]);
    });

    const bars: { date: Date; status: "operational" | "incident" }[] = [];
    for (let i = incidentDays - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      bars.push({
        date: d,
        status: badDays.has(d.toISOString().split("T")[0])
          ? "incident"
          : "operational",
      });
    }

    const goodDays = bars.filter((b) => b.status === "operational").length;
    const uptimePct =
      incidentDays > 0
        ? ((goodDays / incidentDays) * 100).toFixed(1)
        : "100.0";

    return { bars, uptimePct };
  }

  function computeStreak() {
    if (incidents.length === 0) return incidentDays;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const lastIncident = new Date(
      Math.max(...incidents.map((i) => new Date(i.created_at).getTime())),
    );
    lastIncident.setHours(0, 0, 0, 0);
    return Math.floor(
      (today.getTime() - lastIncident.getTime()) / 86400000,
    );
  }

  const { bars: uptimeBars, uptimePct } = computeUptimeBars();
  const streak = computeStreak();
  const statusConfig = getOverallStatusConfig();
  const activeIncidents = incidents.filter((i) => i.status !== "resolved");
  const pastIncidents = incidents.filter((i) => i.status === "resolved");

  return (
    <>
      {/* Header */}
      <div className="mb-10">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-8 gap-3">
          <div>
            <h1
              className="mb-2"
              style={{
                fontFamily: "var(--font-head)",
                fontWeight: 900,
                fontSize: "clamp(1.75rem, 6vw, 3rem)",
                letterSpacing: "-0.04em",
                lineHeight: "1",
                color: "#1a1714",
              }}
            >
              {page.name}
            </h1>
            <p className="text-sm font-medium break-words" style={{ color: "#8a8070" }}>
              Current system status and incident updates
              {lastUpdated && (
                <>
                  <span className="hidden sm:inline"> · Last updated {lastUpdated}</span>
                  <span className="block sm:hidden mt-0.5">Last updated {lastUpdated}</span>
                </>
              )}
            </p>
          </div>

          <div
            className="flex items-center gap-2.5 px-5 py-3 rounded-full flex-shrink-0 self-start"
            style={{
              background: statusConfig.bg,
              border: `1.5px solid ${statusConfig.border}`,
            }}
          >
            {getServiceStatusDot(overallStatus as Service["status"])}
            <span
              className="text-sm font-bold"
              style={{ color: statusConfig.text }}
            >
              {statusConfig.label}
            </span>
          </div>
        </div>

        <div
          className="w-full"
          style={{ height: "1.5px", background: "#1a1714" }}
        />
      </div>

      {/* ── SERVICES ── */}
      <section className="mb-10">
        {services.length === 0 ? (
          <div
            className="flex flex-col items-center text-center py-16 rounded-[4px]"
            style={{ border: "1.5px solid #e4dfd4", background: "white" }}
          >
            <p className="text-sm" style={{ color: "#8a8070" }}>
              No services configured yet
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {services.map((service) => {
              const colors = getServiceStatusColor(service.status);
              return (
                <div
                  key={service.id}
                  className="flex items-center justify-between px-4 sm:px-6 py-4 sm:py-5 rounded-[4px] transition-all cursor-default"
                  style={{
                    border: "1.5px solid #e4dfd4",
                    background: "white",
                    borderLeft: `4px solid ${colors.border}`,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "#1a1714";
                    e.currentTarget.style.borderLeftColor = colors.border;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "#e4dfd4";
                    e.currentTarget.style.borderLeftColor = colors.border;
                  }}
                >
                  <span
                    className="text-base sm:text-lg font-bold min-w-0 truncate mr-3"
                    style={{
                      fontFamily: "var(--font-head)",
                      color: "#1a1714",
                      letterSpacing: "-0.02em",
                    }}
                  >
                    {service.name}
                  </span>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {getServiceStatusDot(service.status)}
                    <span
                      className="text-xs sm:text-base font-bold"
                      style={{ color: colors.text }}
                    >
                      {getServiceStatusLabel(service.status)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ── UPTIME BARS ── */}
      {services.length > 0 && (
        <section className="mb-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 gap-0.5">
            <span className="text-sm font-medium" style={{ color: "#8a8070" }}>
              {incidentDays}-day uptime —{" "}
              <span className="font-bold" style={{ color: "#1a1714" }}>
                {uptimePct}%
              </span>
            </span>
            <span className="text-sm font-semibold" style={{ color: "#1a7a4a" }}>
              {streak === 0
                ? "Incident today"
                : `${streak} day${streak === 1 ? "" : "s"} without incident`}
            </span>
          </div>

          {/* Mobile: last 30 bars */}
          <UptimeBarTrack
            bars={uptimeBars.slice(-30)}
            barHeight={36}
            gap={3}
            showLabel={incidentDays > 30}
            labelText="last 30 days"
            className="sm:hidden"
          />
          {/* Desktop: all bars */}
          <UptimeBarTrack
            bars={uptimeBars}
            barHeight={32}
            gap={3}
            className="hidden sm:flex"
          />
        </section>
      )}

      {/* ── ACTIVE INCIDENTS ── */}
      {activeIncidents.length > 0 && (
        <ActiveIncidentsSection incidents={activeIncidents} />
      )}

      {/* ── PAST INCIDENTS ── */}
      <section className="mt-10">
        <h2
          className="text-xl font-black mb-6"
          style={{
            fontFamily: "var(--font-head)",
            color: "#1a1714",
            letterSpacing: "-0.03em",
          }}
        >
          Past Incidents
        </h2>
        {pastIncidents.length === 0 ? (
          <div
            className="flex items-center gap-3 px-6 py-5 rounded-[4px]"
            style={{ border: "1.5px solid #e4dfd4", background: "white" }}
          >
            <div
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ background: "#1a7a4a" }}
            />
            <p className="text-sm font-medium" style={{ color: "#3d3830" }}>
              No incidents in the past {incidentDays} days
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {pastIncidents.map((incident) => (
              <IncidentCard
                key={incident.id}
                incident={incident}
                isOwner={false}
              />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
