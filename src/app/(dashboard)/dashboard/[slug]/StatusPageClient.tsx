"use client";

import { useState } from "react";
import {
  Plus,
  AlertCircle,
  CheckCircle,
  XCircle,
  Edit2,
  Trash2,
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

export default function StatusPageClient({ page, services, incidents }: Props) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [deletingService, setDeletingService] = useState<Service | null>(null);
  const [showCreateIncident, setShowCreateIncident] = useState(false);

  const atLimit = services.length >= FREE_SERVICE_LIMIT;

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
      {/* Incidents section */}
      {incidents.length > 0 && (
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
                Recent issues affecting service availability
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

          <div className="flex flex-col gap-6">
            {incidents.map((incident) => (
              <IncidentCard
                key={incident.id}
                incident={incident}
                isOwner={true}
              />
            ))}
          </div>
        </section>
      )}

      {/* No incidents state - show before services */}
      {incidents.length === 0 && (
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
                Incidents
              </h2>
              <p className="text-sm font-medium" style={{ color: "#8a8070" }}>
                No active incidents — all systems operational
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

          <div
            className="flex items-center gap-4 px-6 py-5 rounded-[4px]"
            style={{
              border: "1.5px solid #1a1714",
              background: "#e8f5ee",
            }}
          >
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
              style={{
                background: "#1a7a4a",
              }}
            >
              <CheckCircle
                size={24}
                strokeWidth={3}
                style={{ color: "white" }}
              />
            </div>
            <div>
              <p
                className="font-bold mb-0.5"
                style={{
                  fontFamily: "var(--font-head)",
                  fontSize: "1.1rem",
                  color: "#1a1714",
                  letterSpacing: "-0.02em",
                }}
              >
                All systems operational
              </p>
              <p className="text-sm" style={{ color: "#3d3830" }}>
                No incidents reported in the last 7 days
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Services section */}
      <section>
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
              Services
              <span
                className="ml-3 text-base font-normal"
                style={{ color: "#8a8070" }}
              >
                {services.length} / {FREE_SERVICE_LIMIT}
              </span>
            </h2>
            <p className="text-sm font-medium" style={{ color: "#8a8070" }}>
              Monitor the health of your infrastructure
            </p>
          </div>
          <button
            onClick={() => !atLimit && setShowAddModal(true)}
            disabled={atLimit}
            className="flex items-center gap-1.5 rounded-[4px] px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer disabled:cursor-not-allowed"
            style={{
              background: atLimit ? "#e4dfd4" : "#1a1714",
              color: atLimit ? "#8a8070" : "#f5f2eb",
              border: `1.5px solid ${atLimit ? "#e4dfd4" : "#1a1714"}`,
              boxShadow: atLimit ? "none" : "2px 2px 0 #1a1714",
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
            title={
              atLimit
                ? "Free plan limit reached — upgrade to add more services"
                : undefined
            }
          >
            <Plus size={14} strokeWidth={3} />
            Add Service
          </button>
        </div>

        {services.length === 0 ? (
          <div
            className="flex flex-col items-center text-center py-16 rounded-[4px]"
            style={{ border: "1.5px solid #1a1714", background: "white" }}
          >
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mb-5"
              style={{
                background: "rgba(232,80,10,0.1)",
                border: "2px solid #e8500a",
              }}
            >
              <CheckCircle
                size={32}
                strokeWidth={2.5}
                style={{ color: "#e8500a" }}
              />
            </div>
            <h3
              style={{
                fontFamily: "var(--font-head)",
                fontWeight: 800,
                fontSize: "1.2rem",
                marginBottom: "8px",
                color: "#1a1714",
                letterSpacing: "-0.02em",
              }}
            >
              No services yet
            </h3>
            <p className="text-sm max-w-sm" style={{ color: "#8a8070" }}>
              Add your first service to start tracking status
            </p>
          </div>
        ) : (
          <div
            className="rounded-[4px] overflow-hidden"
            style={{
              border: "1.5px solid #1a1714",
              background: "white",
              boxShadow: "3px 3px 0 #1a1714",
            }}
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
                  }}
                >
                  <div className="flex items-center gap-4 flex-1">
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
                    <div
                      className="flex items-center gap-2 px-3 py-1.5 rounded-[4px] text-sm font-bold"
                      style={{
                        background: colors.bg,
                        color: colors.text,
                        border: `1.5px solid ${colors.border}`,
                      }}
                    >
                      {getStatusIcon(service.status)}
                      {getStatusLabel(service.status)}
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setEditingService(service)}
                      className="p-2 rounded-[4px] transition-colors cursor-pointer"
                      style={{ color: "#8a8070" }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.color = "#1a1714")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.color = "#8a8070")
                      }
                      title="Edit service"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => setDeletingService(service)}
                      className="p-2 rounded-[4px] transition-colors cursor-pointer"
                      style={{ color: "#8a8070" }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.color = "#d32f2f")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.color = "#8a8070")
                      }
                      title="Delete service"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {atLimit && (
          <div
            className="flex items-center gap-4 px-5 py-4 rounded-[4px] text-sm mt-5"
            style={{
              background: "rgba(232,80,10,0.08)",
              border: "1.5px solid #e8500a",
              color: "#1a1714",
            }}
          >
            <AlertCircle
              size={20}
              strokeWidth={2.5}
              style={{ color: "#e8500a" }}
            />
            <span>
              <strong>Free plan limit reached.</strong> You have{" "}
              {FREE_SERVICE_LIMIT} services.{" "}
              <button
                className="font-bold underline underline-offset-2 cursor-pointer"
                style={{ color: "#e8500a" }}
              >
                Upgrade to Pro
              </button>{" "}
              for up to 10 services per page.
            </span>
          </div>
        )}
      </section>

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
