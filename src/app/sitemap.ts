import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";
import { getAllPosts } from "@/lib/blog";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient();
  const [{ data: pages }, posts] = await Promise.all([
    supabase
      .from("status_pages")
      .select("slug, created_at")
      .order("created_at", { ascending: false }),
    getAllPosts(),
  ]);

  return [
    {
      url: "https://statsy.page",
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 1.0,
    },
    {
      url: "https://statsy.page/blog",
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.9,
    },
    ...posts.map((post) => ({
      url: `https://statsy.page/blog/${post.slug}`,
      lastModified: new Date(post.date),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    ...(pages ?? []).map((page) => ({
      url: `https://${page.slug}.statsy.page`,
      lastModified: new Date(page.created_at),
      changeFrequency: "hourly" as const,
      priority: 0.8,
    })),
  ];
}
