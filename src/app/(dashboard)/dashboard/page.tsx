import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import LogoutButton from "../../../components/dashboard/LogoutButton";
import DashboardClient from "./DashboardClient";
import { getUserPlanAndGrace, PLAN_LIMITS } from "@/lib/plan";
import { getUserFromHeaders } from "@/lib/auth";

export default async function DashboardPage() {
    const user = await getUserFromHeaders();
    if (!user) redirect("/login");

    const supabase = await createClient();

    const [{ plan, graceInfo, trialInfo }, { data: pagesRaw }] = await Promise.all([
        getUserPlanAndGrace(user.id),
        supabase
            .from("status_pages")
            .select("*, services(status_page_id, status), incidents(status_page_id, status)")
            .eq("user_id", user.id)
            .neq("incidents.status", "resolved")
            .order("created_at", { ascending: true }),
    ]);
    const limits = PLAN_LIMITS[plan];

    const pages = pagesRaw?.map(({ services: _svcs, incidents: _incs, ...p }) => ({ ...p })) ?? [];
    const services = pagesRaw?.flatMap((p) => (p.services as { status_page_id: string; status: string }[] ?? [])) ?? [];
    const openIncidents = pagesRaw?.flatMap((p) => (p.incidents as { status_page_id: string; status: string }[] ?? [])) ?? [];

    type PageStatus = "operational" | "degraded" | "outage";
    const pageStatusMap: Record<string, PageStatus> = {};
    for (const id of pages.map((p) => p.id)) {
        const svcStatuses = (services ?? [])
            .filter((s) => s.status_page_id === id)
            .map((s) => s.status);
        const hasOpenIncident = (openIncidents ?? []).some(
            (i) => i.status_page_id === id,
        );
        if (svcStatuses.includes("outage")) pageStatusMap[id] = "outage";
        else if (svcStatuses.includes("degraded") || hasOpenIncident)
            pageStatusMap[id] = "degraded";
        else pageStatusMap[id] = "operational";
    }

    const pagesWithStatus = (pages ?? []).map((p) => ({
        ...p,
        overallStatus: pageStatusMap[p.id] ?? "operational",
    }));

    const overLimitPageIds = new Set(
        pagesWithStatus.slice(limits.pages).map((p) => p.id),
    );

    return (
        <div className="min-h-screen bg-[#f5f2eb]">
            {/* Nav */}
            <header
                className="sticky top-0 z-50 flex items-center justify-between px-4 sm:px-8 py-4"
                style={{
                    borderBottom: "1.5px solid #1a1714",
                    background: "rgba(245,242,235,0.95)",
                    backdropFilter: "blur(10px)",
                }}
            >
                {/* Left — logo */}
                <Link
                    href="/dashboard"
                    className="flex items-center gap-2 no-underline"
                >
                    <span
                        className="w-[9px] h-[9px] rounded-full bg-[#e8500a] flex-shrink-0"
                        style={{ animation: "blink 2.4s ease-in-out infinite" }}
                    />
                    <span
                        style={{
                            fontFamily: "var(--font-head)",
                            fontWeight: 900,
                            fontSize: "1.2rem",
                            letterSpacing: "-0.04em",
                            color: "#1a1714",
                        }}
                    >
                        Statsy
                    </span>
                    <span
                        className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-[3px]"
                        style={{
                            background: "rgba(232,80,10,0.1)",
                            border: "1px solid rgba(232,80,10,0.25)",
                            color: "#e8500a",
                        }}
                    >
                        Beta
                    </span>
                </Link>

                {/* Right — user info + logout */}
                <div
                    className="flex items-center gap-1"
                    style={{
                        borderLeft: "1px solid #e4dfd4",
                        paddingLeft: "20px",
                    }}
                >
                    <div className="flex items-center gap-3 mr-3">
                        <div
                            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                            style={{ background: "#1a1714", color: "#f5f2eb" }}
                        >
                            {user.email?.[0]?.toUpperCase() ?? "?"}
                        </div>
                        <span
                            className="text-sm hidden sm:block"
                            style={{ color: "#3d3830" }}
                        >
                            {user.email}
                        </span>
                    </div>
                    <LogoutButton />
                </div>
            </header>

            {/* Payment failed banner */}
            {graceInfo.inGrace && (
                <div
                    className="flex items-center justify-between px-4 sm:px-8 py-2.5 gap-3"
                    style={{
                        background: "rgba(211,47,47,0.08)",
                        borderBottom: "1.5px solid rgba(211,47,47,0.3)",
                    }}
                >
                    <p className="text-sm font-semibold" style={{ color: "#1a1714" }}>
                        <span style={{ color: "#d32f2f" }}>Payment failed</span>
                        <span className="font-normal" style={{ color: "#8a8070" }}>
                            {" "}· Pro access ends in {graceInfo.daysLeft} day{graceInfo.daysLeft === 1 ? "" : "s"} if not resolved
                        </span>
                    </p>
                    <Link
                        href="/billing"
                        className="text-xs font-bold uppercase tracking-wider flex-shrink-0 hover:underline"
                        style={{ color: "#d32f2f" }}
                    >
                        Update payment →
                    </Link>
                </div>
            )}

            {/* Trial banner */}
            {trialInfo.isTrialing && (
                <div
                    className="flex items-center justify-between px-4 sm:px-8 py-2.5 gap-3"
                    style={{
                        background: trialInfo.daysLeft <= 3 ? "rgba(232,80,10,0.1)" : "rgba(232,80,10,0.06)",
                        borderBottom: "1.5px solid rgba(232,80,10,0.25)",
                    }}
                >
                    <p className="text-sm font-semibold" style={{ color: "#1a1714" }}>
                        <span style={{ color: "#e8500a" }}>
                            {trialInfo.daysLeft === 0 ? "Trial ends today" : `${trialInfo.daysLeft} day${trialInfo.daysLeft === 1 ? "" : "s"} left in your trial`}
                        </span>
                        {trialInfo.endsAt && (
                            <span className="font-normal" style={{ color: "#8a8070" }}>
                                {" "}· ends {trialInfo.endsAt.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                            </span>
                        )}
                    </p>
                    <Link
                        href="/billing"
                        className="text-xs font-bold uppercase tracking-wider flex-shrink-0 hover:underline"
                        style={{ color: "#e8500a" }}
                    >
                        Manage billing →
                    </Link>
                </div>
            )}

            <main className="max-w-5xl mx-auto px-4 sm:px-8 py-10">
                {/* Heading */}
                <div
                    className="mb-7 pb-7"
                    style={{ borderBottom: "1.5px solid #e4dfd4" }}
                >
                    <p
                        className="text-xs font-semibold uppercase tracking-[0.12em] mb-2"
                        style={{ color: "#e8500a" }}
                    >
                        Dashboard
                    </p>
                    <h1
                        style={{
                            fontFamily: "var(--font-head)",
                            fontWeight: 900,
                            fontSize: "clamp(1.5rem, 5vw, 2.2rem)",
                            letterSpacing: "-0.04em",
                            color: "#1a1714",
                        }}
                    >
                        {pagesWithStatus.length === 0
                            ? "Welcome to Statsy"
                            : "Your status pages"}
                    </h1>
                    <p className="mt-2 text-sm" style={{ color: "#8a8070" }}>
                        {pagesWithStatus.length === 0
                            ? "Let's create your first status page, it only takes a minute."
                            : "Manage your pages, services, and incidents from here."}
                    </p>
                </div>

                <DashboardClient pages={pagesWithStatus} plan={plan} overLimitPageIds={overLimitPageIds} graceInfo={graceInfo} />

                {/* Plan bar */}
                <div
                        className="mt-6 rounded-[4px] overflow-hidden"
                        style={{
                            background: "#ede9e0",
                            border: "1.5px solid #e4dfd4",
                        }}
                    >
                        {/* Header row: plan badge + action link */}
                        <div
                            className="flex items-center justify-between px-5 py-3"
                            style={{ borderBottom: "1.5px solid #e4dfd4" }}
                        >
                            <div className="flex items-center gap-2.5">
                                <span
                                    className="text-xs font-semibold uppercase tracking-wider"
                                    style={{ color: "#8a8070" }}
                                >
                                    Plan
                                </span>
                                <span
                                    className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-[2px]"
                                    style={{
                                        background: plan === "pro" ? "#e8f5ee" : "white",
                                        border: `1.5px solid ${plan === "pro" ? "#1a7a4a" : "#1a1714"}`,
                                        color: plan === "pro" ? "#1a7a4a" : "#1a1714",
                                    }}
                                >
                                    {plan === "pro" ? "Pro" : "Free"}
                                </span>
                            </div>
                            {plan === "free" && (
                                <Link
                                    href="/billing"
                                    className="text-xs font-semibold hover:underline underline-offset-2"
                                    style={{ color: "#e8500a" }}
                                >
                                    Upgrade to Pro &rarr;
                                </Link>
                            )}
                            {plan === "pro" && (
                                <Link
                                    href="/billing"
                                    className="text-xs font-semibold hover:underline underline-offset-2"
                                    style={{ color: "#8a8070" }}
                                >
                                    Manage billing &rarr;
                                </Link>
                            )}
                        </div>

                        {/* Stats grid */}
                        <div className="grid grid-cols-4">
                            {[
                                { value: limits.pages, label: limits.pages === 1 ? "page" : "pages" },
                                { value: limits.services, label: "services/page" },
                                { value: limits.subscribers, label: "subscribers" },
                                { value: `${limits.historyDays}d`, label: "incident history" },
                            ].map((stat, i) => (
                                <div
                                    key={i}
                                    className="flex flex-col items-center py-4"
                                    style={{
                                        borderRight: i < 3 ? "1.5px solid #e4dfd4" : undefined,
                                    }}
                                >
                                    <span
                                        className="text-lg font-black"
                                        style={{
                                            fontFamily: "var(--font-head)",
                                            color: "#1a1714",
                                            letterSpacing: "-0.03em",
                                        }}
                                    >
                                        {stat.value}
                                    </span>
                                    <span
                                        className="text-[11px] font-medium mt-0.5 text-center"
                                        style={{ color: "#8a8070" }}
                                    >
                                        {stat.label}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
            </main>

            <style>{`@keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.3} }`}</style>
        </div>
    );
}
