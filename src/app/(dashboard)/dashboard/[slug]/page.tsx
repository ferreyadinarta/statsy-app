import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import LogoutButton from "@/components/dashboard/LogoutButton";
import StatusPageClient from "./StatusPageClient";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export default async function StatusPageManagePage({ params }: PageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: page, error: pageError } = await supabase
    .from("status_pages")
    .select("*")
    .eq("slug", slug)
    .eq("user_id", user.id)
    .single();

  if (pageError || !page) notFound();

  const { data: services } = await supabase
    .from("services")
    .select("*")
    .eq("status_page_id", page.id)
    .order("created_at", { ascending: true });

  const daysToShow = 7;
  const dateThreshold = new Date();
  dateThreshold.setDate(dateThreshold.getDate() - daysToShow);

  const { data: incidents } = await supabase
    .from("incidents")
    .select(`*, incident_updates(id, message, status, created_at)`)
    .eq("status_page_id", page.id)
    .gte("created_at", dateThreshold.toISOString())
    .order("created_at", { ascending: false });

  // Fetch subscriber count
  const { count: subscriberCount } = await supabase
    .from("subscribers")
    .select("*", { count: "exact", head: true })
    .eq("status_page_id", page.id);

  return (
    <div className="min-h-screen bg-[#f5f2eb]">
      <header
        className="sticky top-0 z-50 flex items-center justify-between px-8 py-4"
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
        </Link>

        <div
          className="flex items-center gap-1"
          style={{ borderLeft: "1px solid #e4dfd4", paddingLeft: "20px" }}
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

      <main className="max-w-5xl mx-auto px-8 pt-6 pb-14">
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-[4px] text-xs font-medium no-underline transition-colors mb-6 bg-white border-[1.5px] border-[#e4dfd4] text-[#3d3830] hover:border-[#1a1714] hover:text-[#1a1714]"
          >
            <ChevronLeft size={14} />
            Back to dashboard
          </Link>

          <div
            className="mb-8 pb-8"
            style={{ borderBottom: "1.5px solid #1a1714" }}
          >
            <p
              className="text-[10px] font-bold uppercase tracking-[0.14em] mb-3"
              style={{ color: "#e8500a" }}
            >
              Status Page
            </p>
            <h1
              className="mb-3"
              style={{
                fontFamily: "var(--font-head)",
                fontWeight: 900,
                fontSize: "2.8rem",
                letterSpacing: "-0.04em",
                lineHeight: "1",
                color: "#1a1714",
              }}
            >
              {page.name}
            </h1>
            <p className="text-base font-medium" style={{ color: "#3d3830" }}>
              Manage services, post incidents, and keep your users informed.
            </p>
          </div>
        </div>

        <StatusPageClient
          page={page}
          services={services ?? []}
          incidents={incidents ?? []}
          subscriberCount={subscriberCount ?? 0}
        />
      </main>

      <style>{`@keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.3} }`}</style>
    </div>
  );
}
