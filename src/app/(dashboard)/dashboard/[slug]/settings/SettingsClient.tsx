"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ExternalLink } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/lib/use-toast";

type Plan = "free" | "pro";

type Page = {
    id: string;
    name: string;
    slug: string;
    custom_domain: string | null;
};

type Props = {
    page: Page;
    plan: Plan;
};

export default function SettingsClient({ page, plan }: Props) {
    const router = useRouter();
    const { toast } = useToast();

    const [domain, setDomain] = useState(page.custom_domain ?? "");
    const [saving, setSaving] = useState(false);
    const [removing, setRemoving] = useState(false);

    const isPro = plan === "pro";
    const hasExistingDomain = !!page.custom_domain;

    async function handleSave() {
        if (!domain.trim()) return;
        setSaving(true);

        const res = await fetch("/api/custom-domain/set", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                domain: domain.trim(),
                status_page_id: page.id,
            }),
        });

        const data = await res.json();

        if (!res.ok) {
            toast({
                description: data.error ?? "Failed to save domain.",
                variant: "error",
            });
            setSaving(false);
            return;
        }

        router.refresh();
        setTimeout(() => {
            toast({ description: "Custom domain saved!" });
            setSaving(false);
        }, 500);
    }

    async function handleRemove() {
        setRemoving(true);

        const res = await fetch("/api/custom-domain/remove", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status_page_id: page.id }),
        });

        const data = await res.json();

        if (!res.ok) {
            toast({
                description: data.error ?? "Failed to remove domain.",
                variant: "error",
            });
            setRemoving(false);
            return;
        }

        setDomain("");
        router.refresh();
        setTimeout(() => {
            toast({ description: "Custom domain removed." });
            setRemoving(false);
        }, 500);
    }

    return (
        <div className="flex flex-col gap-6">
            {/* Custom Domain Card */}
            <div
                className="rounded-[4px] bg-white"
                style={{ border: "1.5px solid #e4dfd4" }}
            >
                {/* Card header */}
                <div
                    className="px-7 py-5"
                    style={{ borderBottom: "1.5px solid #e4dfd4" }}
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <h2
                                style={{
                                    fontFamily: "var(--font-head)",
                                    fontWeight: 800,
                                    fontSize: "1.1rem",
                                    letterSpacing: "-0.02em",
                                    color: "#1a1714",
                                }}
                            >
                                Custom Domain
                            </h2>
                            <p
                                className="text-sm mt-0.5"
                                style={{ color: "#8a8070" }}
                            >
                                Serve your status page from your own domain
                            </p>
                        </div>
                        {/* Pro badge */}
                        <span
                            className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-[2px] flex-shrink-0"
                            style={{
                                background: isPro ? "#e8f5ee" : "#f5f2eb",
                                border: `1.5px solid ${isPro ? "#1a7a4a" : "#e4dfd4"}`,
                                color: isPro ? "#1a7a4a" : "#8a8070",
                            }}
                        >
                            Pro
                        </span>
                    </div>
                </div>

                <div className="px-7 py-6">
                    {!isPro ? (
                        /* Free plan — locked state */
                        <div
                            className="rounded-[4px] px-5 py-4"
                            style={{
                                background: "#f5f2eb",
                                border: "1.5px solid #e4dfd4",
                            }}
                        >
                            <p
                                className="text-sm font-medium"
                                style={{ color: "#3d3830" }}
                            >
                                Custom domains are available on the Pro plan.
                            </p>
                            <p
                                className="text-sm mt-1"
                                style={{ color: "#8a8070" }}
                            >
                                Upgrade to serve your status page from{" "}
                                <span
                                    style={{
                                        color: "#1a1714",
                                        fontWeight: 500,
                                    }}
                                >
                                    status.yoursite.com
                                </span>{" "}
                                instead of a Statsy subdomain.
                            </p>
                            <Link
                                href="/billing"
                                className="inline-block mt-4 px-4 py-2 rounded-[4px] text-sm font-semibold no-underline transition-all"
                                style={{
                                    background: "#e8500a",
                                    color: "white",
                                    border: "1.5px solid #e8500a",
                                }}
                            >
                                Upgrade to Pro →
                            </Link>
                        </div>
                    ) : (
                        /* Pro plan — active state */
                        <div className="flex flex-col gap-5">
                            {/* Input + Save inline */}
                            <div className="flex flex-col gap-2">
                                <label
                                    className="text-xs font-semibold uppercase tracking-[0.08em]"
                                    style={{ color: "#3d3830" }}
                                >
                                    Your domain
                                </label>
                                <div className="flex items-stretch gap-2">
                                    <input
                                        type="text"
                                        value={domain}
                                        onChange={(e) => setDomain(e.target.value)}
                                        placeholder="status.yoursite.com"
                                        disabled={saving || removing}
                                        className="flex-1 rounded-[4px] px-4 py-3 text-sm outline-none bg-white placeholder:text-[#c4bfb4] disabled:opacity-50"
                                        style={{
                                            border: "1.5px solid #e4dfd4",
                                            color: "#1a1714",
                                        }}
                                        onKeyDown={(e) =>
                                            e.key === "Enter" && handleSave()
                                        }
                                    />
                                    <button
                                        onClick={handleSave}
                                        disabled={
                                            saving || removing || !domain.trim()
                                        }
                                        className="px-5 rounded-[4px] text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer bg-[#1a1714] text-[#f5f2eb] border-[1.5px] border-[#1a1714] hover:bg-[#e8500a] hover:border-[#e8500a] whitespace-nowrap"
                                    >
                                        {saving
                                            ? "Saving…"
                                            : hasExistingDomain
                                              ? "Update domain"
                                              : "Save domain"}
                                    </button>
                                </div>
                                <p
                                    className="text-xs"
                                    style={{ color: "#8a8070" }}
                                >
                                    No http:// — just the hostname, e.g.{" "}
                                    <span style={{ color: "#1a1714" }}>
                                        status.yoursite.com
                                    </span>
                                </p>
                            </div>

                            {/* Remove button — only when domain exists */}
                            {hasExistingDomain && (
                                <div>
                                    <button
                                        onClick={handleRemove}
                                        disabled={saving || removing}
                                        className="px-5 py-2 rounded-[4px] text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                                        style={{
                                            background: "transparent",
                                            color: "#d32f2f",
                                            border: "1.5px solid #e4dfd4",
                                        }}
                                    >
                                        {removing ? "Removing…" : "Remove domain"}
                                    </button>
                                </div>
                            )}

                            {/* DNS Instructions — only show after domain is saved */}
                            {hasExistingDomain && (
                                <div
                                    className="rounded-[4px] p-5 flex flex-col gap-4"
                                    style={{
                                        background: "#f5f2eb",
                                        border: "1.5px solid #e4dfd4",
                                    }}
                                >
                                    <div>
                                        <p
                                            className="text-xs font-semibold uppercase tracking-[0.08em] mb-2"
                                            style={{ color: "#3d3830" }}
                                        >
                                            DNS Setup Required
                                        </p>
                                        <p
                                            className="text-sm"
                                            style={{ color: "#8a8070" }}
                                        >
                                            Add this CNAME record with your DNS
                                            provider. Changes can take up to 24
                                            hours to propagate.
                                        </p>
                                    </div>

                                    {/* DNS record table */}
                                    <div
                                        className="rounded-[4px] overflow-hidden"
                                        style={{
                                            border: "1.5px solid #e4dfd4",
                                        }}
                                    >
                                        <div
                                            className="grid grid-cols-3 px-4 py-2"
                                            style={{
                                                background: "#ede9e0",
                                                borderBottom:
                                                    "1.5px solid #e4dfd4",
                                            }}
                                        >
                                            {["Type", "Name", "Value"].map(
                                                (h) => (
                                                    <span
                                                        key={h}
                                                        className="text-xs font-semibold uppercase tracking-[0.08em]"
                                                        style={{
                                                            color: "#8a8070",
                                                        }}
                                                    >
                                                        {h}
                                                    </span>
                                                ),
                                            )}
                                        </div>
                                        <div className="grid grid-cols-3 px-4 py-3 bg-white">
                                            <span
                                                className="text-sm font-mono font-medium"
                                                style={{ color: "#1a1714" }}
                                            >
                                                CNAME
                                            </span>
                                            <span
                                                className="text-sm font-mono"
                                                style={{ color: "#1a1714" }}
                                            >
                                                {page.custom_domain
                                                    ?.split(".")
                                                    .slice(0, -2)
                                                    .join(".") ||
                                                    page.custom_domain}
                                            </span>
                                            <span
                                                className="text-sm font-mono"
                                                style={{ color: "#1a1714" }}
                                            >
                                                cname.vercel-dns.com
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-2">
                                        <span
                                            style={{
                                                color: "#1a7a4a",
                                                fontSize: "1rem",
                                            }}
                                        >
                                            ✓
                                        </span>
                                        <p
                                            className="text-sm"
                                            style={{ color: "#3d3830" }}
                                        >
                                            Once DNS is set,{" "}
                                            <a
                                                href={`https://${page.custom_domain}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1 font-medium no-underline"
                                                style={{ color: "#e8500a" }}
                                            >
                                                {page.custom_domain}
                                                <ExternalLink size={11} />
                                            </a>{" "}
                                            will show your status page
                                            automatically.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
