// src/app/(dashboard)/dashboard/[slug]/StatusPageClient.tsx
"use client";

import { useState } from "react";
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
} from "lucide-react";
import DeleteServiceConfirm from "@/components/services/DeleteServiceConfirm";
import AddServiceModal from "@/components/services/AddServiceModal";
import EditServiceModal from "@/components/services/EditServiceModal";
import CreateIncidentModal from "@/components/incidents/CreateIncidentModal";
import IncidentCard from "@/components/incidents/IncidentCard";

const FREE_SERVICE_LIMIT = 3;

type IncidentUpdate = {
    id: string;
    message: string;
    status: "investigating" | "identified" | "monitoring" | "resolved";
    created_at: string;
};

type Incident = {
    id: string;
    title: string;
    description: string | null;
    status: "investigating" | "identified" | "monitoring" | "resolved";
    status_page_id: string;
    created_at: string;
    incident_updates: IncidentUpdate[];
};

type Service = {
    id: string;
    name: string;
    status: "operational" | "degraded" | "outage";
    created_at: string;
};

type StatusPage = {
    id: string;
    name: string;
    slug: string;
};

type Props = {
    page: StatusPage;
    services: Service[];
    incidents: Incident[];
    subscriberCount: number;
    plan: "free" | "pro";
};

// ── Embed Badge Section ──────────────────────────────────────────────────────

