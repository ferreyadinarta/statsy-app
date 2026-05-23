import Link from "next/link";
import { getAllPosts } from "@/lib/blog";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog | Statsy",
  description:
    "Guides, comparisons, and best practices for status pages, uptime monitoring, and incident communication.",
  alternates: { canonical: "https://statsy.page/blog" },
};

export default async function BlogIndex() {
  const posts = await getAllPosts();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: "Statsy Blog",
    url: "https://statsy.page/blog",
    description:
      "Guides, comparisons, and best practices for status pages, uptime monitoring, and incident communication.",
    publisher: {
      "@type": "Organization",
      name: "Statsy",
      url: "https://statsy.page",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="min-h-screen" style={{ background: "#f5f2eb" }}>
        <header
          className="sticky top-0 z-50 flex items-center justify-between px-6 sm:px-12 py-5"
          style={{
            background: "rgba(245,242,235,0.95)",
            backdropFilter: "blur(10px)",
            borderBottom: "1.5px solid #e4dfd4",
          }}
        >
          <Link
            href="/"
            className="text-lg font-black no-underline"
            style={{
              color: "#1a1714",
              fontFamily: "var(--font-head)",
              letterSpacing: "-0.03em",
            }}
          >
            Statsy
          </Link>
          <nav className="flex items-center gap-6 text-sm">
            <Link
              href="https://landing.statsy.page/#pricing"
              className="no-underline"
              style={{ color: "#3d3830" }}
            >
              Pricing
            </Link>
            <Link
              href="/login"
              className="no-underline"
              style={{ color: "#3d3830" }}
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="px-3 py-1.5 rounded-[4px] no-underline text-xs font-semibold"
              style={{ background: "#1a1714", color: "#f5f2eb" }}
            >
              Get Started Free
            </Link>
          </nav>
        </header>

        <main className="max-w-3xl mx-auto px-6 sm:px-12 pt-16 pb-24">
          <h1
            className="text-5xl sm:text-6xl font-black mb-3"
            style={{
              color: "#1a1714",
              fontFamily: "var(--font-head)",
              letterSpacing: "-0.04em",
              lineHeight: 1.05,
            }}
          >
            Blog
          </h1>
          <p className="text-base mb-12" style={{ color: "#8a8070" }}>
            Guides, comparisons, and best practices for status pages and uptime
            monitoring.
          </p>

          {posts.length === 0 ? (
            <p style={{ color: "#8a8070" }}>No posts yet. Check back soon.</p>
          ) : (
            <ul className="space-y-8 list-none p-0">
              {posts.map((post) => (
                <li key={post.slug}>
                  <Link
                    href={`/blog/${post.slug}`}
                    className="block no-underline group"
                  >
                    <div
                      className="text-xs mb-2"
                      style={{ color: "#8a8070" }}
                    >
                      {new Date(post.date).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </div>
                    <h2
                      className="text-2xl font-black mb-2 group-hover:underline"
                      style={{
                        color: "#1a1714",
                        fontFamily: "var(--font-head)",
                        letterSpacing: "-0.025em",
                        textDecorationColor: "#e8500a",
                        textUnderlineOffset: "4px",
                      }}
                    >
                      {post.title}
                    </h2>
                    <p
                      className="text-[15px] leading-relaxed"
                      style={{ color: "#3d3830" }}
                    >
                      {post.description}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </main>
      </div>
    </>
  );
}
