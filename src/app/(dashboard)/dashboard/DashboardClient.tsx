"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ExternalLink, Plus, FileText, Lock, Trash2 } from "lucide-react";
import CreatePageModal from "../../../components/dashboard/CreatePageModal";
import DeletePageModal from "../../../components/dashboard/DeletePageModal";
import { useToast } from "@/lib/use-toast";


type PageStatus = "operational" | "degraded" | "outage";

type StatusPage = {
    id: string;
    name: string;
    slug: string;
    created_at: string;
    overallStatus: PageStatus;
};

type Props = {
    pages: StatusPage[];
    plan: string;
};

const STATUS_CONFIG: Record<
    PageStatus,
    { label: string; color: string; bg: string; border: string }
> = {
    operational: {
        label: "Operational",
        color: "#16a34a",
        bg: "rgba(22,163,74,0.08)",
        border: "rgba(22,163,74,0.2)",
    },
    degraded: {
        label: "Degraded",
        color: "#d97706",
        bg: "rgba(217,119,6,0.08)",
        border: "rgba(217,119,6,0.2)",
    },
    outage: {
        label: "Outage",
        color: "#dc2626",
        bg: "rgba(220,38,38,0.08)",
        border: "rgba(220,38,38,0.2)",
    },
};

export default function DashboardClient({ pages, plan }: Props) {
    const [showModal, setShowModal] = useState(false);
    const [deletingPage, setDeletingPage] = useState<StatusPage | null>(null);
    const router = useRouter();
    const { error: showError, success } = useToast();
    const atLimit = pages.length >= (plan === "pro" ? 3 : 1);

    async function handleDeletePage() {
        if (!deletingPage) return;
        const res = await fetch(`/api/status-page/${deletingPage.id}`, {
            method: "DELETE",
        });
        if (!res.ok) {
            const body = await res.json().catch(() => ({}));
            showError(body.error ?? "Failed to delete page.");
            setDeletingPage(null);
            return;
        }
        setDeletingPage(null);
        router.refresh();
        setTimeout(() => success("Status page deleted."), 500);
    }

    return (
        <>
            {pages.length === 0 ? (
                <div
                    className="rounded-[4px] flex flex-col items-center text-center py-20"
                    style={{
                        border: "1.5px dashed #c4bfb4",
                        background: "white",
                    }}
                >
                    <div
                        className="w-12 h-12 rounded-[4px] flex items-center justify-center mb-6"
                        style={{
                            background: "rgba(232,80,10,0.08)",
                            border: "1px solid rgba(232,80,10,0.15)",
                        }}
                    >
                        <FileText size={22} style={{ color: "#e8500a" }} />
                    </div>
                    <h2
                        style={{
                            fontFamily: "var(--font-head)",
                            fontWeight: 900,
                            fontSize: "1.2rem",
                            letterSpacing: "-0.03em",
                            marginBottom: "8px",
                        }}
                    >
                        No status pages yet
                    </h2>
                    <p
                        className="text-sm max-w-xs mb-8 leading-relaxed"
                        style={{ color: "#8a8070" }}
                    >
                        Create your first status page and start keeping your
                        users informed when things go wrong.
                    </p>
                    <button
                        onClick={() => setShowModal(true)}
                        className="flex items-center gap-2 rounded-[4px] px-5 py-2.5 text-sm font-medium transition-colors duration-150 cursor-pointer"
                        style={{
                            background: "#1a1714",
                            color: "#f5f2eb",
                            border: "1.5px solid #1a1714",
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = "#e8500a";
                            e.currentTarget.style.borderColor = "#e8500a";
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = "#1a1714";
                            e.currentTarget.style.borderColor = "#1a1714";
                        }}
                    >
                        <Plus size={15} />
                        Create status page
                    </button>
                </div>
            ) : (
                <div className="flex flex-col gap-3">
                    {/* Header row */}
                    <div className="flex items-center justify-between mb-1 px-1">
                        <p
                            className="text-xs uppercase tracking-wider font-semibold"
                            style={{ color: "#8a8070" }}
                        >
                            {pages.length} / {plan === "pro" ? 3 : 1}{" "}
                            {pages.length === 1 ? "page" : "pages"} used
                        </p>
                        <button
                            onClick={() => !atLimit && setShowModal(true)}
                            disabled={atLimit}
                            className="flex items-center gap-2 rounded-[4px] px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-colors duration-150 cursor-pointer disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e8500a]"
                            style={{
                                background: atLimit ? "#e4dfd4" : "#1a1714",
                                color: atLimit ? "#8a8070" : "#f5f2eb",
                                border: `1.5px solid ${atLimit ? "#e4dfd4" : "#1a1714"}`,
                            }}
                            onMouseEnter={(e) => {
                                if (!atLimit) {
                                    e.currentTarget.style.background =
                                        "#e8500a";
                                    e.currentTarget.style.borderColor =
                                        "#e8500a";
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (!atLimit) {
                                    e.currentTarget.style.background =
                                        "#1a1714";
                                    e.currentTarget.style.borderColor =
                                        "#1a1714";
                                }
                            }}
                            title={
                                atLimit
                                    ? "Upgrade to Pro to create more pages"
                                    : ""
                            }
                        >
                            {atLimit ? <Lock size={11} /> : <Plus size={13} />}
                            New page
                        </button>
                    </div>

                    {/* Page cards */}
                    {pages.map((page) => (
                        <div
                            key={page.id}
                            onClick={() =>
                                router.push(`/dashboard/${page.slug}`)
                            }
                            className="flex items-center justify-between px-6 py-5 rounded-[4px] cursor-pointer"
                            style={{
                                background: "white",
                                border: "1.5px solid #e4dfd4",
                                transition:
                                    "border-color 0.15s, background 0.15s",
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.borderColor = "#1a1714";
                                e.currentTarget.style.background = "#faf9f5";
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.borderColor = "#e4dfd4";
                                e.currentTarget.style.background = "white";
                            }}
                        >
                            <div className="flex items-center gap-4">
                                {/* Monogram icon */}
                                <div
                                    className="w-9 h-9 rounded-[4px] flex items-center justify-center flex-shrink-0 text-sm font-bold"
                                    style={{
                                        background: "#1a1714",
                                        color: "#f5f2eb",
                                        fontFamily: "var(--font-head)",
                                        letterSpacing: "-0.02em",
                                    }}
                                >
                                    {page.name[0].toUpperCase()}
                                </div>
                                <div>
                                    {(() => {
                                        const s =
                                            STATUS_CONFIG[page.overallStatus];
                                        return (
                                            <div className="flex items-center gap-2.5">
                                                <p
                                                    style={{
                                                        fontFamily:
                                                            "var(--font-head)",
                                                        fontWeight: 800,
                                                        fontSize: "1rem",
                                                        letterSpacing:
                                                            "-0.02em",
                                                        color: "#1a1714",
                                                    }}
                                                >
                                                    {page.name}
                                                </p>
                                                <span
                                                    className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-[3px]"
                                                    style={{
                                                        background: s.bg,
                                                        color: s.color,
                                                        border: `1px solid ${s.border}`,
                                                    }}
                                                >
                                                    <span
                                                        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                                                        style={{
                                                            background: s.color,
                                                        }}
                                                    />
                                                    {s.label}
                                                </span>
                                            </div>
                                        );
                                    })()}
                                    <p
                                        className="text-xs mt-0.5"
                                        style={{ color: "#8a8070" }}
                                    >
                                        {page.slug}.statsy.page
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setDeletingPage(page);
                                    }}
                                    className="flex items-center justify-center w-8 h-8 rounded-[4px] transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d32f2f]"
                                    style={{
                                        color: "#8a8070",
                                        border: "1.5px solid #e4dfd4",
                                        background: "transparent",
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.color = "#d32f2f";
                                        e.currentTarget.style.borderColor = "#d32f2f";
                                        e.currentTarget.style.background = "#fdeae8";
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.color = "#8a8070";
                                        e.currentTarget.style.borderColor = "#e4dfd4";
                                        e.currentTarget.style.background = "transparent";
                                    }}
                                    title="Delete page"
                                >
                                    <Trash2 size={14} />
                                </button>
                                <Link
                                    href={`https://${page.slug}.statsy.page`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1.5 text-xs font-medium transition-colors duration-150 px-3 py-2 rounded-[4px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e8500a]"
                                    style={{
                                        color: "#8a8070",
                                        border: "1.5px solid #e4dfd4",
                                        background: "transparent",
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.color = "#1a1714";
                                        e.currentTarget.style.borderColor =
                                            "#1a1714";
                                        e.currentTarget.style.background =
                                            "#f5f2eb";
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.color = "#8a8070";
                                        e.currentTarget.style.borderColor =
                                            "#e4dfd4";
                                        e.currentTarget.style.background =
                                            "transparent";
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <ExternalLink size={13} />
                                    Public page
                                </Link>
                                <Link
                                    href={`/dashboard/${page.slug}`}
                                    className="flex items-center gap-1.5 rounded-[4px] px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e8500a]"
                                    style={{
                                        border: "1.5px solid #1a1714",
                                        color: "#1a1714",
                                        background: "white",
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.background =
                                            "#1a1714";
                                        e.currentTarget.style.color = "#f5f2eb";
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.background =
                                            "white";
                                        e.currentTarget.style.color = "#1a1714";
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    Manage
                                </Link>
                            </div>
                        </div>
                    ))}

                    {atLimit && plan === "free" && (
                        <div
                            className="flex items-center justify-between px-5 py-3.5 rounded-[4px] mt-1"
                            style={{
                                background: "rgba(232,80,10,0.05)",
                                border: "1.5px solid rgba(232,80,10,0.2)",
                            }}
                        >
                            <p className="text-xs" style={{ color: "#8a8070" }}>
                                <span
                                    style={{
                                        color: "#1a1714",
                                        fontWeight: 600,
                                    }}
                                >
                                    Free plan limit reached.
                                </span>{" "}
                                Unlock unlimited pages, more services, and
                                priority support.
                            </p>
                            <Link
                                href="/billing"
                                className="flex-shrink-0 ml-6 text-xs font-semibold rounded-[4px] px-3.5 py-2 transition-colors duration-150"
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
                                Upgrade to Pro &rarr;
                            </Link>
                        </div>
                    )}
                </div>
            )}

            {showModal && (
                <CreatePageModal onClose={() => setShowModal(false)} />
            )}

            {deletingPage && (
                <DeletePageModal
                    page={deletingPage}
                    onClose={() => setDeletingPage(null)}
                    onConfirm={handleDeletePage}
                />
            )}
        </>
    );
}
