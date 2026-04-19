"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { X, ChevronDown } from "lucide-react";
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

const statusOptions: {
  value: IncidentStatus;
  label: string;
  color: string;
  bg: string;
  border: string;
}[] = [
  {
    value: "investigating",
    label: "Investigating",
    color: "#e8500a",
    bg: "rgba(232,80,10,0.08)",
    border: "#e8500a",
  },
  {
    value: "identified",
    label: "Identified",
    color: "#fb8c00",
    bg: "rgba(251,140,0,0.08)",
    border: "#fb8c00",
  },
  {
    value: "monitoring",
    label: "Monitoring",
    color: "#1a7a4a",
    bg: "#e8f5ee",
    border: "#1a7a4a",
  },
  {
    value: "resolved",
    label: "Resolved",
    color: "#1a7a4a",
    bg: "#e8f5ee",
    border: "#1a7a4a",
  },
];

export default function CreateIncidentModal({ pageId, onClose }: Props) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<IncidentStatus>("investigating");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [loading, setLoading] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { success, error: showError } = useToast();

  const selectedOption = statusOptions.find((o) => o.value === status)!;

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownOpen]);

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

    const res = await fetch("/api/incidents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: title.trim(),
        description: description.trim() || null,
        status,
        status_page_id: pageId,
      }),
    });

    if (!res.ok) {
      const { error } = await res.json();
      setLoading(false);
      showError(error ?? "Failed to post incident. Please try again.");
      return;
    }

    fetch("/api/notify-subscribers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status_page_id: pageId,
        incidentTitle: title,
        incidentStatus: status,
        incidentMessage: description,
      }),
    }).catch((err) => console.error("Notification failed:", err));

    router.refresh();

    setTimeout(() => {
      success("Incident Posted Successfully!");
      setLoading(false);
      onClose();
    }, 500);
  }

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

          {/* Status — custom dropdown */}
          <div className="flex flex-col gap-2">
            <label
              className="text-xs font-semibold uppercase tracking-[0.08em]"
              style={{ color: "#3d3830" }}
            >
              Initial status
            </label>
            <div className="relative" ref={dropdownRef}>
              {/* Trigger */}
              <button
                type="button"
                onClick={() => setDropdownOpen((prev) => !prev)}
                className="w-full flex items-center justify-between px-4 py-3 rounded-[4px] cursor-pointer transition-colors"
                style={{
                  border: `1.5px solid ${dropdownOpen ? "#1a1714" : "#e4dfd4"}`,
                  background: "white",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.borderColor = "#1a1714")
                }
                onMouseLeave={(e) => {
                  if (!dropdownOpen)
                    e.currentTarget.style.borderColor = "#e4dfd4";
                }}
              >
                <span
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[4px] text-xs font-bold uppercase tracking-wide"
                  style={{
                    background: selectedOption.bg,
                    color: selectedOption.color,
                    border: `1.5px solid ${selectedOption.border}`,
                  }}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ background: selectedOption.color }}
                  />
                  {selectedOption.label}
                </span>
                <ChevronDown
                  size={16}
                  style={{
                    color: "#8a8070",
                    transform: dropdownOpen ? "rotate(180deg)" : "rotate(0deg)",
                    transition: "transform 150ms",
                  }}
                />
              </button>

              {/* Dropdown options */}
              {dropdownOpen && (
                <div
                  className="absolute top-full left-0 right-0 mt-1 rounded-[4px] overflow-hidden z-10"
                  style={{
                    border: "1.5px solid #1a1714",
                    background: "white",
                    boxShadow: "3px 3px 0 #1a1714",
                  }}
                >
                  {statusOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        setStatus(option.value);
                        setDropdownOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-4 py-3 text-left cursor-pointer transition-colors"
                      style={{
                        background:
                          status === option.value ? "#f5f2eb" : "white",
                        borderBottom: "1px solid #e4dfd4",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background = "#f5f2eb")
                      }
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background =
                          status === option.value ? "#f5f2eb" : "white";
                      }}
                    >
                      <span
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[4px] text-xs font-bold uppercase tracking-wide"
                        style={{
                          background: option.bg,
                          color: option.color,
                          border: `1.5px solid ${option.border}`,
                        }}
                      >
                        <span
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ background: option.color }}
                        />
                        {option.label}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
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
