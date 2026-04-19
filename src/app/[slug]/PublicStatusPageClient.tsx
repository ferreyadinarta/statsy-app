"use client";

import IncidentCard from "@/components/incidents/IncidentCard";

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

export default function PublicStatusPageClient({
  page,
  services,
  incidents,
  incidentDays,
  lastUpdated,
}: Props) {
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

  const statusConfig = getOverallStatusConfig();
  const activeIncidents = incidents.filter((i) => i.status !== "resolved");
  const pastIncidents = incidents.filter((i) => i.status === "resolved");

  return (
    <>
      {/* Header */}
      <div className="mb-10">
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1
              className="mb-2"
              style={{
                fontFamily: "var(--font-head)",
                fontWeight: 900,
                fontSize: "3rem",
                letterSpacing: "-0.04em",
                lineHeight: "1",
                color: "#1a1714",
              }}
            >
              {page.name}
            </h1>
            <p className="text-sm font-medium" style={{ color: "#8a8070" }}>
              Current system status and incident updates
              {lastUpdated && (
                <span style={{ color: "#8a8070" }}>
                  {" "}
                  · Last updated {lastUpdated}
                </span>
              )}
            </p>
          </div>

          <div
            className="flex items-center gap-2.5 px-5 py-3 rounded-full flex-shrink-0"
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
                  className="flex items-center justify-between px-6 py-5 rounded-[4px] transition-all cursor-default"
                  style={{
                    border: "1.5px solid #e4dfd4",
                    background: "white",
                    borderLeft: `4px solid ${colors.border}`,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "#1a1714";
                    e.currentTarget.style.borderLeftColor = colors.border;
                    e.currentTarget.style.transform = "translateX(2px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "#e4dfd4";
                    e.currentTarget.style.borderLeftColor = colors.border;
                    e.currentTarget.style.transform = "translateX(0)";
                  }}
                >
                  <span
                    className="text-lg font-bold"
                    style={{
                      fontFamily: "var(--font-head)",
                      color: "#1a1714",
                      letterSpacing: "-0.02em",
                    }}
                  >
                    {service.name}
                  </span>
                  <div className="flex items-center gap-2.5">
                    {getServiceStatusDot(service.status)}
                    <span
                      className="text-base font-bold"
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

      {/* ── ACTIVE INCIDENTS ── */}
      {activeIncidents.length > 0 && (
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
            {activeIncidents.map((incident) => (
              <IncidentCard
                key={incident.id}
                incident={incident}
                isOwner={false}
              />
            ))}
          </div>
        </section>
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
