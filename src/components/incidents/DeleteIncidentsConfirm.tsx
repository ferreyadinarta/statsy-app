"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useToast } from "@/lib/use-toast";
import { AlertTriangle } from "lucide-react";

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
  const supabase = createClient();
  const router = useRouter();
  const { success, error: showError } = useToast();

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

    router.refresh();

    setTimeout(() => {
      success("Incident deleted.");
      setLoading(false);
      onClose();
    }, 500);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-6"
      style={{ background: "rgba(26,23,20,0.5)" }}
      onClick={() => !loading && onClose()}
    >
      <div
        className="w-full max-w-sm bg-white rounded-[4px]"
        style={{
          border: "1.5px solid #1a1714",
          boxShadow: "6px 6px 0 #1a1714",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="px-8 pt-7 pb-6"
          style={{ borderBottom: "1.5px solid #e4dfd4" }}
        >
          <div className="flex items-center gap-3 mb-2">
            <AlertTriangle
              size={18}
              style={{ color: "#d32f2f", flexShrink: 0 }}
            />
            <h2
              style={{
                fontFamily: "var(--font-head)",
                fontWeight: 900,
                fontSize: "1.2rem",
                letterSpacing: "-0.03em",
                margin: 0,
              }}
            >
              Delete incident
            </h2>
          </div>
          <p className="text-sm" style={{ color: "#8a8070" }}>
            Are you sure you want to delete{" "}
            <strong style={{ color: "#1a1714" }}>"{incidentTitle}"</strong>?
            This will also delete all its updates and cannot be undone.
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 px-8 py-6">
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
            type="button"
            onClick={handleDelete}
            disabled={loading}
            className="flex-1 rounded-[4px] px-4 py-3 text-sm font-semibold transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: loading ? "#8a8070" : "#d32f2f",
              border: `1.5px solid ${loading ? "#8a8070" : "#d32f2f"}`,
              color: "white",
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.background = "#b71c1c";
                e.currentTarget.style.borderColor = "#b71c1c";
              }
            }}
            onMouseLeave={(e) => {
              if (!loading) {
                e.currentTarget.style.background = "#d32f2f";
                e.currentTarget.style.borderColor = "#d32f2f";
              }
            }}
          >
            {loading ? "Deleting..." : "Delete incident"}
          </button>
        </div>
      </div>
    </div>
  );
}
