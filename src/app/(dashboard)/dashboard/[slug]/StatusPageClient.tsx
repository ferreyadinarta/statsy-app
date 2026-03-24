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

const FREE_SERVICE_LIMIT = 3;

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
};

export default function StatusPageClient({ page, services }: Props) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [deletingService, setDeletingService] = useState<Service | null>(null);

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
        return <CheckCircle size={14} />;
      case "degraded":
        return <AlertCircle size={14} />;
      case "outage":
        return <XCircle size={14} />;
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
      {/* Services section */}
      <div
        className="mb-8 bg-white rounded-[4px] px-6 py-6"
        style={{ border: "1.5px solid #e4dfd4" }}
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2
              className="text-xs uppercase tracking-wider font-semibold"
              style={{ color: "#8a8070" }}
            >
              Services ({services.length} / {FREE_SERVICE_LIMIT})
            </h2>
          </div>
          <button
            onClick={() => !atLimit && setShowAddModal(true)}
            disabled={atLimit}
            className="flex items-center gap-2 rounded-[4px] px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-colors duration-150 cursor-pointer disabled:cursor-not-allowed"
            style={{
              background: atLimit ? "#e4dfd4" : "#1a1714",
              color: atLimit ? "#8a8070" : "#f5f2eb",
              border: `1.5px solid ${atLimit ? "#e4dfd4" : "#1a1714"}`,
            }}
            onMouseEnter={(e) => {
              if (!atLimit) {
                e.currentTarget.style.background = "#e8500a";
                e.currentTarget.style.borderColor = "#e8500a";
              }
            }}
            onMouseLeave={(e) => {
              if (!atLimit) {
                e.currentTarget.style.background = "#1a1714";
                e.currentTarget.style.borderColor = "#1a1714";
              }
            }}
            title={
              atLimit
                ? "Free plan limit reached — upgrade to add more services"
                : undefined
            }
          >
            <Plus size={13} />
            Add service
          </button>
        </div>

        {services.length === 0 ? (
          <div className="flex flex-col items-center text-center py-16">
            <div
              className="w-16 h-16 rounded-[4px] flex items-center justify-center mb-5"
              style={{
                background: "rgba(232,80,10,0.08)",
                border: "1px solid rgba(232,80,10,0.15)",
              }}
            >
              <CheckCircle size={28} style={{ color: "#e8500a" }} />
            </div>
            <h3
              style={{
                fontFamily: "var(--font-head)",
                fontWeight: 700,
                fontSize: "1rem",
                marginBottom: "6px",
              }}
            >
              No services yet
            </h3>
            <p className="text-sm max-w-sm" style={{ color: "#8a8070" }}>
              Add your first service to start tracking its status (e.g., API,
              Website, Database).
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {services.map((service) => {
              const colors = getStatusColor(service.status);
              return (
                <div
                  key={service.id}
                  className="flex items-center justify-between px-5 py-4 rounded-[4px]"
                  style={{
                    border: "1.5px solid #e4dfd4",
                    background: "#f5f2eb",
                  }}
                >
                  <div className="flex items-center gap-4 flex-1">
                    <span
                      className="text-sm font-medium"
                      style={{ color: "#1a1714" }}
                    >
                      {service.name}
                    </span>
                    <div
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-[4px] text-xs font-semibold"
                      style={{
                        background: colors.bg,
                        color: colors.text,
                        border: `1px solid ${colors.border}`,
                      }}
                    >
                      {getStatusIcon(service.status)}
                      {getStatusLabel(service.status)}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
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
                      <Edit2 size={15} />
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
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {atLimit && (
        <div
          className="flex items-center gap-3 px-4 py-3 rounded-[4px] text-xs"
          style={{
            background: "rgba(232,80,10,0.08)",
            border: "1px solid rgba(232,80,10,0.15)",
            color: "#3d3830",
          }}
        >
          <AlertCircle size={16} style={{ color: "#e8500a" }} />
          <span>
            You've reached the Free plan limit of {FREE_SERVICE_LIMIT} services.{" "}
            <button
              className="font-semibold underline underline-offset-2 cursor-pointer"
              style={{ color: "#e8500a" }}
            >
              Upgrade to Pro
            </button>{" "}
            for up to 10 services per page.
          </span>
        </div>
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
    </>
  );
}
