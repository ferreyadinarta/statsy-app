"use client";

import { useState } from "react";
import { X } from "lucide-react";

type Service = { id: string; name: string };

type Props = {
  statusPageId: string;
  services: Service[];
  onClose: () => void;
  onSuccess: () => void;
};

const BLUE = "#3d6b9e";

export default function ScheduleMaintenanceModal({
  statusPageId,
  services,
  onClose,
  onSuccess,
}: Props) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [serviceIds, setServiceIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function toggleService(id: string) {
    setServiceIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!title.trim() || !startsAt || !endsAt) {
      setError("Title, start, and end are required.");
      return;
    }
    if (new Date(endsAt) <= new Date(startsAt)) {
      setError("End time must be after start time.");
      return;
    }
    setSubmitting(true);
    const res = await fetch("/api/maintenance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status_page_id: statusPageId,
        title: title.trim(),
        description: description.trim() || null,
        starts_at: new Date(startsAt).toISOString(),
        ends_at: new Date(endsAt).toISOString(),
        service_ids: serviceIds,
      }),
    });
    setSubmitting(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Something went wrong.");
      return;
    }
    onSuccess();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-6"
      style={{ background: "rgba(26,23,20,0.5)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md max-h-[90vh] overflow-y-auto bg-white rounded-[4px]"
        style={{ border: "1.5px solid #1a1714", boxShadow: "6px 6px 0 #1a1714" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-8 pt-7 pb-6"
          style={{ borderBottom: "1.5px solid #e4dfd4" }}
        >
          <h2
            style={{
              fontFamily: "var(--font-head)",
              fontWeight: 900,
              fontSize: "1.4rem",
              letterSpacing: "-0.03em",
            }}
          >
            Schedule maintenance
          </h2>
          <button
            onClick={onClose}
            className="transition-colors rounded-[4px] p-1 cursor-pointer"
            style={{ color: "#8a8070" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#1a1714")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#8a8070")}
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate className="px-8 py-6 flex flex-col gap-5">
          {/* Title */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold uppercase tracking-[0.08em]" style={{ color: "#3d3830" }}>
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Database upgrade"
              className="rounded-[4px] px-4 py-3 text-sm outline-none bg-white placeholder:text-[#c4bfb4]"
              style={{ border: "1.5px solid #e4dfd4", color: "#1a1714" }}
              maxLength={200}
              autoFocus
            />
          </div>

          {/* Description */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold uppercase tracking-[0.08em]" style={{ color: "#3d3830" }}>
              Description (optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What will happen and the expected impact..."
              rows={4}
              className="rounded-[4px] px-4 py-3 text-sm outline-none bg-white placeholder:text-[#c4bfb4] resize-none"
              style={{ border: "1.5px solid #e4dfd4", color: "#1a1714" }}
              maxLength={1000}
            />
          </div>

          {/* Window */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold uppercase tracking-[0.08em]" style={{ color: "#3d3830" }}>
                Starts
              </label>
              <input
                type="datetime-local"
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
                className="rounded-[4px] px-4 py-3 text-sm outline-none bg-white"
                style={{ border: "1.5px solid #e4dfd4", color: "#1a1714" }}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold uppercase tracking-[0.08em]" style={{ color: "#3d3830" }}>
                Ends
              </label>
              <input
                type="datetime-local"
                value={endsAt}
                onChange={(e) => setEndsAt(e.target.value)}
                className="rounded-[4px] px-4 py-3 text-sm outline-none bg-white"
                style={{ border: "1.5px solid #e4dfd4", color: "#1a1714" }}
              />
            </div>
          </div>

          {/* Affected services */}
          {services.length > 0 && (
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold uppercase tracking-[0.08em]" style={{ color: "#3d3830" }}>
                Affected services (optional — none = all systems)
              </label>
              <div className="flex flex-wrap gap-2">
                {services.map((s) => {
                  const on = serviceIds.includes(s.id);
                  return (
                    <button
                      type="button"
                      key={s.id}
                      onClick={() => toggleService(s.id)}
                      className="px-3 py-1.5 rounded-[4px] text-xs font-bold uppercase tracking-wide cursor-pointer transition-colors"
                      style={{
                        border: `1.5px solid ${on ? BLUE : "#e4dfd4"}`,
                        background: on ? "rgba(61,107,158,0.08)" : "white",
                        color: on ? "#2f5580" : "#8a8070",
                      }}
                    >
                      {s.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {error && (
            <span className="text-xs" style={{ color: "#d32f2f" }}>
              {error}
            </span>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4" style={{ borderTop: "1.5px solid #e4dfd4" }}>
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="flex-1 rounded-[4px] px-4 py-3 text-sm font-semibold transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: "white", border: "1.5px solid #e4dfd4", color: "#3d3830" }}
              onMouseEnter={(e) => {
                if (!submitting) e.currentTarget.style.background = "#f5f2eb";
              }}
              onMouseLeave={(e) => {
                if (!submitting) e.currentTarget.style.background = "white";
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 rounded-[4px] px-4 py-3 text-sm font-semibold transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: submitting ? "#8a8070" : "#1a1714",
                border: "1.5px solid #1a1714",
                color: "#f5f2eb",
              }}
              onMouseEnter={(e) => {
                if (!submitting) {
                  e.currentTarget.style.background = "#e8500a";
                  e.currentTarget.style.borderColor = "#e8500a";
                }
              }}
              onMouseLeave={(e) => {
                if (!submitting) {
                  e.currentTarget.style.background = "#1a1714";
                  e.currentTarget.style.borderColor = "#1a1714";
                }
              }}
            >
              {submitting ? "Scheduling..." : "Schedule"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
