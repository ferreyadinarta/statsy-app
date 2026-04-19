"use client";

import { useState } from "react";
import { X, AlertTriangle } from "lucide-react";

type Page = {
  id: string;
  name: string;
  slug: string;
};

type Props = {
  page: Page;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isLoading?: boolean;
};

export default function DeletePageModal({ page, onClose, onConfirm, isLoading = false }: Props) {
  const [localLoading, setLocalLoading] = useState(false);
  const loading = isLoading || localLoading;

  async function handleDelete() {
    setLocalLoading(true);
    await onConfirm();
    setLocalLoading(false);
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
            Delete status page
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

        {/* Content */}
        <div className="px-8 py-6 flex flex-col gap-5">
          {/* Page info */}
          <div
            className="px-4 py-3 rounded-[4px]"
            style={{ background: "#f5f2eb", border: "1.5px solid #e4dfd4" }}
          >
            <p
              style={{
                fontFamily: "var(--font-head)",
                fontWeight: 800,
                fontSize: "0.95rem",
                letterSpacing: "-0.02em",
                color: "#1a1714",
              }}
            >
              {page.name}
            </p>
            <p className="text-xs mt-0.5" style={{ color: "#8a8070" }}>
              {page.slug}.statsy.page
            </p>
          </div>

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
                This is permanent
              </p>
              <p
                className="text-sm leading-relaxed"
                style={{ color: "#3d3830" }}
              >
                All services, incidents, updates, and subscribers for this page
                will be deleted. This action cannot be undone.
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 rounded-[4px] px-5 py-3 text-sm font-medium transition-colors duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: "white",
                color: "#3d3830",
                border: "1.5px solid #e4dfd4",
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
              onClick={handleDelete}
              disabled={loading}
              className="flex-1 rounded-[4px] px-5 py-3 text-sm font-medium transition-colors duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: "#d32f2f",
                color: "white",
                border: "1.5px solid #d32f2f",
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
              {loading ? "Deleting..." : "Delete page"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
