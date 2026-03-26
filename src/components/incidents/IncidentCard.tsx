"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import PostUpdateModal from "./PostUpdateModal";
import DeleteIncidentConfirm from "./DeleteIncidentsConfirm";

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
  status_page_id: string;
  incident_updates: IncidentUpdate[];
};

type Props = {
  incident: Incident;
  isOwner?: boolean;
};

const statusColors = {
  investigating: {
    bg: "rgba(232,80,10,0.08)",
    border: "#e8500a",
    text: "#e8500a",
  },
  identified: {
    bg: "rgba(251,140,0,0.08)",
    border: "#fb8c00",
    text: "#fb8c00",
  },
  monitoring: { bg: "#e8f5ee", border: "#1a7a4a", text: "#1a7a4a" },
  resolved: { bg: "#e8f5ee", border: "#1a7a4a", text: "#1a7a4a" },
};

const statusLabels = {
  investigating: "Investigating",
  identified: "Identified",
  monitoring: "Monitoring",
  resolved: "Resolved",
};

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

export default function IncidentCard({ incident, isOwner = false }: Props) {
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const colors = statusColors[incident.status];

  const sortedUpdates = [...incident.incident_updates].sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );

  return (
    <>
      <div
        className="rounded-[4px] overflow-hidden"
        style={{
          border: "1.5px solid #1a1714",
          background: "white",
          boxShadow: "3px 3px 0 #1a1714",
        }}
      >
        {/* Header with status banner */}
        <div
          className="px-6 py-4"
          style={{
            background: colors.bg,
            borderBottom: `2px solid ${colors.border}`,
          }}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <span
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[4px] text-xs font-bold uppercase tracking-wider"
                  style={{ background: colors.border, color: "white" }}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-white" />
                  {statusLabels[incident.status]}
                </span>
                <span
                  className="text-xs font-medium"
                  style={{ color: "#8a8070" }}
                >
                  Posted {formatDate(incident.created_at)}
                </span>
              </div>
              <h3
                className="text-xl font-black break-words"
                style={{
                  fontFamily: "var(--font-head)",
                  color: "#1a1714",
                  letterSpacing: "-0.03em",
                  lineHeight: "1.2",
                }}
              >
                {incident.title}
              </h3>
            </div>

            {/* Owner actions */}
            {isOwner && (
              <div className="flex items-center gap-2 flex-shrink-0">
                {incident.status !== "resolved" && (
                  <button
                    onClick={() => setShowUpdateModal(true)}
                    className="px-4 py-2 rounded-[4px] text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                    style={{
                      background: "#1a1714",
                      border: "1.5px solid #1a1714",
                      color: "#f5f2eb",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "#e8500a";
                      e.currentTarget.style.borderColor = "#e8500a";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "#1a1714";
                      e.currentTarget.style.borderColor = "#1a1714";
                    }}
                  >
                    Update
                  </button>
                )}
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="p-2 rounded-[4px] transition-colors cursor-pointer"
                  style={{
                    background: "white",
                    border: "1.5px solid #e4dfd4",
                    color: "#8a8070",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "#d32f2f";
                    e.currentTarget.style.color = "#d32f2f";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "#e4dfd4";
                    e.currentTarget.style.color = "#8a8070";
                  }}
                  title="Delete incident"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Description */}
        {incident.description && (
          <div
            className="px-6 py-5"
            style={{ borderBottom: "1.5px solid #e4dfd4" }}
          >
            <p
              className="text-base leading-relaxed whitespace-pre-wrap break-words"
              style={{ color: "#3d3830" }}
            >
              {incident.description}
            </p>
          </div>
        )}

        {/* Updates timeline */}
        {sortedUpdates.length > 0 && (
          <div className="px-6 py-6">
            <div className="flex items-center justify-between mb-5">
              <h4
                className="text-xs font-bold uppercase tracking-[0.12em]"
                style={{ color: "#1a1714" }}
              >
                Updates
              </h4>
              <span
                className="text-xs font-semibold px-2 py-0.5 rounded-full"
                style={{ background: "#e4dfd4", color: "#3d3830" }}
              >
                {sortedUpdates.length}
              </span>
            </div>

            <div className="relative">
              <div
                className="absolute left-[11px] top-3 bottom-3"
                style={{
                  width: "3px",
                  background: "#e4dfd4",
                  borderRadius: "3px",
                }}
              />

              <div className="space-y-6">
                {sortedUpdates.map((update, index) => {
                  const updateColors = statusColors[update.status];
                  const isLatest = index === 0;

                  return (
                    <div key={update.id} className="relative pl-12">
                      <div
                        className="absolute left-0 top-1 flex items-center justify-center"
                        style={{ width: "26px", height: "26px" }}
                      >
                        <div
                          className="w-6 h-6 rounded-full flex items-center justify-center"
                          style={{
                            background: isLatest
                              ? updateColors.border
                              : "white",
                            border: `3px solid ${isLatest ? updateColors.border : "#e4dfd4"}`,
                          }}
                        >
                          {isLatest && (
                            <div
                              className="w-2 h-2 rounded-full"
                              style={{ background: "white" }}
                            />
                          )}
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center gap-2.5 mb-2.5 flex-wrap">
                          <span
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[4px] text-xs font-bold uppercase tracking-wide"
                            style={{
                              background: updateColors.bg,
                              color: updateColors.text,
                              border: `1.5px solid ${updateColors.border}`,
                            }}
                          >
                            <span
                              className="w-1.5 h-1.5 rounded-full"
                              style={{ background: updateColors.text }}
                            />
                            {statusLabels[update.status]}
                          </span>
                          <span
                            className="text-xs font-semibold"
                            style={{ color: "#8a8070" }}
                          >
                            {formatDate(update.created_at)}
                          </span>
                        </div>
                        <p
                          className="text-base leading-relaxed whitespace-pre-wrap break-words"
                          style={{ color: "#1a1714" }}
                        >
                          {update.message}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {showUpdateModal && (
        <PostUpdateModal
          incidentId={incident.id}
          currentStatus={incident.status}
          statusPageId={incident.status_page_id}
          onClose={() => setShowUpdateModal(false)}
          incidentTitle={incident.title}
        />
      )}

      {showDeleteConfirm && (
        <DeleteIncidentConfirm
          incidentId={incident.id}
          incidentTitle={incident.title}
          onClose={() => setShowDeleteConfirm(false)}
        />
      )}
    </>
  );
}
