"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { X, ChevronDown } from "lucide-react";
import { useToast } from "@/lib/use-toast";

type Props = {
  incidentId: string;
  currentStatus: "investigating" | "identified" | "monitoring" | "resolved";
  onClose: () => void;
  incidentTitle: string;
  statusPageId: string;
};

type IncidentStatus =
  | "investigating"
  | "identified"
  | "monitoring"
  | "resolved";

type FieldErrors = {
  message?: string;
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

export default function PostUpdateModal({
  incidentId,
  currentStatus,
  onClose,
  incidentTitle,
  statusPageId,
}: Props) {
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<IncidentStatus>(currentStatus);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [loading, setLoading] = useState(false);

  const supabase = createClient();
  const router = useRouter();
  const { success, error: showError } = useToast();
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  const selectedOption = statusOptions.find((o) => o.value === status)!;

  function validate(): boolean {
    const errors: FieldErrors = {};
    if (!message.trim()) {
      errors.message = "Update message is required.";
    } else if (message.trim().length < 3) {
      errors.message = "Message must be at least 3 characters.";
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

    const { error: updateError } = await supabase
      .from("incident_updates")
      .insert({
        incident_id: incidentId,
        user_id: user.id,
        message: message.trim(),
        status,
      });

    if (updateError) {
      setLoading(false);
      showError("Failed to post update. Please try again.");
      return;
    }

    if (status !== currentStatus) {
      const { error: statusError } = await supabase
        .from("incidents")
        .update({ status })
        .eq("id", incidentId);

      if (statusError) {
        console.error("Error updating incident status:", statusError);
      }
    }

    fetch("/api/notify-subscribers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status_page_id: statusPageId,
        incidentTitle,
        incidentStatus: status,
        incidentMessage: message,
      }),
    }).catch((err) => console.error("Notification failed:", err));

    router.refresh();

    setTimeout(() => {
      success("Update Posted Successfully!");
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
            Post update
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
          {/* Message */}
          <div className="flex flex-col gap-2">
            <label
              className="text-xs font-semibold uppercase tracking-[0.08em]"
              style={{ color: "#3d3830" }}
            >
              Update message
            </label>
            <textarea
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                setFieldErrors((prev) => ({ ...prev, message: undefined }));
              }}
              placeholder="Describe what's happening with this incident..."
              rows={4}
              className="rounded-[4px] px-4 py-3 text-sm outline-none bg-white placeholder:text-[#c4bfb4] resize-none"
              style={{
                border: `1.5px solid ${fieldErrors.message ? "#d32f2f" : "#e4dfd4"}`,
                color: "#1a1714",
              }}
              maxLength={1000}
              autoFocus
            />
            {fieldErrors.message && (
              <span className="text-xs" style={{ color: "#d32f2f" }}>
                {fieldErrors.message}
              </span>
            )}
          </div>

          {/* Status — custom dropdown */}
          <div className="flex flex-col gap-2">
            <label
              className="text-xs font-semibold uppercase tracking-[0.08em]"
              style={{ color: "#3d3830" }}
            >
              Status
            </label>
            <div className="relative" ref={dropdownRef}>
              {/* Trigger */}
              <button
                type="button"
                onClick={() => setDropdownOpen((prev) => !prev)}
                className="w-full flex items-center justify-between px-4 py-3 rounded-[4px] cursor-pointer transition-colors"
                style={{
                  border: "1.5px solid #e4dfd4",
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
                <div className="flex items-center gap-2.5">
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
                </div>
                <ChevronDown
                  size={16}
                  style={{
                    color: "#8a8070",
                    transform: dropdownOpen ? "rotate(180deg)" : "rotate(0deg)",
                    transition: "transform 150ms",
                  }}
                />
              </button>

              {/* Dropdown */}
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
              {loading ? "Posting..." : "Post update"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
