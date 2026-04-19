"use client";

import { useEffect, useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { X, AlertTriangle } from "lucide-react";
import { useToast } from "@/lib/use-toast";

type Props = {
  incidentId: string;
  incidentTitle: string;
  onClose: () => void;
};

export default function DeleteIncidentConfirm({
  incidentId,
  incidentTitle,
  onClose,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [isRefreshing, startRefresh] = useTransition();

  const supabase = createClient();
  const router = useRouter();
  const { success, error: showError } = useToast();

  useEffect(() => {
    if (submitted && !isRefreshing) {
      success("Incident deleted.");
      setLoading(false);
      setSubmitted(false);
      onClose();
    }
  }, [submitted, isRefreshing, success, onClose]);

  async function handleDelete() {
    setLoading(true);

    const { error } = await supabase
      .from("incidents")
      .delete()
      .eq("id", incidentId);

    if (error) {
      setLoading(false);
      showError("Failed to delete incident. Please try again.");
      return;
    }

    setSubmitted(true);
    startRefresh(() => {
      router.refresh();
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-6"
      style={{ background: "rgba(26,23,20,0.5)" }}
      onClick={() => !loading && onClose()}
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
            Delete incident
          </h2>
          <button
            onClick={() => !loading && onClose()}
            disabled={loading || isRefreshing}
            className="transition-colors rounded-[4px] p-1 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ color: "#8a8070" }}
            onMouseEnter={(e) => {
              if (!(loading || isRefreshing)) e.currentTarget.style.color = "#1a1714";
            }}
            onMouseLeave={(e) => {
              if (!(loading || isRefreshing)) e.currentTarget.style.color = "#8a8070";
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="px-8 py-6 flex flex-col gap-5">
          {/* Warning */}
          <div
            className="flex gap-3 px-4 py-4 rounded-[4px]"
            style={{
              background: "#fdeae8",
              border: "1px solid #d32f2f",
            }}
          >
            <AlertTriangle
              size={20}
              style={{ color: "#d32f2f", flexShrink: 0 }}
            />
            <div>
              <p
                className="text-sm font-semibold mb-1"
                style={{ color: "#1a1714" }}
              >
                Are you sure?
              </p>
              <p
                className="text-sm leading-relaxed"
                style={{ color: "#3d3830" }}
              >
                This will permanently delete{" "}
                <strong>"{incidentTitle}"</strong> and all its updates. This
                action cannot be undone.
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading || isRefreshing}
              className="flex-1 rounded-[4px] px-5 py-3 text-sm font-medium transition-colors duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: "white",
                color: "#3d3830",
                border: "1.5px solid #e4dfd4",
              }}
              onMouseEnter={(e) => {
                if (!(loading || isRefreshing)) e.currentTarget.style.background = "#f5f2eb";
              }}
              onMouseLeave={(e) => {
                if (!(loading || isRefreshing)) e.currentTarget.style.background = "white";
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={loading || isRefreshing}
              className="flex-1 rounded-[4px] px-5 py-3 text-sm font-medium transition-colors duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: (loading || isRefreshing) ? "#8a8070" : "#d32f2f",
                color: "white",
                border: `1.5px solid ${(loading || isRefreshing) ? "#8a8070" : "#d32f2f"}`,
              }}
              onMouseEnter={(e) => {
                if (!(loading || isRefreshing)) {
                  e.currentTarget.style.background = "#b71c1c";
                  e.currentTarget.style.borderColor = "#b71c1c";
                }
              }}
              onMouseLeave={(e) => {
                if (!(loading || isRefreshing)) {
                  e.currentTarget.style.background = "#d32f2f";
                  e.currentTarget.style.borderColor = "#d32f2f";
                }
              }}
            >
              {(loading || isRefreshing) ? "Deleting…" : "Delete incident"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
