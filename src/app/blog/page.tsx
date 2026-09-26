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
          <Link href="/" className="flex items-center gap-2 no-underline">
            <span
              className="w-[7px] h-[7px] rounded-full flex-shrink-0"
              style={{
                background: "#e8500a",
                animation: "blink 2.4s ease-in-out infinite",
              }}
            />
            <span
              className="text-lg font-black"
              style={{
                color: "#1a1714",
                fontFamily: "var(--font-head)",
                letterSpacing: "-0.03em",
              }}
            >
              Statsy
            </span>
          </Link>
          <nav className="flex items-center gap-6 text-sm">
            <Link
              href="/#pricing"
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

        <main className="max-w-3xl mx-auto px-5 sm:px-12 pt-10 sm:pt-16 pb-16 sm:pb-24">
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
            <ul className="list-none p-0 divide-y" style={{ borderColor: "#e4dfd4" }}>
              {posts.map((post) => (
                <li key={post.slug} className="py-8 first:pt-0">
                  <Link
                    href={`/blog/${post.slug}`}
                    className="block no-underline group"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <span
                        className="text-xs"
                        style={{ color: "#8a8070" }}
                      >
                        {new Date(post.date).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </span>
                      {post.tags && post.tags.length > 0 && (
                        <div className="flex items-center gap-1.5">
                          {post.tags.slice(0, 2).map((tag) => (
                            <span
                              key={tag}
                              className="text-[11px] px-2 py-0.5 rounded-full font-medium"
                              style={{
                                background: "#f0ebe1",
                                color: "#6b5f4f",
                                letterSpacing: "0.01em",
                              }}
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <h2
                      className="text-2xl font-black mb-2"
                      style={{
                        color: "#1a1714",
                        fontFamily: "var(--font-head)",
                        letterSpacing: "-0.025em",
                        lineHeight: 1.25,
                      }}
                    >
                      <span
                        className="group-hover:underline"
                        style={{
                          textDecorationColor: "#e8500a",
                          textUnderlineOffset: "4px",
                        }}
                      >
                        {post.title}
                      </span>
                    </h2>
                    <p
                      className="text-[15px] leading-relaxed mb-3"
                      style={{ color: "#5a5248" }}
                    >
                      {post.description}
                    </p>
                    <span
                      className="text-xs font-semibold inline-flex items-center gap-1 transition-gap duration-150"
                      style={{ color: "#e8500a" }}
                    >
                      Read article
                      <span className="group-hover:translate-x-0.5 transition-transform duration-150 inline-block">→</span>
                    </span>
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
