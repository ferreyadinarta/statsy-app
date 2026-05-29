// src/app/(dashboard)/dashboard/[slug]/StatusPageClient.tsx
"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import {
    Plus,
    AlertCircle,
    CheckCircle,
    XCircle,
    Edit2,
    Trash2,
    ExternalLink,
    Users,
    Code2,
    Copy,
    Check,
    Settings,
    Zap,
} from "lucide-react";
import DeleteServiceConfirm from "@/components/services/DeleteServiceConfirm";
import AddServiceModal from "@/components/services/AddServiceModal";
import EditServiceModal from "@/components/services/EditServiceModal";
import CreateIncidentModal from "@/components/incidents/CreateIncidentModal";
import IncidentCard from "@/components/incidents/IncidentCard";
import ScheduleMaintenanceModal from "@/components/maintenance/ScheduleMaintenanceModal";
import MaintenanceCard, { type Maintenance } from "@/components/maintenance/MaintenanceCard";

type IncidentStatus = "investigating" | "identified" | "monitoring" | "resolved";

type IncidentUpdate = {
    id: string;
    message: string;
    status: IncidentStatus;
    created_at: string;
};

type Incident = {
    id: string;
    title: string;
    description: string | null;
    status: IncidentStatus;
    status_page_id: string;
    created_at: string;
    incident_updates: IncidentUpdate[];
};

type Service = {
    id: string;
    name: string;
    status: "operational" | "degraded" | "outage";
    created_at: string;
    monitor_url: string | null;
    last_checked_at: string | null;
    response_time_ms: number | null;
    check_interval_minutes: number | null;
    degraded_threshold_ms: number | null;
};

type StatusPage = {
    id: string;
    name: string;
    slug: string;
};

import type { GraceInfo } from "@/lib/plan-shared";
import { PLAN_LIMITS } from "@/lib/plan-shared";

type Props = {
    page: StatusPage;
    services: Service[];
    incidents: Incident[];
    subscriberCount: number;
    plan: "free" | "pro";
    graceInfo: GraceInfo;
};

// ── Syntax Highlighting ──────────────────────────────────────────────────────

function HighlightedHtml({ code }: { code: string }) {
    const TOKEN_RE = /(<\/?\w[\w:-]*\s*\/?>?|\/?>|[\w:-]+=|"[^"]*")/g;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;
    let key = 0;
    while ((match = TOKEN_RE.exec(code)) !== null) {
        if (match.index > lastIndex)
            parts.push(code.slice(lastIndex, match.index));
        const t = match[0];
        let color = "#9ca3af";
        if (t.startsWith("<") || t === ">" || t === "/>") color = "#6ee7b7";
        else if (t.endsWith("=")) color = "#93c5fd";
        else if (t.startsWith('"')) color = "#fcd34d";
        parts.push(
            <span key={key++} style={{ color }}>
                {t}
            </span>,
        );
        lastIndex = match.index + t.length;
    }
    if (lastIndex < code.length) parts.push(code.slice(lastIndex));
    return <>{parts}</>;
}

function HighlightedJs({ code }: { code: string }) {
    const TOKEN_RE =
        /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|\b(?:var|function|return|if|fetch|else|null|true|false)\b|\/\/.*)/g;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;
    let key = 0;
    while ((match = TOKEN_RE.exec(code)) !== null) {
        if (match.index > lastIndex)
            parts.push(code.slice(lastIndex, match.index));
        const t = match[0];
        let color = "#9ca3af";
        if (t.startsWith('"') || t.startsWith("'")) color = "#86efac";
        else if (/^\/\//.test(t)) color = "#6b7280";
        else color = "#c084fc";
        parts.push(
            <span key={key++} style={{ color }}>
                {t}
            </span>,
        );
        lastIndex = match.index + t.length;
    }
    if (lastIndex < code.length) parts.push(code.slice(lastIndex));
    return <>{parts}</>;
}

// ── Embed Badge Section ──────────────────────────────────────────────────────

