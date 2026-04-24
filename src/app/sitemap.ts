import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient();
  const { data: pages } = await supabase
    .from("status_pages")
    .select("slug, created_at")
    .order("created_at", { ascending: false });

  return (pages ?? []).map((page) => ({
    url: `https://${page.slug}.statsy.page`,
    lastModified: new Date(page.created_at),
    changeFrequency: "hourly" as const,
    priority: 0.8,
  }));
}
