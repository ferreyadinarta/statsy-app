"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { X, AlertCircle } from "lucide-react";
import { useToast } from "@/lib/use-toast";

type Props = {
  pageId: string;
  onClose: () => void;
};

type IncidentStatus =
  | "investigating"
  | "identified"
  | "monitoring"
  | "resolved";

type FieldErrors = {
  title?: string;
};

export default function CreateIncidentModal({ pageId, onClose }: Props) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<IncidentStatus>("investigating");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [loading, setLoading] = useState(false);

  const supabase = createClient();
  const router = useRouter();
  const { success, error: showError } = useToast();

  function validate(): boolean {
    const errors: FieldErrors = {};
    if (!title.trim()) {
      errors.title = "Incident title is required.";
    } else if (title.trim().length < 3) {
      errors.title = "Title must be at least 3 characters.";
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      showError("Not authenticated. Please log in again.");
      setLoading(false);
      return;
    }

    const { error } = await supabase.from("incidents").insert({
      title: title.trim(),
      description: description.trim() || null,
      status,
      status_page_id: pageId,
      user_id: user.id,
    });

    if (error) {
      setLoading(false);
      showError("Failed to post incident. Please try again.");
      return;
    }

    router.refresh();

    setTimeout(() => {
      success("Incident Posted Successfully!");
      setLoading(false);
      onClose();
    }, 500);
  }

  const statusOptions: {
    value: IncidentStatus;
    label: string;
    color: string;
  }[] = [
    { value: "investigating", label: "Investigating", color: "#ff9800" },
    { value: "identified", label: "Identified", color: "#fb8c00" },
    { value: "monitoring", label: "Monitoring", color: "#66bb6a" },
    { value: "resolved", label: "Resolved", color: "#1a7a4a" },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-6"
      style={{ background: "rgba(26,23,20,0.5)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white rounded-[4px]"
        style={{
          border: "1.5px solid #1a1714",
          boxShadow: "6px 6px 0 #1a1714",
        }}
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
            Post incident
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
        <form
          onSubmit={handleSubmit}
          noValidate
          className="px-8 py-6 flex flex-col gap-5"
        >
          {/* Title */}
          <div className="flex flex-col gap-2">
            <label
              className="text-xs font-semibold uppercase tracking-[0.08em]"
              style={{ color: "#3d3830" }}
            >
              Incident title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setFieldErrors((prev) => ({ ...prev, title: undefined }));
              }}
              placeholder="e.g. API Performance Issues"
              className="rounded-[4px] px-4 py-3 text-sm outline-none bg-white placeholder:text-[#c4bfb4]"
              style={{
                border: `1.5px solid ${fieldErrors.title ? "#d32f2f" : "#e4dfd4"}`,
                color: "#1a1714",
              }}
              maxLength={200}
              autoFocus
            />
            {fieldErrors.title && (
              <span className="text-xs" style={{ color: "#d32f2f" }}>
                {fieldErrors.title}
              </span>
            )}
          </div>

          {/* Description */}
          <div className="flex flex-col gap-2">
            <label
              className="text-xs font-semibold uppercase tracking-[0.08em]"
              style={{ color: "#3d3830" }}
            >
              Description (optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide details about the incident..."
              rows={4}
              className="rounded-[4px] px-4 py-3 text-sm outline-none bg-white placeholder:text-[#c4bfb4] resize-none"
              style={{
                border: "1.5px solid #e4dfd4",
                color: "#1a1714",
              }}
              maxLength={1000}
            />
          </div>

          {/* Status */}
          <div className="flex flex-col gap-2">
            <label
              className="text-xs font-semibold uppercase tracking-[0.08em]"
              style={{ color: "#3d3830" }}
            >
              Initial status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as IncidentStatus)}
              className="rounded-[4px] px-4 py-3 text-sm outline-none bg-white cursor-pointer"
              style={{
                border: "1.5px solid #e4dfd4",
                color: "#1a1714",
              }}
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Actions */}
          <div
            className="flex gap-3 pt-4"
            style={{ borderTop: "1.5px solid #e4dfd4" }}
          >
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 rounded-[4px] px-4 py-3 text-sm font-semibold transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: "white",
                border: "1.5px solid #e4dfd4",
                color: "#3d3830",
              }}
              onMouseEnter={(e) => {
                if (!loading) e.currentTarget.style.background = "#f5f2eb";
              }}
              onMouseLeave={(e) => {
                if (!loading) e.currentTarget.style.background = "white";
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-[4px] px-4 py-3 text-sm font-semibold transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: loading ? "#8a8070" : "#1a1714",
                border: "1.5px solid #1a1714",
                color: "#f5f2eb",
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.background = "#e8500a";
                  e.currentTarget.style.borderColor = "#e8500a";
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.currentTarget.style.background = "#1a1714";
                  e.currentTarget.style.borderColor = "#1a1714";
                }
              }}
            >
              {loading ? "Posting..." : "Post incident"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