function EmbedBadgeSection({ slug, services }: { slug: string; services: { id: string; status: string }[] }) {
    const [activeTab, setActiveTab] = useState<"iframe" | "js">("iframe");
    const [copied, setCopied] = useState(false);
    const [badgeTick, setBadgeTick] = useState(0);
    const servicesSig = services.map((s) => `${s.id}:${s.status}`).join(",");

    useEffect(() => {
        const id = setInterval(() => setBadgeTick((k) => k + 1), 60_000);
        return () => clearInterval(id);
    }, []);

    const badgeUrl = `${process.env.NEXT_PUBLIC_APP_URL}/badge/${slug}`;
    const pageUrl = `https://${slug}.statsy.page`;

    const iframeSnippet = `<iframe
  src="${badgeUrl}"
  width="280"
  height="36"
  scrolling="no"
  style="border:none;overflow:hidden;"
  title="${slug} status"
></iframe>`;

    const jsSnippet = `<div id="statsy-badge-${slug}"></div>
<script>
  (function() {
    fetch("${process.env.NEXT_PUBLIC_APP_URL}/api/badge/${slug}")
      .then(function(r) { return r.json(); })
      .then(function(d) {
        var colors = {
          operational: { bg: "#e8f5ee", border: "#1a7a4a", text: "#1a7a4a", dot: "#1a7a4a" },
          degraded:    { bg: "rgba(232,80,10,0.1)", border: "#e8500a", text: "#e8500a", dot: "#e8500a" },
          outage:      { bg: "#fdeae8", border: "#d32f2f", text: "#d32f2f", dot: "#d32f2f" }
        };
        var c = colors[d.status] || colors.operational;
        var el = document.getElementById("statsy-badge-${slug}");
        if (!el) return;
        el.innerHTML = '<a href="${pageUrl}" target="_blank" rel="noopener noreferrer" style="display:inline-flex;align-items:center;gap:8px;padding:7px 14px;border-radius:999px;border:1.5px solid '+c.border+';background:'+c.bg+';text-decoration:none;font-size:13px;font-weight:600;color:'+c.text+';font-family:-apple-system,BlinkMacSystemFont,sans-serif;">'
          + '<span style="width:8px;height:8px;border-radius:50%;background:'+c.dot+';flex-shrink:0;"></span>'
          + '<strong style="color:#1a1714;font-size:12px;">' + d.name + '</strong>'
          + '<span style="color:#c4bfb4;">·</span>'
          + d.label
          + '</a>';
      });
  })();
</script>`;

    const activeSnippet = activeTab === "iframe" ? iframeSnippet : jsSnippet;

    function copyToClipboard() {
        navigator.clipboard.writeText(activeSnippet).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    }

    const tabs = [
        {
            id: "iframe" as const,
            label: "iFrame",
            tag: "Easiest",
            description: "Drop-in, zero dependencies",
        },
        {
            id: "js" as const,
            label: "JS Snippet",
            tag: "Flexible",
            description: "Inline, fully styleable",
        },
    ];

    return (
        <section className="mb-10">
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
                <div>
                    <h2
                        className="text-xl font-black mb-1.5"
                        style={{
                            fontFamily: "var(--font-head)",
                            color: "#1a1714",
                            letterSpacing: "-0.03em",
                        }}
                    >
                        Embed Badge
                    </h2>
                    <p
                        className="text-sm font-medium"
                        style={{ color: "#8a8070" }}
                    >
                        Add a live status badge to your site.
                    </p>
                </div>
                <Code2
                    size={18}
                    style={{ color: "#c4bfb4", flexShrink: 0, marginTop: 4 }}
                />
            </div>

            {/* Live Preview */}
            <div
                className="mb-3 rounded-[4px] overflow-hidden"
                style={{ border: "1.5px solid #e4dfd4" }}
            >
                <div
                    className="px-4 py-2 flex items-center gap-2"
                    style={{
                        borderBottom: "1.5px solid #e4dfd4",
                        background: "#faf8f4",
                    }}
                >
                    <span
                        className="text-xs font-bold uppercase tracking-[0.1em]"
                        style={{ color: "#3d3830" }}
                    >
                        Live Preview
                    </span>
                    <span
                        className="text-xs font-medium"
                        style={{ color: "#8a8070" }}
                    >
                        · refreshes every 60s
                    </span>
                </div>
                <div
                    className="flex items-center justify-center py-8"
                    style={{
                        background:
                            "radial-gradient(circle, #e4dfd4 1px, transparent 1px)",
                        backgroundSize: "18px 18px",
                        backgroundColor: "#fdfcf9",
                    }}
                >
                    <iframe
                        key={`${servicesSig}-${badgeTick}`}
                        src={badgeUrl}
                        width={320}
                        height={36}
                        style={{
                            border: "none",
                            overflow: "hidden",
                            display: "block",
                        }}
                        title={`${slug} status badge`}
                    />
                </div>
            </div>

            {/* Embed Method Tabs + Code */}
            <div
                className="rounded-[4px] overflow-hidden"
                style={{ border: "1.5px solid #e4dfd4", background: "white" }}
            >
                {/* Tab Bar */}
                <div
                    className="flex items-stretch"
                    style={{
                        background: "#faf8f4",
                        borderBottom: "1.5px solid #e4dfd4",
                    }}
                >
                    {tabs.map((tab) => {
                        const active = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => {
                                    setActiveTab(tab.id);
                                    setCopied(false);
                                }}
                                className="flex items-center gap-2.5 px-4 py-3 transition-all cursor-pointer text-left relative"
                                style={{
                                    background: "transparent",
                                    borderRight: "1.5px solid #e4dfd4",
                                    outline: "none",
                                }}
                            >
                                {active && (
                                    <span
                                        style={{
                                            position: "absolute",
                                            bottom: 0,
                                            left: 0,
                                            right: 0,
                                            height: 2,
                                            background: "#1a7a4a",
                                        }}
                                    />
                                )}
                                <div className="flex flex-col gap-0.5">
                                    <div className="flex items-center gap-2">
                                        <span
                                            className="text-xs font-bold"
                                            style={{
                                                color: active
                                                    ? "#1a1714"
                                                    : "#5a534c",
                                                fontFamily:
                                                    "ui-monospace, monospace",
                                            }}
                                        >
                                            {tab.label}
                                        </span>
                                        <span
                                            className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full"
                                            style={{
                                                background: active
                                                    ? "#e8f5ee"
                                                    : "#f0ece4",
                                                color: active
                                                    ? "#1a7a4a"
                                                    : "#8a8070",
                                            }}
                                        >
                                            {tab.tag}
                                        </span>
                                    </div>
                                    <span
                                        className="text-xs"
                                        style={{
                                            color: active
                                                ? "#6b6560"
                                                : "#8a8070",
                                        }}
                                    >
                                        {tab.description}
                                    </span>
                                </div>
                            </button>
                        );
                    })}
                </div>

                {/* Code Block */}
                <div style={{ background: "#16120e", position: "relative" }}>
                    <div
                        className="flex items-center justify-between px-4 pt-3 pb-2"
                        style={{ borderBottom: "1px solid #2a2318" }}
                    >
                        <span
                            className="text-xs font-semibold uppercase tracking-widest"
                            style={{
                                color: "#6b7280",
                                fontFamily: "ui-monospace, monospace",
                            }}
                        >
                            {activeTab === "iframe" ? "html" : "javascript"}
                        </span>
                        <button
                            onClick={copyToClipboard}
                            className="flex items-center gap-1.5 px-2.5 py-1 rounded-[3px] text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer"
                            style={{
                                background: copied ? "#1a3d2b" : "#2a2318",
                                color: copied ? "#6ee7b7" : "#9ca3af",
                                border: `1px solid ${copied ? "#1a7a4a" : "#3f3732"}`,
                            }}
                        >
                            {copied ? (
                                <>
                                    <Check size={10} strokeWidth={3} />
                                    Copied
                                </>
                            ) : (
                                <>
                                    <Copy size={10} strokeWidth={2.5} />
                                    Copy
                                </>
                            )}
                        </button>
                    </div>
                    <pre
                        className="px-5 py-4 text-xs overflow-x-auto"
                        style={{
                            color: "#9ca3af",
                            fontFamily:
                                "ui-monospace, 'Cascadia Code', 'JetBrains Mono', monospace",
                            lineHeight: 1.8,
                            whiteSpace: "pre",
                            minHeight: 120,
                            margin: 0,
                        }}
                    >
                        {activeTab === "iframe" ? (
                            <HighlightedHtml code={activeSnippet} />
                        ) : (
                            <HighlightedJs code={activeSnippet} />
                        )}
                    </pre>
                </div>

                {/* Hint Footer */}
                <div
                    className="px-4 py-2.5"
                    style={{
                        borderTop: "1.5px solid #e4dfd4",
                        background: "#faf8f4",
                    }}
                >
                    <span className="text-xs" style={{ color: "#8a8070" }}>
                        {activeTab === "iframe"
                            ? "Works in HTML, Notion, Webflow, etc."
                            : "Paste before </body> - works on any website"}
                    </span>
                </div>
            </div>
        </section>
    );
}

