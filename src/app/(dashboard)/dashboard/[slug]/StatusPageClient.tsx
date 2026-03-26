"use client";

import { useState } from "react";
import {
  Plus,
  AlertCircle,
  CheckCircle,
  XCircle,
  Edit2,
  Trash2,
  ExternalLink,
  Users,
} from "lucide-react";
import DeleteServiceConfirm from "@/components/services/DeleteServiceConfirm";
import AddServiceModal from "@/components/services/AddServiceModal";
import EditServiceModal from "@/components/services/EditServiceModal";
import CreateIncidentModal from "@/components/incidents/CreateIncidentModal";
import IncidentCard from "@/components/incidents/IncidentCard";

const FREE_SERVICE_LIMIT = 3;

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
  subscriberCount: number;
};

export default function StatusPageClient({
  page,
  services,
  incidents,
  subscriberCount,
}: Props) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [deletingService, setDeletingService] = useState<Service | null>(null);
  const [showCreateIncident, setShowCreateIncident] = useState(false);

  const atLimit = services.length >= FREE_SERVICE_LIMIT;

  // Split incidents into active and resolved
  const activeIncidents = incidents.filter((i) => i.status !== "resolved");
  const resolvedIncidents = incidents.filter((i) => i.status === "resolved");

  function getStatusColor(status: Service["status"]) {
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

  function getStatusIcon(status: Service["status"]) {
    switch (status) {
      case "operational":
        return <CheckCircle size={18} />;
      case "degraded":
        return <AlertCircle size={18} />;
      case "outage":
        return <XCircle size={18} />;
    }
  }

  function getStatusLabel(status: Service["status"]) {
    switch (status) {
      case "operational":
        return "Operational";
      case "degraded":
        return "Degraded";
      case "outage":
        return "Outage";
    }
  }

  return (
    <>
      {/* Top bar — View public page + subscriber count */}
      <div className="flex items-center justify-between mb-10">
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-[4px]"
          style={{
            background: "white",
            border: "1.5px solid #e4dfd4",
          }}
        >
          <Users size={14} style={{ color: "#8a8070" }} />
          <span className="text-sm font-semibold" style={{ color: "#3d3830" }}>
            {subscriberCount}{" "}
            <span style={{ color: "#8a8070", fontWeight: 400 }}>
              {subscriberCount === 1 ? "subscriber" : "subscribers"}
            </span>
          </span>
        </div>

        <a
          href={`/${page.slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-[4px] text-xs font-semibold no-underline transition-colors"
          style={{
            background: "white",
            border: "1.5px solid #e4dfd4",
            color: "#3d3830",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "#1a1714";
            e.currentTarget.style.color = "#1a1714";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "#e4dfd4";
            e.currentTarget.style.color = "#3d3830";
          }}
        >
          <ExternalLink size={13} />
          View public page
        </a>
      </div>

      {/* ── SERVICES (first) ── */}
      <section className="mb-10">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2
              className="text-xl font-black mb-2"
              style={{
                fontFamily: "var(--font-head)",
                color: "#1a1714",
                letterSpacing: "-0.03em",
              }}
            >
              Services{" "}
              <span
                className="text-sm font-semibold"
                style={{ color: "#8a8070" }}
              >
                {services.length}/{FREE_SERVICE_LIMIT}
              </span>
            </h2>
            <p className="text-sm font-medium" style={{ color: "#8a8070" }}>
              Monitor the health of your infrastructure
            </p>
          </div>
          <button
            onClick={() => !atLimit && setShowAddModal(true)}
            disabled={atLimit}
            className="flex items-center gap-1.5 rounded-[4px] px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: "#1a1714",
              color: "#f5f2eb",
              border: "1.5px solid #1a1714",
              boxShadow: "2px 2px 0 #1a1714",
            }}
            onMouseEnter={(e) => {
              if (!atLimit) {
                e.currentTarget.style.background = "#e8500a";
                e.currentTarget.style.borderColor = "#e8500a";
                e.currentTarget.style.boxShadow = "2px 2px 0 #e8500a";
                e.currentTarget.style.transform = "translate(-1px, -1px)";
              }
            }}
            onMouseLeave={(e) => {
              if (!atLimit) {
                e.currentTarget.style.background = "#1a1714";
                e.currentTarget.style.borderColor = "#1a1714";
                e.currentTarget.style.boxShadow = "2px 2px 0 #1a1714";
                e.currentTarget.style.transform = "translate(0, 0)";
              }
            }}
            title={atLimit ? "Upgrade to Pro to add more services" : undefined}
          >
            <Plus size={14} strokeWidth={3} />
            Add Service
          </button>
        </div>

        {services.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center py-14 rounded-[4px] text-center"
            style={{ border: "1.5px dashed #e4dfd4", background: "white" }}
          >
            <p
              className="text-sm font-semibold mb-1"
              style={{ color: "#3d3830" }}
            >
              No services yet
            </p>
            <p className="text-xs" style={{ color: "#8a8070" }}>
              Add your first service to start monitoring
            </p>
          </div>
        ) : (
          <div
            className="rounded-[4px] overflow-hidden"
            style={{ border: "1.5px solid #1a1714" }}
          >
            {services.map((service, index) => {
              const colors = getStatusColor(service.status);
              return (
                <div
                  key={service.id}
                  className="flex items-center justify-between px-6 py-4"
                  style={{
                    borderBottom:
                      index < services.length - 1
                        ? "1.5px solid #e4dfd4"
                        : "none",
                    background: "white",
                  }}
                >
                  <span
                    className="font-semibold text-sm"
                    style={{ color: "#1a1714" }}
                  >
                    {service.name}
                  </span>
                  <div className="flex items-center gap-3">
                    <span
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[4px] text-xs font-bold"
                      style={{
                        background: colors.bg,
                        color: colors.text,
                        border: `1.5px solid ${colors.border}`,
                      }}
                    >
                      {getStatusIcon(service.status)}
                      {getStatusLabel(service.status)}
                    </span>
                    <button
                      onClick={() => setEditingService(service)}
                      className="p-1.5 rounded-[4px] transition-colors cursor-pointer"
                      style={{ color: "#8a8070" }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.color = "#1a1714")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.color = "#8a8070")
                      }
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => setDeletingService(service)}
                      className="p-1.5 rounded-[4px] transition-colors cursor-pointer"
                      style={{ color: "#8a8070" }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.color = "#d32f2f")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.color = "#8a8070")
                      }
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {atLimit && (
          <p className="text-xs mt-3" style={{ color: "#8a8070" }}>
            You've reached the free plan limit of {FREE_SERVICE_LIMIT} services.{" "}
            <a
              href="/billing"
              style={{ color: "#e8500a", textDecoration: "underline" }}
            >
              Upgrade to Pro
            </a>{" "}
            for up to 10 services.
          </p>
        )}
      </section>

      {/* ── ACTIVE INCIDENTS (second) ── */}
      <section className="mb-10">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2
              className="text-xl font-black mb-2"
              style={{
                fontFamily: "var(--font-head)",
                color: "#1a1714",
                letterSpacing: "-0.03em",
              }}
            >
              Active Incidents
            </h2>
            <p className="text-sm font-medium" style={{ color: "#8a8070" }}>
              {activeIncidents.length === 0
                ? "No active incidents — all systems operational"
                : `${activeIncidents.length} active ${activeIncidents.length === 1 ? "incident" : "incidents"}`}
            </p>
          </div>
          <button
            onClick={() => setShowCreateIncident(true)}
            className="flex items-center gap-1.5 rounded-[4px] px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
            style={{
              background: "#1a1714",
              color: "#f5f2eb",
              border: "1.5px solid #1a1714",
              boxShadow: "2px 2px 0 #1a1714",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#e8500a";
              e.currentTarget.style.borderColor = "#e8500a";
              e.currentTarget.style.boxShadow = "2px 2px 0 #e8500a";
              e.currentTarget.style.transform = "translate(-1px, -1px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#1a1714";
              e.currentTarget.style.borderColor = "#1a1714";
              e.currentTarget.style.boxShadow = "2px 2px 0 #1a1714";
              e.currentTarget.style.transform = "translate(0, 0)";
            }}
          >
            <Plus size={14} strokeWidth={3} />
            Post Incident
          </button>
        </div>

        {activeIncidents.length === 0 ? (
          <div
            className="flex items-center gap-3 px-6 py-5 rounded-[4px]"
            style={{ border: "1.5px solid #e4dfd4", background: "white" }}
          >
            <div
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ background: "#1a7a4a" }}
            />
            <p className="text-sm font-medium" style={{ color: "#3d3830" }}>
              All systems operational
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {activeIncidents.map((incident) => (
              <IncidentCard
                key={incident.id}
                incident={incident}
                isOwner={true}
              />
            ))}
          </div>
        )}
      </section>

      {/* ── RESOLVED INCIDENTS (third) ── */}
      {resolvedIncidents.length > 0 && (
        <section className="mb-10">
          <h2
            className="text-xl font-black mb-6"
            style={{
              fontFamily: "var(--font-head)",
              color: "#1a1714",
              letterSpacing: "-0.03em",
            }}
          >
            Resolved Incidents
          </h2>
          <div className="flex flex-col gap-6">
            {resolvedIncidents.map((incident) => (
              <IncidentCard
                key={incident.id}
                incident={incident}
                isOwner={true}
              />
            ))}
          </div>
        </section>
      )}

      {/* Modals */}
      {showAddModal && (
        <AddServiceModal
          pageId={page.id}
          onClose={() => setShowAddModal(false)}
        />
      )}
      {editingService && (
        <EditServiceModal
          service={editingService}
          onClose={() => setEditingService(null)}
        />
      )}
      {deletingService && (
        <DeleteServiceConfirm
          service={deletingService}
          onClose={() => setDeletingService(null)}
        />
      )}
      {showCreateIncident && (
        <CreateIncidentModal
          pageId={page.id}
          onClose={() => setShowCreateIncident(false)}
        />
      )}
    </>
  );
}
