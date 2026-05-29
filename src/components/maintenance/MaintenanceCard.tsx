"use client";

import { useState } from "react";
import { Trash2, Pencil } from "lucide-react";
import { useToast } from "@/lib/use-toast";
import ConfirmActionModal, { type ConfirmKind } from "./ConfirmActionModal";

export type MaintenanceState = "scheduled" | "in_progress" | "completed" | "cancelled";

export type Maintenance = {
  id: string;
  title: string;
  description: string | null;
  starts_at: string;
  ends_at: string;
  state: MaintenanceState;
  maintenance_window_services?: { service_id: string }[];
};

type Props = {
  maintenance: Maintenance;
  serviceNames: Record<string, string>;
  onUpdated: (updated: Maintenance) => void;
  onDeleted: (id: string) => void;
  onEdit: (m: Maintenance) => void;
};

const stateColors: Record<MaintenanceState, { bg: string; border: string }> = {
  scheduled: { bg: "rgba(26,23,20,0.06)", border: "#1a1714" },
  in_progress: { bg: "rgba(232,80,10,0.08)", border: "#e8500a" },
  completed: { bg: "#e8f5ee", border: "#1a7a4a" },
  cancelled: { bg: "#f5f2eb", border: "#8a8070" },
};

const stateLabels: Record<MaintenanceState, string> = {
  scheduled: "Scheduled",
  in_progress: "In progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

const actionSuccess: Record<ConfirmKind, string> = {
  start: "Maintenance started.",
  complete: "Maintenance completed.",
  cancel: "Maintenance cancelled.",
  delete: "Maintenance deleted.",
};

function formatRange(startsAt: string, endsAt: string): string {
  const s = new Date(startsAt).toLocaleString("en-US", {
    weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
  });
  const e = new Date(endsAt).toLocaleString("en-US", { hour: "numeric", minute: "2-digit" });
  return `${s} – ${e}`;
}

export default function MaintenanceCard({ maintenance: m, serviceNames, onUpdated, onDeleted, onEdit }: Props) {
  const [confirm, setConfirm] = useState<ConfirmKind | null>(null);
  const [pending, setPending] = useState(false);
  const muted = m.state === "completed" || m.state === "cancelled";
  const colors = stateColors[m.state];
  const { success, error: showError } = useToast();

  async function runAction(kind: ConfirmKind) {
    setPending(true);

    if (kind === "delete") {
      const res = await fetch(`/api/maintenance?id=${m.id}`, { method: "DELETE" });
      setPending(false);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        showError(data.error || "Couldn't delete maintenance.");
        return;
      }
      success(actionSuccess.delete);
      setConfirm(null);
      onDeleted(m.id); // optimistic: parent removes it immediately
      return;
    }

    const res = await fetch(`/api/maintenance?id=${m.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: kind }),
    });
    setPending(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      showError(data.error || "Couldn't update maintenance.");
      return;
    }
    const { maintenance: updated } = await res.json();
    success(actionSuccess[kind]);
    setConfirm(null);
    // optimistic: merge so links (service ids) are preserved
    onUpdated({ ...m, ...updated });
  }

  const linkedNames = (m.maintenance_window_services ?? [])
    .map((l) => serviceNames[l.service_id])
    .filter(Boolean);

  return (
    <>
      <div
        className="rounded-[4px] overflow-hidden"
        style={{
          border: "1.5px solid #1a1714",
          background: "white",
          boxShadow: "3px 3px 0 #1a1714",
          opacity: muted ? 0.7 : 1,
        }}
      >
        {/* Header with status banner (matches IncidentCard) */}
        <div
          className="px-6 py-4"
          style={{ background: colors.bg, borderBottom: `2px solid ${colors.border}` }}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="mb-2">
                <span
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[4px] text-xs font-bold uppercase tracking-wider"
                  style={{ background: colors.border, color: "white" }}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-white" />
                  {stateLabels[m.state]}
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
                {m.title}
              </h3>
              <span className="text-xs font-semibold mt-1 block" style={{ color: "#8a8070" }}>
                {formatRange(m.starts_at, m.ends_at)}
              </span>
            </div>

            {/* Owner actions. in_progress = Complete only (can't cancel/delete a live window). */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {m.state === "scheduled" && (
                <ActionButton label="Start now" onClick={() => setConfirm("start")} />
              )}
              {m.state === "in_progress" && (
                <ActionButton label="Complete" onClick={() => setConfirm("complete")} />
              )}
              {m.state === "scheduled" && (
                <ActionButton label="Cancel" onClick={() => setConfirm("cancel")} subtle />
              )}
              {m.state === "scheduled" && (
                <button
                  onClick={() => onEdit(m)}
                  title="Edit maintenance"
                  className="p-2 rounded-[4px] transition-colors cursor-pointer"
                  style={{ background: "white", border: "1.5px solid #e4dfd4", color: "#8a8070" }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "#1a1714";
                    e.currentTarget.style.color = "#1a1714";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "#e4dfd4";
                    e.currentTarget.style.color = "#8a8070";
                  }}
                >
                  <Pencil size={14} />
                </button>
              )}
              {m.state !== "in_progress" && (
                <button
                  onClick={() => setConfirm("delete")}
                  title="Delete maintenance"
                  className="p-2 rounded-[4px] transition-colors cursor-pointer"
                  style={{ background: "white", border: "1.5px solid #e4dfd4", color: "#8a8070" }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "#d32f2f";
                    e.currentTarget.style.color = "#d32f2f";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "#e4dfd4";
                    e.currentTarget.style.color = "#8a8070";
                  }}
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          </div>
        </div>

        {(m.description || linkedNames.length > 0) && (
          <div className="px-6 py-5 space-y-2">
            {m.description && (
              <p className="text-base leading-relaxed whitespace-pre-wrap break-words" style={{ color: "#3d3830" }}>
                {m.description}
              </p>
            )}
            {linkedNames.length > 0 && (
              <p className="text-xs font-medium" style={{ color: "#8a8070" }}>
                Affected: {linkedNames.join(", ")}
              </p>
            )}
          </div>
        )}
      </div>

      {confirm && (
        <ConfirmActionModal
          kind={confirm}
          title={m.title}
          loading={pending}
          onConfirm={() => runAction(confirm)}
          onClose={() => setConfirm(null)}
        />
      )}
    </>
  );
}

function ActionButton({
  label, onClick, subtle,
}: { label: string; onClick: () => void; subtle?: boolean }) {
  if (subtle) {
    return (
      <button
        onClick={onClick}
        className="px-4 py-2 rounded-[4px] text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
        style={{ background: "white", border: "1.5px solid #e4dfd4", color: "#8a8070" }}
        onMouseEnter={(e) => { e.currentTarget.style.background = "#f5f2eb"; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = "white"; }}
      >
        {label}
      </button>
    );
  }
  return (
    <button
      onClick={onClick}
      className="px-4 py-2 rounded-[4px] text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
      style={{ background: "#1a1714", border: "1.5px solid #1a1714", color: "#f5f2eb" }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "#e8500a";
        e.currentTarget.style.borderColor = "#e8500a";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "#1a1714";
        e.currentTarget.style.borderColor = "#1a1714";
      }}
    >
      {label}
    </button>
  );
}
