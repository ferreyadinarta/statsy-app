"use client";

import { X, AlertTriangle } from "lucide-react";

export type ConfirmKind = "start" | "complete" | "cancel" | "delete";

type Props = {
  kind: ConfirmKind;
  title: string;
  loading: boolean;
  onConfirm: () => void;
  onClose: () => void;
};

const config: Record<
  ConfirmKind,
  { heading: string; body: (title: string) => string; confirm: string; loadingLabel: string; destructive: boolean }
> = {
  start: {
    heading: "Start maintenance",
    body: () => "Start this maintenance now? Visitors will see it as in progress.",
    confirm: "Start now",
    loadingLabel: "Starting…",
    destructive: false,
  },
  complete: {
    heading: "Complete maintenance",
    body: () => "Mark this maintenance complete? Subscribers will be emailed that it's done.",
    confirm: "Complete",
    loadingLabel: "Completing…",
    destructive: false,
  },
  cancel: {
    heading: "Cancel maintenance",
    body: (t) => `Cancel "${t}"? Subscribers will be emailed that it's off. The window stays as a cancelled record.`,
    confirm: "Cancel maintenance",
    loadingLabel: "Cancelling…",
    destructive: true,
  },
  delete: {
    heading: "Delete maintenance",
    body: (t) => `Permanently delete "${t}"? This cannot be undone.`,
    confirm: "Delete",
    loadingLabel: "Deleting…",
    destructive: true,
  },
};

export default function ConfirmActionModal({ kind, title, loading, onConfirm, onClose }: Props) {
  const c = config[kind];
  const confirmBg = c.destructive ? "#d32f2f" : "#1a1714";
  const confirmHover = c.destructive ? "#b71c1c" : "#e8500a";

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center px-6"
      style={{ background: "rgba(26,23,20,0.5)" }}
      onClick={() => !loading && onClose()}
    >
      <div
        className="w-full max-w-md bg-white rounded-[4px]"
        style={{ border: "1.5px solid #1a1714", boxShadow: "6px 6px 0 #1a1714" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex items-center justify-between px-8 pt-7 pb-6"
          style={{ borderBottom: "1.5px solid #e4dfd4" }}
        >
          <h2 style={{ fontFamily: "var(--font-head)", fontWeight: 900, fontSize: "1.4rem", letterSpacing: "-0.03em" }}>
            {c.heading}
          </h2>
          <button
            onClick={() => !loading && onClose()}
            disabled={loading}
            className="transition-colors rounded-[4px] p-1 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ color: "#8a8070" }}
            onMouseEnter={(e) => { if (!loading) e.currentTarget.style.color = "#1a1714"; }}
            onMouseLeave={(e) => { if (!loading) e.currentTarget.style.color = "#8a8070"; }}
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-8 py-6 flex flex-col gap-5">
          <div
            className="flex gap-3 px-4 py-4 rounded-[4px]"
            style={{
              background: c.destructive ? "#fdeae8" : "#f5f2eb",
              border: `1px solid ${c.destructive ? "#d32f2f" : "#e4dfd4"}`,
            }}
          >
            <AlertTriangle size={20} style={{ color: c.destructive ? "#d32f2f" : "#8a8070", flexShrink: 0 }} />
            <p className="text-sm leading-relaxed" style={{ color: "#3d3830" }}>
              {c.body(title)}
            </p>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 rounded-[4px] px-5 py-3 text-sm font-medium transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: "white", color: "#3d3830", border: "1.5px solid #e4dfd4" }}
              onMouseEnter={(e) => { if (!loading) e.currentTarget.style.background = "#f5f2eb"; }}
              onMouseLeave={(e) => { if (!loading) e.currentTarget.style.background = "white"; }}
            >
              Go back
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className="flex-1 rounded-[4px] px-5 py-3 text-sm font-medium transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: loading ? "#8a8070" : confirmBg, color: "white", border: `1.5px solid ${loading ? "#8a8070" : confirmBg}` }}
              onMouseEnter={(e) => {
                if (!loading) { e.currentTarget.style.background = confirmHover; e.currentTarget.style.borderColor = confirmHover; }
              }}
              onMouseLeave={(e) => {
                if (!loading) { e.currentTarget.style.background = confirmBg; e.currentTarget.style.borderColor = confirmBg; }
              }}
            >
              {loading ? c.loadingLabel : c.confirm}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