function EmbedBadgeSection({ slug }: { slug: string }) {
    const [copiedIframe, setCopiedIframe] = useState(false);
    const [copiedJs, setCopiedJs] = useState(false);

    const badgeUrl = `${process.env.NEXT_PUBLIC_APP_URL}/badge/${slug}`;
    const pageUrl = `${process.env.NEXT_PUBLIC_APP_URL}/${slug}`;

    const iframeSnippet = `<iframe
  src="${badgeUrl}"
  width="280"
  height="36"
  frameborder="0"
  scrolling="no"
  style="border:none;overflow:hidden;"
  title="${slug} status"
></iframe>`;

    const jsSnippet = `<div id="statsy-badge-${slug}"></div>
<script>
  (function() {
    fetch("https://statsy.page/api/badge/${slug}")
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

    function copyToClipboard(text: string, which: "iframe" | "js") {
        navigator.clipboard.writeText(text).then(() => {
            if (which === "iframe") {
                setCopiedIframe(true);
                setTimeout(() => setCopiedIframe(false), 2000);
            } else {
                setCopiedJs(true);
                setTimeout(() => setCopiedJs(false), 2000);
            }
        });
    }

    return (
        <section className="mb-10">
            {/* Header */}
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
                        Embed Badge
                    </h2>
                    <p
                        className="text-sm font-medium"
                        style={{ color: "#8a8070" }}
                    >
                        Add a live status badge to your website or README.
                    </p>
                </div>
                <Code2 size={20} style={{ color: "#8a8070", flexShrink: 0 }} />
            </div>

            {/* Preview */}
            <div
                className="mb-4 px-6 py-5 rounded-[4px] flex items-center justify-between"
                style={{ border: "1.5px solid #e4dfd4", background: "white" }}
            >
                <div className="flex flex-col gap-1">
                    <span
                        className="text-xs font-semibold uppercase tracking-[0.08em]"
                        style={{ color: "#8a8070" }}
                    >
                        Live preview
                    </span>
                    <span className="text-xs" style={{ color: "#c4bfb4" }}>
                        Updates every 60 seconds
                    </span>
                </div>
                <iframe
                    src={badgeUrl}
                    width={280}
                    height={36}
                    frameBorder={0}
                    scrolling="no"
                    style={{ border: "none", overflow: "hidden" }}
                    title={`${slug} status badge`}
                />
            </div>

            {/* iframe snippet */}
            <div
                className="mb-3 rounded-[4px]"
                style={{ border: "1.5px solid #e4dfd4", background: "white" }}
            >
                <div
                    className="flex items-center justify-between px-4 py-3"
                    style={{ borderBottom: "1.5px solid #e4dfd4" }}
                >
                    <span
                        className="text-xs font-bold uppercase tracking-[0.08em]"
                        style={{ color: "#3d3830" }}
                    >
                        iframe embed
                    </span>
                    <button
                        onClick={() => copyToClipboard(iframeSnippet, "iframe")}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-[4px] text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer"
                        style={{
                            background: copiedIframe ? "#e8f5ee" : "#f5f2eb",
                            border: `1.5px solid ${copiedIframe ? "#1a7a4a" : "#e4dfd4"}`,
                            color: copiedIframe ? "#1a7a4a" : "#3d3830",
                        }}
                    >
                        {copiedIframe ? (
                            <>
                                <Check size={12} strokeWidth={3} />
                                Copied!
                            </>
                        ) : (
                            <>
                                <Copy size={12} strokeWidth={2.5} />
                                Copy
                            </>
                        )}
                    </button>
                </div>
                <pre
                    className="px-4 py-4 text-xs overflow-x-auto"
                    style={{
                        color: "#3d3830",
                        fontFamily: "ui-monospace, 'Cascadia Code', monospace",
                        lineHeight: 1.7,
                        whiteSpace: "pre",
                    }}
                >
                    {iframeSnippet}
                </pre>
            </div>

            {/* JS snippet */}
            <div
                className="rounded-[4px]"
                style={{ border: "1.5px solid #e4dfd4", background: "white" }}
            >
                <div
                    className="flex items-center justify-between px-4 py-3"
                    style={{ borderBottom: "1.5px solid #e4dfd4" }}
                >
                    <div className="flex flex-col gap-0.5">
                        <span
                            className="text-xs font-bold uppercase tracking-[0.08em]"
                            style={{ color: "#3d3830" }}
                        >
                            JS snippet
                        </span>
                        <span className="text-xs" style={{ color: "#8a8070" }}>
                            Renders inline — no iframe, fully styleable
                        </span>
                    </div>
                    <button
                        onClick={() => copyToClipboard(jsSnippet, "js")}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-[4px] text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer"
                        style={{
                            background: copiedJs ? "#e8f5ee" : "#f5f2eb",
                            border: `1.5px solid ${copiedJs ? "#1a7a4a" : "#e4dfd4"}`,
                            color: copiedJs ? "#1a7a4a" : "#3d3830",
                        }}
                    >
                        {copiedJs ? (
                            <>
                                <Check size={12} strokeWidth={3} />
                                Copied!
                            </>
                        ) : (
                            <>
                                <Copy size={12} strokeWidth={2.5} />
                                Copy
                            </>
                        )}
                    </button>
                </div>
                <pre
                    className="px-4 py-4 text-xs overflow-x-auto"
                    style={{
                        color: "#3d3830",
                        fontFamily: "ui-monospace, 'Cascadia Code', monospace",
                        lineHeight: 1.7,
                        whiteSpace: "pre",
                    }}
                >
                    {jsSnippet}
                </pre>
            </div>
        </section>
    );
}

// ── Main Component ───────────────────────────────────────────────────────────

export default function StatusPageClient({
    page,
    services,
    incidents,
    subscriberCount,
    plan,
}: Props) {
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingService, setEditingService] = useState<Service | null>(null);
    const [deletingService, setDeletingService] = useState<Service | null>(
        null,
    );
    const [showCreateIncident, setShowCreateIncident] = useState(false);

    const atLimit = services.length >= FREE_SERVICE_LIMIT;

    // Split incidents into active and resolved
    const activeIncidents = incidents.filter((i) => i.status !== "resolved");
    const resolvedIncidents = incidents.filter((i) => i.status === "resolved");

    function getStatusColor(status: Service["status"]) {
        switch (status) {
            case "operational":
                return { bg: "#e8f5ee", text: "#1a7a4a", border: "#1a7a4a" };
            case "degraded":
                return {
                    bg: "rgba(232,80,10,0.08)",
                    text: "#e8500a",
                    border: "#e8500a",
                };
            case "outage":
                return { bg: "#fdeae8", text: "#d32f2f", border: "#d32f2f" };
        }
    }

    function getStatusIcon(status: Service["status"]) {
        switch (status) {
            case "operational":
                return <CheckCircle size={18} />;
            case "degraded":
                return <AlertCircle size={18} />;
            case "outage":
                return <XCircle size={18} />;
        }
    }

    function getStatusLabel(status: Service["status"]) {
        switch (status) {
            case "operational":
                return "Operational";
            case "degraded":
                return "Degraded";
            case "outage":
                return "Outage";
        }
    }

    return (
        <>
            {/* Top bar — View public page + subscriber count */}
            <div className="flex items-center justify-between mb-10">
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

                <a
                    href={`https://${page.slug}.statsy.page`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 rounded-[4px] px-3 py-2 text-xs font-semibold uppercase tracking-wider transition-all no-underline"
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
                    View public page
                </a>
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
                            {services.length === 0
                                ? "No services yet — add your first one"
                                : `${services.length} service${services.length === 1 ? "" : "s"}`}
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

                {services.length === 0 ? (
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
                        {services.map((service) => {
                            const colors = getStatusColor(service.status);
                            return (
                                <div
                                    key={service.id}
                                    className="flex items-center justify-between px-5 py-4 rounded-[4px]"
                                    style={{
                                        border: "1.5px solid #e4dfd4",
                                        background: "white",
                                        borderLeft: `4px solid ${colors.border}`,
                                    }}
                                >
                                    <div className="flex items-center gap-3">
                                        <span style={{ color: colors.text }}>
                                            {getStatusIcon(service.status)}
                                        </span>
                                        <span
                                            className="text-sm font-semibold"
                                            style={{ color: "#1a1714" }}
                                        >
                                            {service.name}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <span
                                            className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-[2px]"
                                            style={{
                                                background: colors.bg,
                                                color: colors.text,
                                                border: `1.5px solid ${colors.border}`,
                                            }}
                                        >
                                            {getStatusLabel(service.status)}
                                        </span>

                                        <button
                                            onClick={() =>
                                                setEditingService(service)
                                            }
                                            className="rounded-[4px] p-1.5 transition-colors cursor-pointer"
                                            style={{ color: "#8a8070" }}
                                            onMouseEnter={(e) =>
                                                (e.currentTarget.style.color =
                                                    "#1a1714")
                                            }
                                            onMouseLeave={(e) =>
                                                (e.currentTarget.style.color =
                                                    "#8a8070")
                                            }
                                            title="Edit service"
                                        >
                                            <Edit2 size={14} strokeWidth={2} />
                                        </button>
                                        <button
                                            onClick={() =>
                                                setDeletingService(service)
                                            }
                                            className="rounded-[4px] p-1.5 transition-colors cursor-pointer"
                                            style={{ color: "#8a8070" }}
                                            onMouseEnter={(e) =>
                                                (e.currentTarget.style.color =
                                                    "#d32f2f")
                                            }
                                            onMouseLeave={(e) =>
                                                (e.currentTarget.style.color =
                                                    "#8a8070")
                                            }
                                            title="Delete service"
                                        >
                                            <Trash2 size={14} strokeWidth={2} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {atLimit && plan === "free" && (
                    <p className="text-xs mt-3" style={{ color: "#8a8070" }}>
                        Free plan limit reached (3 services).{" "}
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
                                ? "No active incidents — all systems operational"
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
                            border: "1.5px solid #e4dfd4",
                            background: "white",
                        }}
                    >
                        <div
                            className="w-2 h-2 rounded-full flex-shrink-0"
                            style={{ background: "#1a7a4a" }}
                        />
                        <p
                            className="text-sm font-medium"
                            style={{ color: "#3d3830" }}
                        >
                            All systems operational
                        </p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-6">
                        {activeIncidents.map((incident) => (
                            <IncidentCard
                                key={incident.id}
                                incident={incident}
                                isOwner={true}
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
                            />
                        ))}
                    </div>
                </section>
            )}

            {/* ── EMBED BADGE (Pro only) ── */}
            {plan === "pro" ? (
                <EmbedBadgeSection slug={page.slug} />
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
                                    Add a live badge to your website or README.{" "}
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
                    onClose={() => setShowAddModal(false)}
                />
            )}
            {editingService && (
                <EditServiceModal
                    service={editingService}
                    onClose={() => setEditingService(null)}
                />
            )}
            {deletingService && (
                <DeleteServiceConfirm
                    service={deletingService}
                    onClose={() => setDeletingService(null)}
                />
            )}
            {showCreateIncident && (
                <CreateIncidentModal
                    pageId={page.id}
                    onClose={() => setShowCreateIncident(false)}
                />
            )}
        </>
    );
}
