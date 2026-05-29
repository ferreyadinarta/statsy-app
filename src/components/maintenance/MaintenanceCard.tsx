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

const BLUE = "#3d6b9e";

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
      <div
        className="px-5 py-3"
        style={{ background: "rgba(61,107,158,0.08)", borderBottom: `2px solid ${BLUE}` }}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <span
              className="inline-block px-2.5 py-1 rounded-[4px] text-[11px] font-bold uppercase tracking-wider mb-1.5"
              style={{ background: BLUE, color: "white" }}
            >
              {stateLabels[m.state]}
            </span>
            <h4 className="text-lg font-black break-words" style={{ color: "#1a1714" }}>
              {m.title}
            </h4>
            <p className="text-xs font-semibold mt-0.5" style={{ color: "#2f5580" }}>
              {formatRange(m.starts_at, m.ends_at)}
            </p>
          </div>
          <button
            onClick={remove}
            disabled={busy}
            title="Delete"
            className="p-2 rounded-[4px] cursor-pointer flex-shrink-0"
            style={{ border: "1.5px solid #e4dfd4", color: "#8a8070" }}
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {(m.description || linkedNames.length > 0) && (
        <div className="px-5 py-4 space-y-2">
          {m.description && (
            <p className="text-sm whitespace-pre-wrap" style={{ color: "#3d3830" }}>
              {m.description}
            </p>
          )}
          {linkedNames.length > 0 && (
            <p className="text-xs" style={{ color: "#8a8070" }}>
              Affected: {linkedNames.join(", ")}
            </p>
          )}
        </div>
      )}

      {error && (
        <p
          className="px-5 py-2 text-xs font-semibold"
          style={{ color: "#d32f2f", borderTop: "1.5px solid #e4dfd4" }}
        >
          {error}
        </p>
      )}

      {!muted && (
        <div className="px-5 py-3 flex gap-2" style={{ borderTop: "1.5px solid #e4dfd4" }}>
          {m.state === "scheduled" && (
            <ActionButton label="Start now" onClick={() => act("start")} disabled={busy} />
          )}
          {m.state === "in_progress" && (
            <ActionButton label="Complete" onClick={() => act("complete")} disabled={busy} />
          )}
          <ActionButton label="Cancel" onClick={() => act("cancel")} disabled={busy} subtle />
        </div>
      )}
    </div>
  );
}

function ActionButton({
  label, onClick, disabled, subtle,
}: { label: string; onClick: () => void; disabled?: boolean; subtle?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="px-3 py-1.5 rounded-[4px] text-xs font-bold uppercase tracking-wider cursor-pointer"
      style={
        subtle
          ? { border: "1.5px solid #e4dfd4", color: "#8a8070", background: "white" }
          : { background: "#1a1714", border: "1.5px solid #1a1714", color: "#f5f2eb" }
      }
    >
      {label}
    </button>
  );
}
