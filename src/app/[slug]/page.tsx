import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import PublicStatusPageClient from "./PublicStatusPageClient";
import SubscribeButton from "@/components/public/SubscribeButton";

type PageProps = {
  params: Promise<{ slug: string }>;
};

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

  const daysToShow = 7;
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
        <PublicStatusPageClient
          page={page}
          services={services ?? []}
          incidents={incidents ?? []}
        />
      </main>
    </div>
  );
}
