"use client";

type Props = {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function DiscardConfirmModal({ isOpen, onConfirm, onCancel }: Props) {
  if (!isOpen) return null;
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center px-6"
      style={{ background: "rgba(26,23,20,0.4)" }}
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm bg-white rounded-[4px] px-7 py-6"
        style={{ border: "1.5px solid #1a1714", boxShadow: "6px 6px 0 #1a1714" }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3
          className="text-lg font-black mb-1"
          style={{ fontFamily: "var(--font-head)", color: "#1a1714", letterSpacing: "-0.03em" }}
        >
          Discard changes?
        </h3>
        <p className="text-sm mb-6" style={{ color: "#8a8070" }}>
          Your unsaved input will be lost.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 rounded-[4px] px-4 py-2.5 text-sm font-medium cursor-pointer transition-colors"
            style={{ border: "1.5px solid #e4dfd4", background: "white", color: "#3d3830" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#f5f2eb")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "white")}
          >
            Keep editing
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 rounded-[4px] px-4 py-2.5 text-sm font-medium cursor-pointer transition-colors"
            style={{ border: "1.5px solid #d32f2f", background: "#d32f2f", color: "white" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#b71c1c";
              e.currentTarget.style.borderColor = "#b71c1c";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#d32f2f";
              e.currentTarget.style.borderColor = "#d32f2f";
            }}
          >
            Discard
          </button>
        </div>
      </div>
    </div>
  );
}
