"use client";

import { CheckCircle, AlertCircle, XCircle } from "lucide-react";
import IncidentCard from "@/components/incidents/IncidentCard";
import SubscribeForm from "@/components/public/SubscibeForm";

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
};

export default function PublicStatusPageClient({
  page,
  services,
  incidents,
}: Props) {
  // Calculate overall status based on services
  function getOverallStatus() {
    if (services.length === 0) return "operational";

    const hasOutage = services.some((s) => s.status === "outage");
    const hasDegraded = services.some((s) => s.status === "degraded");

    if (hasOutage) return "outage";
    if (hasDegraded) return "degraded";
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

  function getServiceStatusIcon(status: Service["status"]) {
    switch (status) {
      case "operational":
        return (
          <div
            className="w-2 h-2 rounded-full"
            style={{ background: "#1a7a4a" }}
          />
        );
      case "degraded":
        return (
          <div
            className="w-2 h-2 rounded-full"
            style={{ background: "#e8500a" }}
          />
        );
      case "outage":
        return (
          <div
            className="w-2 h-2 rounded-full"
            style={{ background: "#d32f2f" }}
          />
        );
    }
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

  return (
    <>
      {/* Header with page name and overall status badge */}
      <div className="mb-10">
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1
              className="mb-3"
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
            <p className="text-base font-medium" style={{ color: "#8a8070" }}>
              Current system status and incident updates
            </p>
          </div>

          {/* Overall status badge */}
          <div
            className="flex items-center gap-2.5 px-5 py-3 rounded-full"
            style={{
              background: statusConfig.bg,
              border: `1.5px solid ${statusConfig.border}`,
            }}
          >
            {getServiceStatusIcon(overallStatus)}
            <span
              className="text-sm font-bold"
              style={{ color: statusConfig.text }}
            >
              {statusConfig.label}
            </span>
          </div>
        </div>

        {/* Divider */}
        <div
          className="w-full"
          style={{
            height: "1.5px",
            background: "#1a1714",
          }}
        />
      </div>

      {/* Services Section */}
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
                  className="group flex items-center justify-between px-6 py-5 rounded-[4px] transition-all cursor-default"
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
                    {getServiceStatusIcon(service.status)}
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

      {/* Incidents Section - SECOND (historical context) */}
      {incidents.length > 0 && (
        <section>
          <h2
            className="text-xl font-black mb-6"
            style={{
              fontFamily: "var(--font-head)",
              color: "#1a1714",
              letterSpacing: "-0.03em",
            }}
          >
            Recent Incidents
          </h2>

          <div className="flex flex-col gap-6">
            {incidents.map((incident) => (
              <IncidentCard
                key={incident.id}
                incident={incident}
                isOwner={false}
              />
            ))}
          </div>
          <SubscribeForm statusPageId={page.id} />
        </section>
      )}
    </>
  );
}
