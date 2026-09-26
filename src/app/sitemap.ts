import type { MetadataRoute } from "next";
import { getAllPosts } from "@/lib/blog";

// Customer status pages are deliberately left out: they live on other hosts
// (subdomains / custom domains), which this sitemap can't vouch for, and many
// are test pages that would dilute the site's quality signals.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await getAllPosts();

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
    {
      url: "https://statsy.page/demo",
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    },
    ...posts.map((post) => ({
      url: `https://statsy.page/blog/${post.slug}`,
      lastModified: new Date(post.date),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
}