// ── Status Helpers ───────────────────────────────────────────────────────────

function getStatusColor(status: Service["status"]) {
    switch (status) {
        case "operational": return { bg: "#e8f5ee", text: "#1a7a4a", border: "#1a7a4a" };
        case "degraded": return { bg: "rgba(232,80,10,0.08)", text: "#e8500a", border: "#e8500a" };
        case "outage": return { bg: "#fdeae8", text: "#d32f2f", border: "#d32f2f" };
    }
}

function getStatusIcon(status: Service["status"]) {
    switch (status) {
        case "operational": return <CheckCircle size={18} />;
        case "degraded": return <AlertCircle size={18} />;
        case "outage": return <XCircle size={18} />;
    }
}

function getStatusLabel(status: Service["status"]) {
    switch (status) {
        case "operational": return "Operational";
        case "degraded": return "Degraded";
        case "outage": return "Outage";
    }
}

// ── ServiceCard ──────────────────────────────────────────────────────────────

function ServiceCard({
    service,
    paused,
    onEdit,
    onDelete,
    onAddMonitoring,
}: {
    service: Service;
    paused: boolean;
    onEdit: () => void;
    onDelete: () => void;
    onAddMonitoring: () => void;
}) {
    const colors = getStatusColor(service.status);
    return (
        <div
            className="flex items-center justify-between gap-3 px-5 py-4 rounded-[4px]"
            style={{
                border: "1.5px solid #e4dfd4",
                background: paused ? "#faf9f5" : "white",
                borderLeft: `4px solid ${paused ? "#e4dfd4" : colors.border}`,
                opacity: paused ? 0.6 : 1,
            }}
        >
            <div className="flex items-center gap-3 min-w-0">
                <span className="flex-shrink-0" style={{ color: paused ? "#c4bfb4" : colors.text }}>
                    {getStatusIcon(service.status)}
                </span>
                <div className="min-w-0">
                    <span className="text-sm font-semibold truncate block" style={{ color: "#1a1714" }}>
                        {service.name}
                    </span>
                    {service.monitor_url ? (
                        <span className="text-[11px] mt-0.5 block" style={{ color: "#b0a898" }}>
                            auto
                            {service.response_time_ms != null && (
                                <> · {service.response_time_ms >= 1000
                                    ? `${(service.response_time_ms / 1000).toFixed(1)}s`
                                    : `${service.response_time_ms}ms`}</>
                            )}
                            {" · "}
                            {service.last_checked_at
                                ? (() => {
                                    const diff = Math.floor((Date.now() - new Date(service.last_checked_at).getTime()) / 60000);
                                    return diff < 1 ? "just now" : `${diff}m ago`;
                                })()
                                : "checking soon"}
                        </span>
                    ) : (
                        <button
                            onClick={onAddMonitoring}
                            className="text-[11px] mt-0.5 cursor-pointer transition-colors"
                            style={{ color: "#c4bfb4" }}
                            onMouseEnter={(e) => (e.currentTarget.style.color = "#e8500a")}
                            onMouseLeave={(e) => (e.currentTarget.style.color = "#c4bfb4")}
                        >
                            + add monitoring
                        </button>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
                {paused ? (
                    <span
                        className="hidden sm:inline text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-[2px]"
                        style={{ background: "rgba(211,47,47,0.08)", color: "#d32f2f", border: "1.5px solid rgba(211,47,47,0.3)" }}
                    >
                        Paused
                    </span>
                ) : (
                    <span
                        className="hidden sm:inline text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-[2px]"
                        style={{ background: colors.bg, color: colors.text, border: `1.5px solid ${colors.border}` }}
                    >
                        {getStatusLabel(service.status)}
                    </span>
                )}
                <button
                    onClick={() => !paused && onEdit()}
                    disabled={paused}
                    className="rounded-[4px] p-1.5 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{ color: "#8a8070" }}
                    onMouseEnter={(e) => { if (!paused) e.currentTarget.style.color = "#1a1714"; }}
                    onMouseLeave={(e) => { if (!paused) e.currentTarget.style.color = "#8a8070"; }}
                    title={paused ? "Upgrade to edit" : "Edit service"}
                >
                    <Edit2 size={14} strokeWidth={2} />
                </button>
                <button
                    onClick={onDelete}
                    className="rounded-[4px] p-1.5 transition-colors cursor-pointer"
                    style={{ color: "#8a8070" }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "#d32f2f")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "#8a8070")}
                    title="Delete service"
                >
                    <Trash2 size={14} strokeWidth={2} />
                </button>
            </div>
        </div>
    );
}

