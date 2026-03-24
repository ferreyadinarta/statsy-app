import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import PublicStatusPageClient from "./PublicStatusPageClient";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export default async function PublicStatusPage({ params }: PageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  // Get the status page (no auth required - public)
  const { data: page, error: pageError } = await supabase
    .from("status_pages")
    .select("*")
    .eq("slug", slug)
    .single();

  if (pageError || !page) notFound();

  // Get all services for this page
  const { data: services } = await supabase
    .from("services")
    .select("*")
    .eq("status_page_id", page.id)
    .order("created_at", { ascending: true });

  // Get incidents from the last 7 days (Free plan limit)
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
      <main className="max-w-5xl mx-auto px-8 pt-16 pb-20">
        <PublicStatusPageClient
          page={page}
          services={services ?? []}
          incidents={incidents ?? []}
        />
      </main>

      {/* Footer with Statsy branding */}
      <footer className="border-t-[1.5px] border-[#e4dfd4] py-8 mt-20">
        <div className="max-w-5xl mx-auto px-8 text-center">
          <a
            href="https://statsy.page"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-medium no-underline transition-colors text-[#8a8070] hover:text-[#1a1714]"
          >
            Powered by Statsy
          </a>
        </div>
      </footer>
    </div>
  );
}
