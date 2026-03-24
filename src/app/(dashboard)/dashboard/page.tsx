import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import LogoutButton from "./LogoutButton";
import DashboardClient from "./DashboardClient";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: pages } = await supabase
    .from("status_pages")
    .select("*")
    .order("created_at", { ascending: false });

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
        {/* Heading */}
        <div
          className="mb-10 pb-10"
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
              fontSize: "2.2rem",
              letterSpacing: "-0.04em",
              color: "#1a1714",
            }}
          >
            Your status pages
          </h1>
          <p className="mt-2 text-sm" style={{ color: "#8a8070" }}>
            Manage your pages, services, and incidents from here.
          </p>
        </div>

        <DashboardClient pages={pages ?? []} />

        {/* Plan bar */}
        <div
          className="mt-8 flex items-center justify-between px-6 py-4 rounded-[4px] flex-wrap gap-4"
          style={{ background: "#ede9e0", border: "1.5px solid #e4dfd4" }}
        >
          <div className="flex items-center gap-3">
            <span
              className="text-xs font-semibold uppercase tracking-wider"
              style={{ color: "#8a8070" }}
            >
              Plan
            </span>
            <span
              className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-[2px]"
              style={{
                background: "white",
                border: "1.5px solid #1a1714",
                color: "#1a1714",
              }}
            >
              Free
            </span>
          </div>
          <div
            className="flex items-center gap-3 text-xs"
            style={{ color: "#8a8070" }}
          >
            <span>1 page</span>
            <span style={{ color: "#c4bfb4" }}>|</span>
            <span>3 services per page</span>
            <span style={{ color: "#c4bfb4" }}>|</span>
            <span>50 subscribers</span>
          </div>
          <button
            className="text-xs font-semibold hover:underline underline-offset-2"
            style={{ color: "#e8500a" }}
          >
            Upgrade to Pro &rarr;
          </button>
        </div>
      </main>

      <style>{`@keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.3} }`}</style>
    </div>
  );
}
