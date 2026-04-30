import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import LogoutButton from "@/components/dashboard/LogoutButton";
import { getUserPlan } from "@/lib/plan";
import SettingsClient from "./SettingsClient";
import { getUserFromHeaders } from "@/lib/auth";

type PageProps = {
    params: Promise<{ slug: string }>;
};

export default async function SettingsPage({ params }: PageProps) {
    const { slug } = await params;
    const user = await getUserFromHeaders();
    if (!user) redirect("/login");

    const supabase = await createClient();

    const [{ data: page, error }, plan] = await Promise.all([
        supabase
            .from("status_pages")
            .select("id, name, slug, custom_domain")
            .eq("slug", slug)
            .eq("user_id", user.id)
            .single(),
        getUserPlan(user.id),
    ]);

    if (error && error.code !== "PGRST116") throw error;
    if (!page) notFound();

    return (
        <div className="min-h-screen bg-[#f5f2eb]">
            <header
                className="sticky top-0 z-50 flex items-center justify-between px-4 sm:px-8 py-4"
                style={{
                    borderBottom: "1.5px solid #1a1714",
                    background: "rgba(245,242,235,0.95)",
                    backdropFilter: "blur(10px)",
                }}
            >
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
                            {user.email?.[0].toUpperCase()}
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

            <main className="max-w-2xl mx-auto px-4 sm:px-8 py-8 sm:py-10">
                {/* Heading + breadcrumb */}
                <div
                    className="mb-8 pb-7"
                    style={{ borderBottom: "1.5px solid #e4dfd4" }}
                >
                    <div className="flex items-center gap-2 mb-2">
                        <Link
                            href={`/dashboard/${slug}`}
                            className="inline-flex items-center gap-1 no-underline text-[#8a8070] hover:text-[#e8500a] transition-colors"
                        >
                            <ChevronLeft size={12} strokeWidth={2.5} />
                            <span className="text-xs font-semibold uppercase tracking-[0.12em]">
                                Status Page
                            </span>
                        </Link>
                        <span style={{ color: "#c4bfb4", fontSize: "10px" }}>/</span>
                        <span
                            className="text-xs font-semibold uppercase tracking-[0.12em]"
                            style={{ color: "#e8500a" }}
                        >
                            Settings
                        </span>
                    </div>
                    <h1
                        style={{
                            fontFamily: "var(--font-head)",
                            fontWeight: 900,
                            fontSize: "clamp(1.5rem, 5vw, 2.2rem)",
                            letterSpacing: "-0.04em",
                            color: "#1a1714",
                        }}
                    >
                        {page.name}
                    </h1>
                </div>

                <SettingsClient page={page} plan={plan} />
            </main>
        </div>
    );
}
