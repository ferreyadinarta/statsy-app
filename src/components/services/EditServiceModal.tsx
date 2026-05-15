"use client";

import { JSX, useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { X, CheckCircle, AlertCircle, XCircle, ChevronDown } from "lucide-react";
import { useToast } from "@/lib/use-toast";

function CustomSelect({ value, onChange, options }: {
  value: number;
  onChange: (v: number) => void;
  options: { value: number; label: string }[];
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);
  const selected = options.find((o) => o.value === value);
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="w-full flex items-center justify-between rounded-[4px] px-3 py-2.5 text-sm font-medium cursor-pointer transition-colors"
        style={{ border: "1.5px solid #e4dfd4", color: "#1a1714", background: "white" }}
        onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#1a1714")}
        onMouseLeave={(e) => (e.currentTarget.style.borderColor = open ? "#1a1714" : "#e4dfd4")}
      >
        <span>{selected?.label}</span>
        <ChevronDown
          size={14}
          style={{ color: "#8a8070", transform: open ? "rotate(180deg)" : "none", transition: "transform 150ms ease" }}
        />
      </button>
      {open && (
        <div
          className="absolute top-full left-0 right-0 mt-1 rounded-[4px] overflow-hidden z-20"
          style={{ border: "1.5px solid #1a1714", background: "white", boxShadow: "3px 3px 0 #1a1714" }}
        >
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => { onChange(opt.value); setOpen(false); }}
              className="w-full text-left px-3 py-2 text-sm cursor-pointer transition-colors"
              style={{
                background: opt.value === value ? "#f5f2eb" : "white",
                color: "#1a1714",
                fontWeight: opt.value === value ? 600 : 400,
              }}
              onMouseEnter={(e) => { if (opt.value !== value) e.currentTarget.style.background = "#f5f2eb"; }}
              onMouseLeave={(e) => { if (opt.value !== value) e.currentTarget.style.background = "white"; }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function InfoTooltip({ text }: { text: string }) {
  const [visible, setVisible] = useState(false);
  return (
    <span
      className="relative flex-shrink-0"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      <span
        className="flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-bold cursor-default select-none"
        style={{ background: "#e4dfd4", color: "#8a8070" }}
      >
        ?
      </span>
      {visible && (
        <span
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 rounded-[4px] px-2.5 py-2 text-xs z-30 leading-relaxed"
          style={{ background: "#1a1714", color: "#f5f2eb", boxShadow: "2px 2px 0 rgba(0,0,0,0.15)", whiteSpace: "normal" }}
        >
          {text}
          <span
            className="absolute top-full left-1/2 -translate-x-1/2"
            style={{ width: 0, height: 0, borderLeft: "5px solid transparent", borderRight: "5px solid transparent", borderTop: "5px solid #1a1714" }}
          />
        </span>
      )}
    </span>
  );
}

type ServiceStatus = "operational" | "degraded" | "outage";

type Service = {
  id: string;
  name: string;
  status: ServiceStatus;
  created_at: string;
  monitor_url: string | null;
  check_interval_minutes: number | null;
  degraded_threshold_ms: number | null;
  last_checked_at: string | null;
  response_time_ms: number | null;
};

type FieldErrors = {
  name?: string;
  monitor_url?: string;
};

type Props = {
  service: Service;
  plan: "free" | "pro";
  onClose: () => void;
  onSuccess: (service: Service) => void;
  focusMonitorUrl?: boolean;
};

export default function EditServiceModal({ service, plan, onClose, onSuccess, focusMonitorUrl }: Props) {
  const [name, setName] = useState(service.name);
  const [status, setStatus] = useState<ServiceStatus>(service.status);
  const [monitorUrl, setMonitorUrl] = useState(service.monitor_url ?? "");
  const [checkInterval, setCheckInterval] = useState(service.check_interval_minutes ?? 1);
  const [degradedThreshold, setDegradedThreshold] = useState(service.degraded_threshold_ms ?? 3000);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [loading, setLoading] = useState(false);
  const monitorUrlRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (focusMonitorUrl) {
      setTimeout(() => monitorUrlRef.current?.focus(), 80);
    }
  }, [focusMonitorUrl]);

  const router = useRouter();
  const { success, error: showError } = useToast();

  function validate(): boolean {
    const errors: FieldErrors = {};
    if (!name.trim()) {
      errors.name = "Service name is required.";
    } else if (name.trim().length < 2) {
      errors.name = "Service name must be at least 2 characters.";
    }
    if (monitorUrl.trim() && !/^https?:\/\//i.test(monitorUrl.trim())) {
      errors.monitor_url = "URL must start with http:// or https://";
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
      body: JSON.stringify({
        name: name.trim(),
        status,
        monitor_url: monitorUrl.trim() || null,
        check_interval_minutes: plan === "pro" && monitorUrl.trim() ? checkInterval : null,
        degraded_threshold_ms: monitorUrl.trim() ? degradedThreshold : null,
      }),
    });

    if (!res.ok) {
      setLoading(false);
      showError("Failed To Edit Service. Please try again.");
      return;
    }

    onSuccess({
      ...service,
      name: name.trim(),
      status,
      monitor_url: monitorUrl.trim() || null,
      check_interval_minutes: plan === "pro" && monitorUrl.trim() ? checkInterval : null,
      degraded_threshold_ms: monitorUrl.trim() ? degradedThreshold : null,
    });
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

          {/* Monitor URL */}
          <div className="flex flex-col gap-2">
            <label
              className="text-xs font-semibold uppercase tracking-[0.08em] flex items-center gap-2"
              style={{ color: "#3d3830" }}
            >
              Monitor URL
              <span className="text-[10px] font-medium normal-case tracking-normal px-1.5 py-0.5 rounded-[3px]" style={{ background: "#f5f2eb", color: "#8a8070", border: "1px solid #e4dfd4" }}>
                optional
              </span>
            </label>
            <input
              ref={monitorUrlRef}
              type="url"
              value={monitorUrl}
              onChange={(e) => {
                setMonitorUrl(e.target.value);
                setFieldErrors((prev) => ({ ...prev, monitor_url: undefined }));
              }}
              placeholder="https://yourapp.com/health"
              className="rounded-[4px] px-4 py-3 text-sm outline-none bg-white placeholder:text-[#c4bfb4]"
              style={{
                border: `1.5px solid ${fieldErrors.monitor_url ? "#d32f2f" : "#e4dfd4"}`,
                color: "#1a1714",
              }}
            />
            {fieldErrors.monitor_url ? (
              <span className="text-xs" style={{ color: "#d32f2f" }}>{fieldErrors.monitor_url}</span>
            ) : (
              <span className="text-xs" style={{ color: "#8a8070" }}>Statsy will ping this URL to auto-update status</span>
            )}
          </div>

          {/* Check interval + Degraded threshold — compact two-column row */}
          {monitorUrl.trim() && (
            <div className="flex gap-3">
              {plan === "pro" && (
                <div className="flex flex-col gap-1.5 flex-1">
                  <div className="flex items-center gap-1.5">
                    <label className="text-xs font-semibold uppercase tracking-[0.08em]" style={{ color: "#3d3830" }}>
                      Check interval
                    </label>
                    <InfoTooltip text="How often Statsy pings your URL to check its status." />
                  </div>
                  <CustomSelect
                    value={checkInterval}
                    onChange={setCheckInterval}
                    options={[1, 2, 5, 10, 30, 60].map((m) => ({ value: m, label: m === 60 ? "60 min" : `${m} min` }))}
                  />
                </div>
              )}
              <div className="flex flex-col gap-1.5 flex-1">
                <div className="flex items-center gap-1.5">
                  <label className="text-xs font-semibold uppercase tracking-[0.08em]" style={{ color: "#3d3830" }}>
                    Degraded after
                  </label>
                  <InfoTooltip text="If response is slower than this for 2 checks in a row, status becomes Degraded." />
                </div>
                <CustomSelect
                  value={degradedThreshold}
                  onChange={setDegradedThreshold}
                  options={[1000, 2000, 3000, 5000, 8000, 10000].map((ms) => ({ value: ms, label: `${ms / 1000} seconds` }))}
                />
              </div>
            </div>
          )}

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
