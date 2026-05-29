import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import PublicStatusPageClient from "./PublicStatusPageClient";
import SubscribeButton from "@/components/public/SubscribeButton";
import type { Metadata } from "next";
import { getUserPlan, PLAN_LIMITS } from "@/lib/plan";
import { cache } from "react";

// cache() deduplicates this call between generateMetadata and the page component,
// which share the same React render tree root per request in Next.js App Router.
const getStatusPage = cache(async (slug: string) => {
    const supabase = await createClient();
    const { data: page, error } = await supabase
        .from("status_pages")
        .select("*")
        .eq("slug", slug)
        .single();
    return { page: error ? null : page };
});

function computeLastUpdated(
    services: { created_at: string }[],
    incidents: {
        created_at: string;
        incident_updates: { created_at: string }[];
    }[],
): string | null {
    const allDates = [
        ...services.map((s) => new Date(s.created_at).getTime()),
        ...incidents.map((i) => new Date(i.created_at).getTime()),
        ...incidents.flatMap((i) =>
            i.incident_updates.map((u) => new Date(u.created_at).getTime()),
        ),
    ];
    if (allDates.length === 0) return null;
    const diffMs = new Date().getTime() - Math.max(...allDates);
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffMins < 1) return "Just now";
    if (diffMins < 60)
        return `${diffMins} minute${diffMins === 1 ? "" : "s"} ago`;
    if (diffHours < 24)
        return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
    return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
}

type PageProps = {
    params: Promise<{ slug: string }>;
};

export async function generateMetadata({
    params,
}: PageProps): Promise<Metadata> {
    const { slug } = await params;
    const { page } = await getStatusPage(slug);

    if (!page) {
        return { title: "Status Page | Statsy" };
    }

    const title = `${page.name} Status`;
    const description = `Live status and incident updates for ${page.name}. Check if all systems are operational.`;
    const url = `https://${slug}.statsy.page`;

    return {
        title,
        description,
        openGraph: {
            title,
            description,
            url,
            siteName: "Statsy",
            type: "website",
        },
        twitter: {
            card: "summary",
            title,
            description,
        },
        alternates: {
            canonical: url,
        },
    };
}