// ── Main Component ───────────────────────────────────────────────────────────

export default function StatusPageClient({
    page,
    services: initialServices,
    incidents: initialIncidents,
    subscriberCount,
    plan,
    graceInfo,
}: Props) {
    const [localServices, setLocalServices] = useState<Service[]>(initialServices);
    const [localIncidents, setLocalIncidents] = useState<Incident[]>(initialIncidents);

    const [showAddModal, setShowAddModal] = useState(false);
    const [editingService, setEditingService] = useState<Service | null>(null);
    const [focusMonitorUrl, setFocusMonitorUrl] = useState(false);
    const [deletingService, setDeletingService] = useState<Service | null>(null);
    const [showCreateIncident, setShowCreateIncident] = useState(false);
    const [maintenance, setMaintenance] = useState<Maintenance[]>([]);
    const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);

    const loadMaintenance = useCallback(async () => {
        const res = await fetch(`/api/public-status/${page.slug}`);
        if (res.ok) {
            const data = await res.json();
            setMaintenance(data.maintenance ?? []);
        }
    }, [page.slug]);

    useEffect(() => {
        loadMaintenance();
    }, [loadMaintenance]);

    const serviceNames = useMemo(
        () => Object.fromEntries(localServices.map((s) => [s.id, s.name])),
        [localServices],
    );

    const overLimitServiceIds = useMemo(
        () => new Set(localServices.slice(PLAN_LIMITS[plan].services).map((s) => s.id)),
        [localServices, plan],
    );

    const atLimit = localServices.length >= (plan === "pro" ? PLAN_LIMITS.pro.services : PLAN_LIMITS.free.services);

    useEffect(() => {
        const supabase = createClient();
        const channel = supabase
            .channel(`services:${page.id}`)
            .on(
                "postgres_changes",
                { event: "UPDATE", schema: "public", table: "services", filter: `status_page_id=eq.${page.id}` },
                (payload) => {
                    setLocalServices((prev) =>
                        prev.map((s) => (s.id === payload.new.id ? { ...s, ...(payload.new as Service) } : s))
                    );
                }
            )
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "maintenance_windows", filter: `status_page_id=eq.${page.id}` },
                () => { loadMaintenance(); }
            )
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    }, [page.id, loadMaintenance]);

    const activeIncidents = localIncidents.filter((i) => i.status !== "resolved");
    const resolvedIncidents = localIncidents.filter((i) => i.status === "resolved");
    const hasServiceIssues = localServices.some((s) => s.status === "outage" || s.status === "degraded");

    function handleServiceAdded(service: Service) {
        setLocalServices((prev) => [...prev, service]);
    }

    function handleServiceEdited(service: Service) {
        setLocalServices((prev) => prev.map((s) => (s.id === service.id ? service : s)));
    }

    function handleServiceDeleted(serviceId: string) {
        setLocalServices((prev) => prev.filter((s) => s.id !== serviceId));
    }

    function handleIncidentCreated(incident: Incident) {
        setLocalIncidents((prev) => [incident, ...prev]);
    }

    function handleIncidentDeleted(incidentId: string) {
        setLocalIncidents((prev) => prev.filter((i) => i.id !== incidentId));
    }

    function handleIncidentUpdated(incidentId: string, newStatus: IncidentStatus, update: IncidentUpdate) {
        setLocalIncidents((prev) =>
            prev.map((i) =>
                i.id === incidentId
                    ? { ...i, status: newStatus, incident_updates: [update, ...i.incident_updates] }
                    : i,
            ),
        );
    }

    return (
        <>
            {graceInfo.inGrace && (
                <div
                    className="flex items-start justify-between gap-4 px-5 py-4 rounded-[4px] mb-6"
                    style={{
                        background: "rgba(232,80,10,0.06)",
                        border: "1.5px solid rgba(232,80,10,0.35)",
                    }}
                >
                    <div className="flex flex-col gap-1">
                        <p
                            className="text-sm font-semibold"
                            style={{ color: "#1a1714" }}
                        >
                            ⚠ Payment failed - {graceInfo.daysLeft} day
                            {graceInfo.daysLeft === 1 ? "" : "s"} left in your
                            grace period
                        </p>
                        <p className="text-xs" style={{ color: "#8a8070" }}>
                            Your Pro features are still active. If payment
                            isn&apos;t resolved by{" "}
                            <span style={{ color: "#1a1714", fontWeight: 600 }}>
                                {graceInfo.endsAt?.toLocaleDateString("en-US", {
                                    month: "long",
                                    day: "numeric",
                                })}
                            </span>
                            , services over the free plan limit will be paused
                            automatically.
                        </p>
                    </div>
                    <Link
                        href="/billing"
                        className="flex-shrink-0 text-xs font-semibold rounded-[4px] px-3.5 py-2 transition-colors duration-150"
                        style={{
                            background: "#e8500a",
                            color: "white",
                            border: "1.5px solid #e8500a",
                        }}
                        onMouseEnter={(e) => {
                            (
                                e.currentTarget as HTMLAnchorElement
                            ).style.background = "#c94008";
                            (
                                e.currentTarget as HTMLAnchorElement
                            ).style.borderColor = "#c94008";
                        }}
                        onMouseLeave={(e) => {
                            (
                                e.currentTarget as HTMLAnchorElement
                            ).style.background = "#e8500a";
                            (
                                e.currentTarget as HTMLAnchorElement
                            ).style.borderColor = "#e8500a";
                        }}
                    >
                        Update payment &rarr;
                    </Link>
                </div>
            )}

            {/* Top bar — View public page + subscriber count */}
            <div className="flex flex-wrap items-center justify-between gap-2 mb-10">
                <div
                    className="flex items-center gap-2 px-3 py-2 rounded-[4px]"
                    style={{
                        background: "white",
                        border: "1.5px solid #e4dfd4",
                    }}
                >
                    <Users size={14} style={{ color: "#8a8070" }} />
                    <span
                        className="text-sm font-semibold"
                        style={{ color: "#3d3830" }}
                    >
                        {subscriberCount}{" "}
                        <span style={{ color: "#8a8070", fontWeight: 400 }}>
                            {subscriberCount === 1
                                ? "subscriber"
                                : "subscribers"}
                        </span>
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    <a
                        href={`https://${page.slug}.statsy.page`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 rounded-[4px] px-3 py-2 text-sm font-semibold tracking-wider transition-all"
                        style={{
                            border: "1.5px solid #e4dfd4",
                            color: "#3d3830",
                            background: "white",
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = "#1a1714";
                            e.currentTarget.style.color = "#1a1714";
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = "#e4dfd4";
                            e.currentTarget.style.color = "#3d3830";
                        }}
                    >
                        <ExternalLink size={12} strokeWidth={2.5} />
                        <span className="hidden sm:inline">View public page</span>
                        <span className="sm:hidden">View</span>
                    </a>
                    <Link
                        href={`/dashboard/${page.slug}/settings`}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-[4px] text-sm font-medium no-underline transition-colors"
                        style={{
                            border: "1.5px solid #e4dfd4",
                            color: "#3d3830",
                            background: "white",
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = "#1a1714";
                            e.currentTarget.style.color = "#1a1714";
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = "#e4dfd4";
                            e.currentTarget.style.color = "#3d3830";
                        }}
                    >
                        <Settings size={14} />
                        Settings
                    </Link>
                </div>
            </div>

            {/* ── SERVICES ── */}
            <section className="mb-10">
                <div className="flex items-end justify-between mb-6">
                    <div>
                        <h2
                            className="text-xl font-black mb-2"
                            style={{
                                fontFamily: "var(--font-head)",
                                color: "#1a1714",
                                letterSpacing: "-0.03em",
                            }}
                        >
                            Services
                        </h2>
                        <p
                            className="text-sm font-medium"
                            style={{ color: "#8a8070" }}
                        >
                            {localServices.length === 0
                                ? "No services yet - add your first one"
                                : `${localServices.length} service${localServices.length === 1 ? "" : "s"}`}
                        </p>
                    </div>

                    <button
                        onClick={() => !atLimit && setShowAddModal(true)}
                        disabled={atLimit}
                        className="flex items-center gap-1.5 rounded-[4px] px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                        style={{
                            background: "#1a1714",
                            color: "#f5f2eb",
                            border: "1.5px solid #1a1714",
                            boxShadow: "2px 2px 0 #1a1714",
                        }}
                        onMouseEnter={(e) => {
                            if (!atLimit) {
                                e.currentTarget.style.background = "#e8500a";
                                e.currentTarget.style.borderColor = "#e8500a";
                                e.currentTarget.style.boxShadow =
                                    "2px 2px 0 #e8500a";
                                e.currentTarget.style.transform =
                                    "translate(-1px, -1px)";
                            }
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = "#1a1714";
                            e.currentTarget.style.borderColor = "#1a1714";
                            e.currentTarget.style.boxShadow =
                                "2px 2px 0 #1a1714";
                            e.currentTarget.style.transform = "translate(0, 0)";
                        }}
                    >
                        <Plus size={14} strokeWidth={3} />
                        Add service
                    </button>
                </div>

                {localServices.length === 0 ? (
                    <div
                        className="flex flex-col items-center justify-center py-14 rounded-[4px]"
                        style={{
                            border: "1.5px dashed #e4dfd4",
                            background: "white",
                        }}
                    >
                        <div
                            className="w-10 h-10 rounded-full flex items-center justify-center mb-4"
                            style={{ background: "#f5f2eb" }}
                        >
                            <CheckCircle
                                size={20}
                                style={{ color: "#8a8070" }}
                            />
                        </div>
                        <p
                            className="text-sm font-semibold mb-1"
                            style={{ color: "#3d3830" }}
                        >
                            No services yet
                        </p>
                        <p className="text-sm" style={{ color: "#8a8070" }}>
                            Add your first service to start tracking status.
                        </p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-3">
                        {localServices.map((service) => (
                            <ServiceCard
                                key={service.id}
                                service={service}
                                paused={overLimitServiceIds.has(service.id)}
                                onEdit={() => setEditingService(service)}
                                onDelete={() => setDeletingService(service)}
                                onAddMonitoring={() => { setEditingService(service); setFocusMonitorUrl(true); }}
                            />
                        ))}
                    </div>
                )}

                {plan === "free" && localServices.length > 3 && (
                    <div
                        className="flex items-center justify-between px-4 py-3 rounded-[4px] mt-3"
                        style={{
                            background: "rgba(211,47,47,0.05)",
                            border: "1.5px solid rgba(211,47,47,0.25)",
                        }}
                    >
                        <p className="text-xs" style={{ color: "#8a8070" }}>
                            <span style={{ color: "#d32f2f", fontWeight: 600 }}>
                                Over plan limit.
                            </span>{" "}
                            You have {localServices.length} services but free plan
                            allows {PLAN_LIMITS.free.services}. Existing services still work, delete down
                            to {PLAN_LIMITS.free.services} or{" "}
                            <Link
                                href="/billing"
                                style={{
                                    color: "#e8500a",
                                    textDecoration: "underline",
                                }}
                            >
                                upgrade to Pro
                            </Link>{" "}
                            for up to {PLAN_LIMITS.pro.services}.
                        </p>
                    </div>
                )}

                {atLimit && plan === "free" && localServices.length <= PLAN_LIMITS.free.services && (
                    <p className="text-xs mt-3" style={{ color: "#8a8070" }}>
                        Free plan limit reached ({PLAN_LIMITS.free.services} services).{" "}
                        <Link
                            href="/billing"
                            style={{
                                color: "#e8500a",
                                textDecoration: "underline",
                            }}
                        >
                            Upgrade to Pro
                        </Link>{" "}
                        for up to 10 services.
                    </p>
                )}


                {plan === "free" && localServices.some((s) => s.monitor_url) && (
                    <div
                        className="flex items-center justify-between gap-4 px-4 py-3 rounded-[4px] mt-3"
                        style={{
                            background: "#fdf9f5",
                            border: "1.5px solid #e4dfd4",
                            borderLeft: "3px solid #e8500a",
                        }}
                    >
                        <div className="flex items-center gap-3">
                            <Zap size={14} style={{ color: "#e8500a", flexShrink: 0 }} />
                            <div>
                                <p className="text-xs font-semibold" style={{ color: "#1a1714" }}>
                                    5-min checks on free plan
                                </p>
                                <p className="text-xs" style={{ color: "#8a8070" }}>
                                    Upgrade to Pro for 1-min detection and custom intervals.
                                </p>
                            </div>
                        </div>
                        <Link
                            href="/billing"
                            className="flex-shrink-0 text-xs font-semibold rounded-[4px] px-3 py-1.5 transition-colors"
                            style={{ background: "#1a1714", color: "#f5f2eb", border: "1.5px solid #1a1714" }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = "#e8500a";
                                e.currentTarget.style.borderColor = "#e8500a";
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = "#1a1714";
                                e.currentTarget.style.borderColor = "#1a1714";
                            }}
                        >
                            Upgrade →
                        </Link>
                    </div>
                )}
            </section>

            {/* ── ACTIVE INCIDENTS ── */}
            <section className="mb-10">
                <div className="flex items-end justify-between mb-6">
                    <div>
                        <h2
                            className="text-xl font-black mb-2"
                            style={{
                                fontFamily: "var(--font-head)",
                                color: "#1a1714",
                                letterSpacing: "-0.03em",
                            }}
                        >
                            Active Incidents
                        </h2>
                        <p
                            className="text-sm font-medium"
                            style={{ color: "#8a8070" }}
                        >
                            {activeIncidents.length === 0
                                ? hasServiceIssues
                                    ? "No active incidents - but services are reporting issues"
                                    : "No active incidents - all systems operational"
                                : `${activeIncidents.length} active ${activeIncidents.length === 1 ? "incident" : "incidents"}`}
                        </p>
                    </div>
                    <button
                        onClick={() => setShowCreateIncident(true)}
                        className="flex items-center gap-1.5 rounded-[4px] px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
                        style={{
                            background: "#1a1714",
                            color: "#f5f2eb",
                            border: "1.5px solid #1a1714",
                            boxShadow: "2px 2px 0 #1a1714",
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = "#e8500a";
                            e.currentTarget.style.borderColor = "#e8500a";
                            e.currentTarget.style.boxShadow =
                                "2px 2px 0 #e8500a";
                            e.currentTarget.style.transform =
                                "translate(-1px, -1px)";
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = "#1a1714";
                            e.currentTarget.style.borderColor = "#1a1714";
                            e.currentTarget.style.boxShadow =
                                "2px 2px 0 #1a1714";
                            e.currentTarget.style.transform = "translate(0, 0)";
                        }}
                    >
                        <Plus size={14} strokeWidth={3} />
                        Post Incident
                    </button>
                </div>

                {activeIncidents.length === 0 ? (
                    <div
                        className="flex items-center gap-3 px-6 py-5 rounded-[4px]"
                        style={{
                            border: `1.5px solid ${hasServiceIssues ? "rgba(211,47,47,0.2)" : "#e4dfd4"}`,
                            background: hasServiceIssues ? "rgba(211,47,47,0.03)" : "white",
                        }}
                    >
                        <div
                            className="w-2 h-2 rounded-full flex-shrink-0"
                            style={{ background: hasServiceIssues ? "#d32f2f" : "#1a7a4a" }}
                        />
                        <p
                            className="text-sm font-medium"
                            style={{ color: "#3d3830" }}
                        >
                            {hasServiceIssues
                                ? "Service issues detected - no incident posted yet"
                                : "All systems operational"}
                        </p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-6">
                        {activeIncidents.map((incident) => (
                            <IncidentCard
                                key={incident.id}
                                incident={incident}
                                isOwner={true}
                                onDeleted={handleIncidentDeleted}
                                onUpdated={handleIncidentUpdated}
                            />
                        ))}
                    </div>
                )}
            </section>

            {/* ── RESOLVED INCIDENTS ── */}
            {resolvedIncidents.length > 0 && (
                <section className="mb-10">
                    <h2
                        className="text-xl font-black mb-6"
                        style={{
                            fontFamily: "var(--font-head)",
                            color: "#1a1714",
                            letterSpacing: "-0.03em",
                        }}
                    >
                        Resolved Incidents
                    </h2>
                    <div className="flex flex-col gap-6">
                        {resolvedIncidents.map((incident) => (
                            <IncidentCard
                                key={incident.id}
                                incident={incident}
                                isOwner={true}
                                onDeleted={handleIncidentDeleted}
                                onUpdated={handleIncidentUpdated}
                            />
                        ))}
                    </div>
                </section>
            )}

            {/* ── MAINTENANCE ── */}
            <section className="mb-10">
                <div className="flex items-end justify-between mb-6">
                    <div>
                        <h2
                            className="text-xl font-black mb-2"
                            style={{
                                fontFamily: "var(--font-head)",
                                color: "#1a1714",
                                letterSpacing: "-0.03em",
                            }}
                        >
                            Maintenance
                        </h2>
                        <p className="text-sm font-medium" style={{ color: "#8a8070" }}>
                            {maintenance.length === 0
                                ? "No maintenance scheduled"
                                : `${maintenance.length} maintenance ${maintenance.length === 1 ? "window" : "windows"}`}
                        </p>
                    </div>
                    <button
                        onClick={() => setShowMaintenanceModal(true)}
                        className="flex items-center gap-1.5 rounded-[4px] px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
                        style={{
                            background: "#1a1714",
                            color: "#f5f2eb",
                            border: "1.5px solid #1a1714",
                            boxShadow: "2px 2px 0 #1a1714",
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = "#e8500a";
                            e.currentTarget.style.borderColor = "#e8500a";
                            e.currentTarget.style.boxShadow = "2px 2px 0 #e8500a";
                            e.currentTarget.style.transform = "translate(-1px, -1px)";
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = "#1a1714";
                            e.currentTarget.style.borderColor = "#1a1714";
                            e.currentTarget.style.boxShadow = "2px 2px 0 #1a1714";
                            e.currentTarget.style.transform = "translate(0, 0)";
                        }}
                    >
                        <Plus size={14} strokeWidth={3} />
                        Schedule Maintenance
                    </button>
                </div>

                {maintenance.length === 0 ? (
                    <div
                        className="flex items-center gap-3 px-6 py-5 rounded-[4px]"
                        style={{ border: "1.5px solid #e4dfd4", background: "white" }}
                    >
                        <div
                            className="w-2 h-2 rounded-full flex-shrink-0"
                            style={{ background: "#1a7a4a" }}
                        />
                        <p className="text-sm font-medium" style={{ color: "#3d3830" }}>
                            No maintenance scheduled
                        </p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-6">
                        {maintenance.map((m) => (
                            <MaintenanceCard
                                key={m.id}
                                maintenance={m}
                                serviceNames={serviceNames}
                                onUpdated={(updated) =>
                                    setMaintenance((prev) =>
                                        prev.map((x) => (x.id === updated.id ? { ...x, ...updated } : x)),
                                    )
                                }
                                onDeleted={(id) =>
                                    setMaintenance((prev) => prev.filter((x) => x.id !== id))
                                }
                            />
                        ))}
                    </div>
                )}
            </section>

            {/* ── EMBED BADGE (Pro only) ── */}
            {plan === "pro" ? (
                <EmbedBadgeSection slug={page.slug} services={localServices} />
            ) : (
                <section className="mb-10">
                    <div
                        className="flex items-center justify-between px-6 py-5 rounded-[4px]"
                        style={{
                            border: "1.5px solid #e4dfd4",
                            background: "white",
                            opacity: 0.7,
                        }}
                    >
                        <div className="flex items-center gap-3">
                            <Code2 size={18} style={{ color: "#8a8070" }} />
                            <div>
                                <p
                                    className="text-sm font-semibold"
                                    style={{ color: "#1a1714" }}
                                >
                                    Embeddable Status Badge
                                </p>
                                <p
                                    className="text-xs mt-0.5"
                                    style={{ color: "#8a8070" }}
                                >
                                    Add a live badge to your website.{" "}
                                    <Link
                                        href="/billing"
                                        style={{
                                            color: "#e8500a",
                                            textDecoration: "underline",
                                        }}
                                    >
                                        Upgrade to Pro
                                    </Link>{" "}
                                    to unlock.
                                </p>
                            </div>
                        </div>
                        <span
                            className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-[2px]"
                            style={{
                                background: "#f5f2eb",
                                color: "#8a8070",
                                border: "1.5px solid #e4dfd4",
                            }}
                        >
                            Pro
                        </span>
                    </div>
                </section>
            )}

            {/* Modals */}
            {showAddModal && (
                <AddServiceModal
                    pageId={page.id}
                    plan={plan}
                    onClose={() => setShowAddModal(false)}
                    onSuccess={handleServiceAdded}
                />
            )}
            {editingService && (
                <EditServiceModal
                    service={editingService}
                    plan={plan}
                    onClose={() => { setEditingService(null); setFocusMonitorUrl(false); }}
                    onSuccess={handleServiceEdited}
                    focusMonitorUrl={focusMonitorUrl}
                />
            )}
            {deletingService && (
                <DeleteServiceConfirm
                    service={deletingService}
                    onClose={() => setDeletingService(null)}
                    onSuccess={handleServiceDeleted}
                />
            )}
            {showCreateIncident && (
                <CreateIncidentModal
                    pageId={page.id}
                    onClose={() => setShowCreateIncident(false)}
                    onSuccess={handleIncidentCreated}
                />
            )}
            {showMaintenanceModal && (
                <ScheduleMaintenanceModal
                    statusPageId={page.id}
                    services={localServices}
                    onClose={() => setShowMaintenanceModal(false)}
                    onSuccess={() => {
                        setShowMaintenanceModal(false);
                        loadMaintenance();
                    }}
                />
            )}
        </>
    );
}
