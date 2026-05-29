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
    if (!title || !startsAt || !endsAt) {
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
        title,
        description,
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(26,23,20,0.5)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-[4px] bg-white"
        style={{ border: "1.5px solid #1a1714", boxShadow: "3px 3px 0 #1a1714" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ background: "rgba(61,107,158,0.08)", borderBottom: `2px solid ${BLUE}` }}
        >
          <h3 className="text-lg font-black" style={{ color: "#1a1714" }}>
            Schedule maintenance
          </h3>
          <button onClick={onClose} className="cursor-pointer" style={{ color: "#8a8070" }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <Field label="Title">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Database upgrade"
              className="w-full px-3 py-2 rounded-[4px] text-sm"
              style={{ border: "1.5px solid #e4dfd4" }}
            />
          </Field>

          <Field label="Description (optional)">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="What will happen and the expected impact."
              className="w-full px-3 py-2 rounded-[4px] text-sm"
              style={{ border: "1.5px solid #e4dfd4" }}
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Starts">
              <input
                type="datetime-local"
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
                className="w-full px-3 py-2 rounded-[4px] text-sm"
                style={{ border: "1.5px solid #e4dfd4" }}
              />
            </Field>
            <Field label="Ends">
              <input
                type="datetime-local"
                value={endsAt}
                onChange={(e) => setEndsAt(e.target.value)}
                className="w-full px-3 py-2 rounded-[4px] text-sm"
                style={{ border: "1.5px solid #e4dfd4" }}
              />
            </Field>
          </div>

          {services.length > 0 && (
            <Field label="Affected services (optional — none = all systems)">
              <div className="flex flex-wrap gap-2">
                {services.map((s) => {
                  const on = serviceIds.includes(s.id);
                  return (
                    <button
                      type="button"
                      key={s.id}
                      onClick={() => toggleService(s.id)}
                      className="px-3 py-1.5 rounded-[4px] text-xs font-bold cursor-pointer"
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
            </Field>
          )}

          {error && (
            <p className="text-sm font-semibold" style={{ color: "#d32f2f" }}>
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-[4px] text-xs font-bold uppercase tracking-wider cursor-pointer"
              style={{ border: "1.5px solid #e4dfd4", color: "#8a8070" }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded-[4px] text-xs font-bold uppercase tracking-wider cursor-pointer"
              style={{ background: BLUE, border: `1.5px solid ${BLUE}`, color: "white" }}
            >
              {submitting ? "Scheduling…" : "Schedule"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label
        className="block text-xs font-bold uppercase tracking-wider mb-1.5"
        style={{ color: "#1a1714" }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}