export default async function PublicStatusPage({ params }: PageProps) {
    const { slug } = await params;
    const { page } = await getStatusPage(slug);

    if (!page) notFound();

    const supabase = await createClient();

    const [{ data: services }, ownerPlan, { data: ownerPages }] = await Promise.all([
        supabase
            .from("services")
            .select("*")
            .eq("status_page_id", page.id)
            .order("created_at", { ascending: true }),
        getUserPlan(page.user_id),
        supabase
            .from("status_pages")
            .select("id")
            .eq("user_id", page.user_id)
            .order("created_at", { ascending: true }),
    ]);

    const pageLimit = PLAN_LIMITS[ownerPlan].pages;
    const allowedPageIds = (ownerPages ?? [])
        .slice(0, pageLimit)
        .map((p) => p.id);
    const pagePaused = !allowedPageIds.includes(page.id);

    const daysToShow = PLAN_LIMITS[ownerPlan].historyDays;
    const dateThreshold = new Date();
    dateThreshold.setDate(dateThreshold.getDate() - daysToShow);

    // Sequential after ownerPlan resolves — daysToShow depends on plan.
    // Fetching max history (90d) and trimming would save a round trip but wastes bandwidth for free users.
    const { data: incidents } = await supabase
        .from("incidents")
        .select(`*, incident_updates(*)`)
        .eq("status_page_id", page.id)
        .gte("created_at", dateThreshold.toISOString())
        .order("created_at", { ascending: false });

    const { data: maintenance } = await supabase
        .from("maintenance_windows")
        .select(
            "id, title, description, starts_at, ends_at, state, started_at, completed_at, maintenance_window_services(service_id)",
        )
        .eq("status_page_id", page.id)
        .gte("ends_at", dateThreshold.toISOString())
        .order("starts_at", { ascending: false });

    const lastUpdated = computeLastUpdated(services ?? [], incidents ?? []);

    const allowedServices = (services ?? []).slice(0, PLAN_LIMITS[ownerPlan].services);
    const hasOutage = allowedServices.some((s) => s.status === "outage");
    const hasDegraded = allowedServices.some((s) => s.status === "degraded");
    const overallStatus = hasOutage
        ? "Some systems are experiencing an outage"
        : hasDegraded
        ? "Some systems are degraded"
        : "All systems operational";

    const pageUrl = `https://${slug}.statsy.page`;
    const jsonLd = {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "WebPage",
                "@id": `${pageUrl}/#webpage`,
                url: pageUrl,
                name: `${page.name} Status`,
                description: `Current status of ${page.name}: ${overallStatus}. Live service health and incident updates.`,
                about: { "@id": `${pageUrl}/#organization` },
                publisher: {
                    "@type": "Organization",
                    name: "Statsy",
                    url: "https://statsy.page",
                },
            },
            {
                "@type": "Organization",
                "@id": `${pageUrl}/#organization`,
                name: page.name,
                url: pageUrl,
            },
        ],
    };

    return (
        <>
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <div className="min-h-screen bg-[#f5f2eb] overflow-x-hidden">
            <header
                className="sticky top-0 z-50 flex items-center justify-between px-4 sm:px-8 py-4"
                style={{
                    background: "rgba(245,242,235,0.95)",
                    backdropFilter: "blur(10px)",
                    borderBottom: "1.5px solid #e4dfd4",
                }}
            >
                {/* Left — subscribe button */}
                <SubscribeButton statusPageId={page.id} />

                {/* Right — Statsy branding */}
                <a
                    href="https://statsy.page"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 no-underline transition-colors group"
                >
                    <span className="text-xs font-medium text-[#8a8070] group-hover:text-[#1a1714]">
                        Powered by
                    </span>
                    <div className="flex items-center gap-1.5">
                        <span className="w-[7px] h-[7px] rounded-full bg-[#e8500a] flex-shrink-0" />
                        <span
                            className="text-xs font-bold text-[#1a1714]"
                            style={{
                                fontFamily: "var(--font-head)",
                                letterSpacing: "-0.02em",
                            }}
                        >
                            Statsy
                        </span>
                    </div>
                </a>
            </header>

            <main className="max-w-5xl mx-auto px-4 sm:px-8 pt-12 pb-20 overflow-x-hidden">
                {pagePaused ? (
                    <div className="flex flex-col items-center justify-center py-24 text-center">
                        <div
                            className="w-12 h-12 rounded-full flex items-center justify-center mb-5"
                            style={{
                                background: "rgba(211,47,47,0.08)",
                                border: "1.5px solid rgba(211,47,47,0.2)",
                            }}
                        >
                            <span
                                style={{ color: "#d32f2f", fontSize: "1.4rem" }}
                            >
                                ⏸
                            </span>
                        </div>
                        <h2
                            className="text-2xl font-black mb-2"
                            style={{
                                fontFamily: "var(--font-head)",
                                letterSpacing: "-0.03em",
                                color: "#1a1714",
                            }}
                        >
                            This page is currently unavailable
                        </h2>
                        <p
                            className="text-sm max-w-sm"
                            style={{ color: "#8a8070" }}
                        >
                            This status page is currently inactive. The
                            owner&apos;s plan limit has been reached.
                        </p>
                    </div>
                ) : (
                    <PublicStatusPageClient
                        page={page}
                        services={(services ?? []).slice(
                            0,
                            PLAN_LIMITS[ownerPlan].services,
                        )}
                        incidents={incidents ?? []}
                        maintenance={maintenance ?? []}
                        incidentDays={daysToShow}
                        lastUpdated={lastUpdated}
                    />
                )}
            </main>
        </div>
        </>
    );
}
