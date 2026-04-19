import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import PublicStatusPageClient from "./PublicStatusPageClient";
import SubscribeButton from "@/components/public/SubscribeButton";
import type { Metadata } from "next";
import { getUserPlan, PLAN_LIMITS } from "@/lib/plan";

type PageProps = {
    params: Promise<{ slug: string }>;
};

export async function generateMetadata({
    params,
}: PageProps): Promise<Metadata> {
    const { slug } = await params;
    const supabase = await createClient();

    const { data: page } = await supabase
        .from("status_pages")
        .select("name")
        .eq("slug", slug)
        .single();

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
    const supabase = await createClient();

    const { data: page, error: pageError } = await supabase
        .from("status_pages")
        .select("*")
        .eq("slug", slug)
        .single();

    if (pageError || !page) notFound();

    const { data: services } = await supabase
        .from("services")
        .select("*")
        .eq("status_page_id", page.id)
        .order("created_at", { ascending: true });

    const [ownerPlan, { data: ownerPages }] = await Promise.all([
        getUserPlan(page.user_id),
        createClient().then((sb) =>
            sb.from("status_pages")
                .select("id")
                .eq("user_id", page.user_id)
                .order("created_at", { ascending: true })
        ),
    ]);

    const pageLimit = PLAN_LIMITS[ownerPlan].pages;
    const allowedPageIds = (ownerPages ?? []).slice(0, pageLimit).map((p) => p.id);
    const pagePaused = !allowedPageIds.includes(page.id);

    const daysToShow = PLAN_LIMITS[ownerPlan].historyDays;
    const dateThreshold = new Date();
    dateThreshold.setDate(dateThreshold.getDate() - daysToShow);

    const { data: incidents } = await supabase
        .from("incidents")
        .select(`*, incident_updates(*)`)
        .eq("status_page_id", page.id)
        .gte("created_at", dateThreshold.toISOString())
        .order("created_at", { ascending: false });

    return (
        <div className="min-h-screen bg-[#f5f2eb]">
            <header
                className="sticky top-0 z-50 flex items-center justify-between px-8 py-4"
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

            <main className="max-w-5xl mx-auto px-8 pt-12 pb-20">
                {pagePaused ? (
                    <div className="flex flex-col items-center justify-center py-24 text-center">
                        <div
                            className="w-12 h-12 rounded-full flex items-center justify-center mb-5"
                            style={{ background: "rgba(211,47,47,0.08)", border: "1.5px solid rgba(211,47,47,0.2)" }}
                        >
                            <span style={{ color: "#d32f2f", fontSize: "1.4rem" }}>⏸</span>
                        </div>
                        <h2
                            className="text-2xl font-black mb-2"
                            style={{ fontFamily: "var(--font-head)", letterSpacing: "-0.03em", color: "#1a1714" }}
                        >
                            Page paused
                        </h2>
                        <p className="text-sm max-w-sm" style={{ color: "#8a8070" }}>
                            This status page is currently inactive. The owner&apos;s plan limit has been reached.
                        </p>
                    </div>
                ) : (
                    <PublicStatusPageClient
                        page={page}
                        services={(services ?? []).slice(0, PLAN_LIMITS[ownerPlan].services)}
                        incidents={incidents ?? []}
                    />
                )}
            </main>
        </div>
    );
}
