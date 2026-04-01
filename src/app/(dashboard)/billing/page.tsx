import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import LogoutButton from "@/components/dashboard/LogoutButton";
import BillingClient from "./BillingClient";
import { getUserPlanFull } from "@/lib/plan";

export default async function BillingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const subscription = await getUserPlanFull(user.id);

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

      <main className="max-w-5xl mx-auto px-8 pt-8 pb-20">
        <div
          className="mb-6 pb-6"
          style={{ borderBottom: "1.5px solid #e4dfd4" }}
        >
          {/* Eyebrow row — back link + label on same line */}
          <div className="flex items-center gap-2 mb-2">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1 no-underline text-[#8a8070] hover:text-[#e8500a] transition-colors"
            >
              <ChevronLeft size={12} strokeWidth={2.5} />
              <span className="text-xs font-semibold uppercase tracking-[0.12em]">
                Dashboard
              </span>
            </Link>
            <span style={{ color: "#c4bfb4", fontSize: "10px" }}>/</span>
            <span
              className="text-xs font-semibold uppercase tracking-[0.12em]"
              style={{ color: "#e8500a" }}
            >
              Account
            </span>
          </div>

          <h1
            style={{
              fontFamily: "var(--font-head)",
              fontWeight: 900,
              fontSize: "2.2rem",
              letterSpacing: "-0.04em",
              color: "#1a1714",
            }}
          >
            Billing
          </h1>
          <p className="mt-1 text-sm" style={{ color: "#8a8070" }}>
            Manage your plan and subscription.
          </p>
        </div>

        <BillingClient
          userId={user.id}
          userEmail={user.email ?? ""}
          subscription={subscription}
        />
      </main>

      <style>{`@keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.3} }`}</style>
    </div>
  );
}
