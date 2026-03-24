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

  // Get the status page
  const { data: page, error: pageError } = await supabase
    .from("status_pages")
    .select("*")
    .eq("slug", slug)
    .eq("user_id", user.id)
    .single();

  if (pageError || !page) notFound();

  // Get all services for this page
  const { data: services } = await supabase
    .from("services")
    .select("*")
    .eq("status_page_id", page.id)
    .order("created_at", { ascending: true });

  return (
    <div className="min-h-screen bg-[#f5f2eb]">
      {/* Nav */}
      <header
        className="sticky top-0 z-50 flex items-center justify-between px-8 py-4"
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
        </Link>

        {/* Right — user info + logout */}
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

      <main className="max-w-5xl mx-auto px-8 py-14">
        {/* Back link + Heading */}
        <div
          className="mb-10 pb-10"
          style={{ borderBottom: "1.5px solid #e4dfd4" }}
        >
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-medium mb-4 no-underline transition-colors"
            style={{ color: "#8a8070" }}
            onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) =>
              (e.currentTarget.style.color = "#1a1714")
            }
            onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) =>
              (e.currentTarget.style.color = "#8a8070")
            }
          >
            <ChevronLeft size={14} />
            Back to dashboard
          </Link>
          <p
            className="text-xs font-semibold uppercase tracking-[0.12em] mb-2"
            style={{ color: "#e8500a" }}
          >
            Status Page
          </p>
          <h1
            style={{
              fontFamily: "var(--font-head)",
              fontWeight: 900,
              fontSize: "2.2rem",
              letterSpacing: "-0.04em",
              color: "#1a1714",
            }}
          >
            {page.name}
          </h1>
          <p className="mt-2 text-sm" style={{ color: "#8a8070" }}>
            Manage services and their status for this page.
          </p>
        </div>

        <StatusPageClient page={page} services={services ?? []} />
      </main>

      <style>{`@keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.3} }`}</style>
    </div>
  );
}
