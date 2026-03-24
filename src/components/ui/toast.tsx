"use client";

import { useEffect, useState } from "react";
import { CheckCircle, XCircle, X } from "lucide-react";

type ToastType = "success" | "error";

type Toast = {
  id: string;
  message: string;
  type: ToastType;
};

let addToastFn: ((message: string, type: ToastType) => void) | null = null;

export function useToast() {
  return {
    success: (message: string) => addToastFn?.(message, "success"),
    error: (message: string) => addToastFn?.(message, "error"),
  };
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    addToastFn = (message: string, type: ToastType) => {
      const id = Math.random().toString(36).substring(7);
      setToasts((prev) => [...prev, { id, message, type }]);

      // Auto-remove after 4 seconds
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4000);
    };

    return () => {
      addToastFn = null;
    };
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-[4px] shadow-lg min-w-[300px] animate-in slide-in-from-top-2 duration-200"
          style={{
            background: "white",
            border: `1.5px solid ${toast.type === "success" ? "#1a7a4a" : "#d32f2f"}`,
          }}
        >
          {toast.type === "success" ? (
            <CheckCircle
              size={18}
              style={{ color: "#1a7a4a", flexShrink: 0 }}
            />
          ) : (
            <XCircle size={18} style={{ color: "#d32f2f", flexShrink: 0 }} />
          )}
          <span
            className="flex-1 text-sm font-medium"
            style={{ color: "#1a1714" }}
          >
            {toast.message}
          </span>
          <button
            onClick={() => removeToast(toast.id)}
            className="transition-colors rounded-[4px] p-1 cursor-pointer"
            style={{ color: "#8a8070" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#1a1714")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#8a8070")}
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
