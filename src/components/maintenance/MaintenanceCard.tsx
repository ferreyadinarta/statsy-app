"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";

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
  onChanged: () => void;
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

function formatRange(startsAt: string, endsAt: string): string {
  const s = new Date(startsAt).toLocaleString("en-US", {
    weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
  });
  const e = new Date(endsAt).toLocaleString("en-US", { hour: "numeric", minute: "2-digit" });
  return `${s} – ${e}`;
}

export default function MaintenanceCard({ maintenance: m, serviceNames, onChanged }: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const muted = m.state === "completed" || m.state === "cancelled";
  const colors = stateColors[m.state];

  async function act(action: "start" | "complete" | "cancel") {
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/maintenance?id=${m.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    setBusy(false);
    if (!res.ok) {
      setError("Action failed. Please try again.");
      return;
    }
    onChanged();
  }

  async function remove() {
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/maintenance?id=${m.id}`, { method: "DELETE" });
    setBusy(false);
    if (!res.ok) {
      setError("Delete failed. Please try again.");
      return;
    }
    onChanged();
  }

  const linkedNames = (m.maintenance_window_services ?? [])
    .map((l) => serviceNames[l.service_id])
    .filter(Boolean);

  return (
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

          {/* Owner actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {m.state === "scheduled" && (
              <ActionButton label="Start now" onClick={() => act("start")} disabled={busy} />
            )}
            {m.state === "in_progress" && (
              <ActionButton label="Complete" onClick={() => act("complete")} disabled={busy} />
            )}
            {!muted && (
              <ActionButton label="Cancel" onClick={() => act("cancel")} disabled={busy} subtle />
            )}
            <button
              onClick={remove}
              disabled={busy}
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

      {error && (
        <p className="px-6 py-3 text-xs font-semibold" style={{ color: "#d32f2f", borderTop: "1.5px solid #e4dfd4" }}>
          {error}
        </p>
      )}
    </div>
  );
}

function ActionButton({
  label, onClick, disabled, subtle,
}: { label: string; onClick: () => void; disabled?: boolean; subtle?: boolean }) {
  if (subtle) {
    return (
      <button
        onClick={onClick}
        disabled={disabled}
        className="px-4 py-2 rounded-[4px] text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-50"
        style={{ background: "white", border: "1.5px solid #e4dfd4", color: "#8a8070" }}
        onMouseEnter={(e) => {
          if (!disabled) e.currentTarget.style.background = "#f5f2eb";
        }}
        onMouseLeave={(e) => {
          if (!disabled) e.currentTarget.style.background = "white";
        }}
      >
        {label}
      </button>
    );
  }
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="px-4 py-2 rounded-[4px] text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-50"
      style={{ background: "#1a1714", border: "1.5px solid #1a1714", color: "#f5f2eb" }}
      onMouseEnter={(e) => {
        if (!disabled) {
          e.currentTarget.style.background = "#e8500a";
          e.currentTarget.style.borderColor = "#e8500a";
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled) {
          e.currentTarget.style.background = "#1a1714";
          e.currentTarget.style.borderColor = "#1a1714";
        }
      }}
    >
      {label}
    </button>
  );
}
