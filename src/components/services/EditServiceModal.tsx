"use client";

import { JSX, useState } from "react";
import { useRouter } from "next/navigation";
import { X, CheckCircle, AlertCircle, XCircle } from "lucide-react";
import { useToast } from "@/lib/use-toast";

type ServiceStatus = "operational" | "degraded" | "outage";

type Service = {
  id: string;
  name: string;
  status: ServiceStatus;
  created_at: string;
};

type FieldErrors = {
  name?: string;
};

type Props = {
  service: Service;
  onClose: () => void;
  onSuccess: (service: Service) => void;
};

export default function EditServiceModal({ service, onClose, onSuccess }: Props) {
  const [name, setName] = useState(service.name);
  const [status, setStatus] = useState<ServiceStatus>(service.status);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const { success, error: showError } = useToast();

  function validate(): boolean {
    const errors: FieldErrors = {};
    if (!name.trim()) {
      errors.name = "Service name is required.";
    } else if (name.trim().length < 2) {
      errors.name = "Service name must be at least 2 characters.";
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);

    const res = await fetch(`/api/services/${service.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), status }),
    });

    if (!res.ok) {
      setLoading(false);
      showError("Failed To Edit Service. Please try again.");
      return;
    }

    onSuccess({ ...service, name: name.trim(), status });
    success("Service Edited Successfully!");
    setLoading(false);
    onClose();
    router.refresh();
  }

  const statusOptions: {
    value: ServiceStatus;
    label: string;
    icon: JSX.Element;
    color: string;
  }[] = [
    {
      value: "operational",
      label: "Operational",
      icon: <CheckCircle size={16} />,
      color: "#1a7a4a",
    },
    {
      value: "degraded",
      label: "Degraded",
      icon: <AlertCircle size={16} />,
      color: "#e8500a",
    },
    {
      value: "outage",
      label: "Outage",
      icon: <XCircle size={16} />,
      color: "#d32f2f",
    },
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
            Edit service
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
          {/* Name */}
          <div className="flex flex-col gap-2">
            <label
              className="text-xs font-semibold uppercase tracking-[0.08em]"
              style={{ color: "#3d3830" }}
            >
              Service name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setFieldErrors((prev) => ({ ...prev, name: undefined }));
              }}
              placeholder="e.g. API, Website, Dashboard"
              className="rounded-[4px] px-4 py-3 text-sm outline-none bg-white placeholder:text-[#c4bfb4]"
              style={{
                border: `1.5px solid ${fieldErrors.name ? "#d32f2f" : "#e4dfd4"}`,
                color: "#1a1714",
              }}
              autoFocus
            />
            {fieldErrors.name && (
              <span className="text-xs" style={{ color: "#d32f2f" }}>
                {fieldErrors.name}
              </span>
            )}
          </div>

          {/* Status */}
          <div className="flex flex-col gap-2">
            <label
              className="text-xs font-semibold uppercase tracking-[0.08em]"
              style={{ color: "#3d3830" }}
            >
              Status
            </label>
            <div className="flex flex-col gap-2">
              {statusOptions.map((option) => (
                <label
                  key={option.value}
                  className="flex items-center gap-3 px-4 py-3 rounded-[4px] cursor-pointer transition-all"
                  style={{
                    border: `1.5px solid ${status === option.value ? option.color : "#e4dfd4"}`,
                    background:
                      status === option.value ? `${option.color}08` : "white",
                  }}
                >
                  <input
                    type="radio"
                    name="status"
                    value={option.value}
                    checked={status === option.value}
                    onChange={(e) => setStatus(e.target.value as ServiceStatus)}
                    className="sr-only"
                  />
                  <div
                    className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{
                      border: `2px solid ${status === option.value ? option.color : "#e4dfd4"}`,
                      background:
                        status === option.value ? option.color : "white",
                    }}
                  >
                    {status === option.value && (
                      <div
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ background: "white" }}
                      />
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-1">
                    <span style={{ color: option.color }}>{option.icon}</span>
                    <span
                      className="text-sm font-medium"
                      style={{ color: "#1a1714" }}
                    >
                      {option.label}
                    </span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-[4px] px-5 py-3 text-sm font-medium transition-colors duration-150 cursor-pointer"
              style={{
                background: "white",
                color: "#3d3830",
                border: "1.5px solid #e4dfd4",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#f5f2eb";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "white";
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-[4px] px-5 py-3 text-sm font-medium transition-colors duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: "#1a1714",
                color: "#f5f2eb",
                border: "1.5px solid #1a1714",
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
              {loading ? "Saving..." : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
