"use client";

import IncidentCard from "@/components/incidents/IncidentCard";
import { createClient } from "@/lib/supabase/client";
import { useCallback, useEffect, useState } from "react";
import { Wrench, Calendar } from "lucide-react";
import {
  computeUptimeBars as computeBars,
  maintenanceDayKeys,
  dayKey,
} from "@/lib/maintenance";

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

type PublicMaintenance = {
  id: string;
  title: string;
  description: string | null;
  starts_at: string;
  ends_at: string;
  state: "scheduled" | "in_progress" | "completed" | "cancelled";
  maintenance_window_services?: { service_id: string }[];
};

type Props = {
  page: StatusPage;
  services: Service[];
  incidents: Incident[];
  maintenance: PublicMaintenance[];
  incidentDays: number;
  lastUpdated: string | null;
};

const INITIAL_SHOW = 3;

type UptimeBar = { date: Date; status: "operational" | "incident" | "maintenance" };

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
                  background:
                    bar.status === "maintenance"
                      ? "#8a8070"
                      : bar.status === "operational"
                        ? "#1a7a4a"
                        : "#e8500a",
                }}
              />
              <div className={`absolute bottom-full mb-2 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-20 ${tooltipAlign}`}>
                <div className="px-2.5 py-1.5 rounded-[5px] shadow-xl" style={{ background: "#1a1714", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <p className="text-[11px] font-bold whitespace-nowrap" style={{ color: "#f5f2eb" }}>
                    {bar.date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </p>
                  <p className="text-[11px] font-medium whitespace-nowrap" style={{ color: bar.status === "operational" ? "#4ade80" : bar.status === "maintenance" ? "#cbb89a" : "#fb923c" }}>
                    {bar.status === "operational" ? "Operational" : bar.status === "maintenance" ? "Scheduled maintenance" : "Incident"}
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

function MaintenanceBanner({
  m,
  ongoing,
  serviceNames,
}: {
  m: PublicMaintenance;
  ongoing: boolean;
  serviceNames: Record<string, string>;
}) {
  const [expanded, setExpanded] = useState(false);
  const hasDetail = !!(m.description || (m.maintenance_window_services ?? []).length > 0);
  const starts = new Date(m.starts_at);
  const ends = new Date(m.ends_at);

  const dateStr = starts.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  const startTime = starts.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  const endTime = ends.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  const timeRange = `${startTime} – ${endTime}`;

  function getRelative() {
    const now = Date.now();
    if (ongoing) {
      const minsLeft = Math.ceil((ends.getTime() - now) / 60000);
      if (minsLeft <= 0) return "ending soon";
      if (minsLeft < 60) return `${minsLeft}m left`;
      return `${Math.ceil(minsLeft / 60)}h left`;
    } else {
      const minsUntil = Math.ceil((starts.getTime() - now) / 60000);
      if (minsUntil < 60) return `in ${minsUntil}m`;
      if (minsUntil < 1440) return `in ${Math.ceil(minsUntil / 60)}h`;
      return `in ${Math.ceil(minsUntil / 1440)}d`;
    }
  }

  const names = (m.maintenance_window_services ?? [])
    .map((l) => serviceNames[l.service_id])
    .filter(Boolean);

  const accentColor = ongoing ? "#e8500a" : "#8a8070";
  const bg = ongoing ? "rgba(232,80,10,0.03)" : "#edeae3";
  const borderColor = ongoing ? "rgba(232,80,10,0.2)" : "#c4bfb4";

  return (
    <div
      className="rounded-[4px] mb-3 overflow-hidden"
      style={{ background: bg, border: `1.5px solid ${borderColor}` }}
    >
      {/* Strip row */}
      <div
        className={`px-5 py-3 flex items-center gap-3 transition-colors duration-150 ${hasDetail ? "cursor-pointer select-none" : ""}`}
        style={hasDetail ? { ["--hover-bg" as string]: ongoing ? "rgba(232,80,10,0.1)" : "#e4e0d8" } : undefined}
        onClick={hasDetail ? () => setExpanded((p) => !p) : undefined}
        onMouseEnter={hasDetail ? (e) => { e.currentTarget.style.background = ongoing ? "rgba(232,80,10,0.1)" : "#e4e0d8"; } : undefined}
        onMouseLeave={hasDetail ? (e) => { e.currentTarget.style.background = ""; } : undefined}
      >
        {ongoing
          ? <Wrench size={13} style={{ color: accentColor, flexShrink: 0 }} />
          : <Calendar size={13} style={{ color: accentColor, flexShrink: 0 }} />}
        <span className="text-sm font-semibold flex-1 min-w-0" style={{ color: "#1a1714" }}>
          {ongoing ? "Maintenance in progress" : "Scheduled maintenance"}
          {m.title ? <span style={{ color: "#8a8070" }}> — {m.title}</span> : null}
        </span>
        <span className="text-xs font-semibold flex-shrink-0" style={{ color: accentColor }}>
          {ongoing ? getRelative() : `${dateStr} · ${timeRange}`}
        </span>
        {hasDetail && (
          <span className="flex-shrink-0 text-xs ml-1" style={{ color: "#b0a898" }}>
            {expanded ? "▴" : "▾"}
          </span>
        )}
      </div>

      {/* Expanded detail */}
      {hasDetail && (
        <div
          style={{
            display: "grid",
            gridTemplateRows: expanded ? "1fr" : "0fr",
            transition: "grid-template-rows 0.22s ease",
          }}
        >
        <div style={{ overflow: "hidden" }}>
        <div
          className="px-5 pt-3 pb-4 flex flex-col gap-2"
          style={{ borderTop: `1px solid ${borderColor}`, background: "rgba(255,255,255,0.6)" }}
        >
          {ongoing && (
            <p className="text-xs font-semibold" style={{ color: "#8a8070" }}>
              {dateStr} · {timeRange}
            </p>
          )}
          {m.description && (
            <p className="text-sm leading-relaxed" style={{ color: "#1a1714" }}>{m.description}</p>
          )}
          {names.length > 0 && (
            <p className="text-xs" style={{ color: "#8a8070" }}>
              <span className="font-semibold" style={{ color: "#3d3830" }}>Affects:</span>{" "}
              {names.join(", ")}
            </p>
          )}
        </div>
        </div>
        </div>
      )}
    </div>
  );
}

export default function PublicStatusPageClient({
  page,
  services: initialServices,
  incidents: initialIncidents,
  maintenance: initialMaintenance,
  incidentDays: initialIncidentDays,
  lastUpdated: initialLastUpdated,
}: Props) {
  const [services, setServices] = useState<Service[]>(initialServices);
  const [incidents, setIncidents] = useState<Incident[]>(initialIncidents);
  const [maintenance, setMaintenance] = useState<PublicMaintenance[]>(initialMaintenance);
  const [incidentDays, setIncidentDays] = useState(initialIncidentDays);
  const [lastUpdated, setLastUpdated] = useState<string | null>(initialLastUpdated);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch(`/api/public-status/${page.slug}`);
      if (!res.ok) return;
      const data = await res.json();
      setServices(data.services);
      setIncidents(data.incidents);
      setMaintenance(data.maintenance ?? []);
      setIncidentDays(data.incidentDays);
      setLastUpdated(data.lastUpdated);
    } catch {
      // silently ignore network errors
    }
  }, [page.slug]);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`public-status-${page.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "services", filter: `status_page_id=eq.${page.id}` }, refresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "incidents", filter: `status_page_id=eq.${page.id}` }, refresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "incident_updates" }, refresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "maintenance_windows", filter: `status_page_id=eq.${page.id}` }, refresh)
      .subscribe();
    // Poll every 60s to pick up time-based maintenance state transitions
    const timer = setInterval(refresh, 60_000);
    return () => { supabase.removeChannel(channel); clearInterval(timer); };
  }, [page.id, refresh]);
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

    const incidentDayKeys = new Set<string>();
    incidents.forEach((incident) => {
      incidentDayKeys.add(dayKey(new Date(incident.created_at)));
    });

    const mKeys = maintenanceDayKeys(
      maintenance.map((m) => ({
        starts_at: m.starts_at,
        ends_at: m.ends_at,
        state: m.state,
      })),
      today,
    );

    return computeBars({
      days: incidentDays,
      today,
      incidentDayKeys,
      maintenanceDayKeys: mKeys,
    });
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
  const upcomingMaintenance = maintenance.filter((m) => m.state === "scheduled");
  const ongoingMaintenance = maintenance.filter((m) => m.state === "in_progress");
  const pastMaintenance = maintenance
    .filter((m) => m.state === "completed" || m.state === "cancelled")
    .sort((a, b) => new Date(b.ends_at).getTime() - new Date(a.ends_at).getTime());
  const serviceNames = Object.fromEntries(services.map((s) => [s.id, s.name]));

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

      {/* ── MAINTENANCE BANNERS ── */}
      {(ongoingMaintenance.length > 0 || upcomingMaintenance.length > 0) && (
        <div className="mb-8">
          {ongoingMaintenance.map((m) => (
            <MaintenanceBanner key={m.id} m={m} ongoing serviceNames={serviceNames} />
          ))}
          {upcomingMaintenance.map((m) => (
            <MaintenanceBanner key={m.id} m={m} ongoing={false} serviceNames={serviceNames} />
          ))}
        </div>
      )}

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
              {incidentDays}-day uptime:{" "}
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

          {uptimeBars.some((b) => b.status === "maintenance") && (
            <div className="flex items-center gap-4 mb-3 text-[11px]" style={{ color: "#8a8070" }}>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-3 rounded-[2px]" style={{ background: "#1a7a4a" }} /> Operational
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-3 rounded-[2px]" style={{ background: "#e8500a" }} /> Incident
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-3 rounded-[2px]" style={{ background: "#8a8070" }} /> Maintenance
              </span>
            </div>
          )}

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
            className="hidden sm:block"
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

      {/* ── PAST MAINTENANCE ── */}
      {pastMaintenance.length > 0 && (
        <PastMaintenanceSection pastMaintenance={pastMaintenance} serviceNames={serviceNames} />
      )}
    </>
  );
}

const MAINTENANCE_INITIAL_SHOW = 3;

function PastMaintenanceSection({ pastMaintenance, serviceNames }: { pastMaintenance: PublicMaintenance[]; serviceNames: Record<string, string> }) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? pastMaintenance : pastMaintenance.slice(0, MAINTENANCE_INITIAL_SHOW);
  const hidden = pastMaintenance.length - MAINTENANCE_INITIAL_SHOW;

  return (
        <section className="mt-10">
          <h2
            className="text-xl font-black mb-6"
            style={{ fontFamily: "var(--font-head)", color: "#1a1714", letterSpacing: "-0.03em" }}
          >
            Past Maintenance
          </h2>
          <div className="flex flex-col gap-6">
            {visible.map((m) => {
              const cancelled = m.state === "cancelled";
              const starts = new Date(m.starts_at);
              const ends = new Date(m.ends_at);
              const dateStr = starts.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
              const startTime = starts.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
              const endTime = ends.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
              const badgeColor = cancelled ? "#8a8070" : "#1a7a4a";
              const headerBg = cancelled ? "rgba(26,23,20,0.04)" : "#e8f5ee";
              return (
                <div
                  key={m.id}
                  className="rounded-[4px] overflow-hidden"
                  style={{ border: "1.5px solid #1a1714", background: "white", boxShadow: "3px 3px 0 #1a1714" }}
                >
                  {/* Header */}
                  <div
                    className="px-6 py-4"
                    style={{ background: headerBg, borderBottom: `2px solid ${badgeColor}` }}
                  >
                    <div className="mb-2">
                      <span
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[4px] text-xs font-bold uppercase tracking-wider"
                        style={{ background: badgeColor, color: "white" }}
                      >
                        <Wrench size={10} />
                        {cancelled ? "Cancelled" : "Completed"}
                      </span>
                    </div>
                    <h3
                      className="text-xl font-black"
                      style={{ fontFamily: "var(--font-head)", color: "#1a1714", letterSpacing: "-0.03em", lineHeight: "1.2" }}
                    >
                      {m.title}
                    </h3>
                    <span className="text-xs font-medium mt-1 block" style={{ color: "#8a8070" }}>
                      {dateStr} · {startTime} – {endTime}
                    </span>
                  </div>

                  {/* Description or affected services */}
                  {(m.description || (m.maintenance_window_services ?? []).length > 0) && (
                    <div className="px-6 py-4">
                      {m.description && (
                        <p className="text-sm leading-relaxed" style={{ color: "#3d3830" }}>{m.description}</p>
                      )}
                      {(m.maintenance_window_services ?? []).length > 0 && (
                        <p className="text-xs mt-1" style={{ color: "#8a8070" }}>
                          Affected: {(m.maintenance_window_services ?? []).map((l) => serviceNames[l.service_id]).filter(Boolean).join(", ")}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          {hidden > 0 && !expanded && (
            <button
              onClick={() => setExpanded(true)}
              className="mt-4 text-sm font-semibold cursor-pointer"
              style={{ color: "#7c6f5e" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#282625")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#7c6f5e")}
            >
              + {hidden} more {hidden === 1 ? "window" : "windows"} ▾
            </button>
          )}
          {expanded && pastMaintenance.length > MAINTENANCE_INITIAL_SHOW && (
            <button
              onClick={() => setExpanded(false)}
              className="mt-4 text-sm font-semibold cursor-pointer"
              style={{ color: "#7c6f5e" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#282625")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#7c6f5e")}
            >
              Show less ▴
            </button>
          )}
        </section>
  );
}
