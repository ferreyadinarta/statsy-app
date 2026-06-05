import Link from "next/link";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote-client/rsc";
import remarkGfm from "remark-gfm";
import { getAllPosts, getPost } from "@/lib/blog";
import QuickAnswer from "@/components/blog/QuickAnswer";
import Callout from "@/components/blog/Callout";
import CtaButton from "@/components/blog/CtaButton";
import ScrollToTop from "@/components/blog/ScrollToTop";
import ReadingProgress from "@/components/blog/ReadingProgress";
import ShareButtons from "@/components/blog/ShareButtons";
import type { Metadata } from "next";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const posts = await getAllPosts();
  return posts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return { title: "Blog | Statsy" };

  const url = `https://statsy.page/blog/${slug}`;
  return {
    title: `${post.title} | Statsy`,
    description: post.description,
    alternates: { canonical: url },
    openGraph: {
      title: post.title,
      description: post.description,
      url,
      siteName: "Statsy",
      type: "article",
      publishedTime: post.date,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
    },
  };
}

const components = { QuickAnswer, Callout, CtaButton };

export default async function BlogPost({ params }: PageProps) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();

  const url = `https://statsy.page/blog/${slug}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    dateModified: post.date,
    author: {
      "@type": "Organization",
      name: post.author ?? "Statsy",
      url: "https://statsy.page",
    },
    publisher: {
      "@type": "Organization",
      name: "Statsy",
      url: "https://statsy.page",
      logo: {
        "@type": "ImageObject",
        url: "https://statsy.page/statsy-logo.png",
      },
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    url,
  };

  const allPosts = await getAllPosts();
  const related = allPosts.filter((p) => p.slug !== slug).slice(0, 2);

  return (
    <>
      <ReadingProgress />
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
              href="/blog"
              className="no-underline"
              style={{ color: "#3d3830" }}
            >
              Blog
            </Link>
            <Link
              href="https://landing.statsy.page/#pricing"
              className="no-underline"
              style={{ color: "#3d3830" }}
            >
              Pricing
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
          <Link
            href="/blog"
            className="blog-back-btn no-underline mb-10 inline-flex items-center gap-1.5 text-xs font-semibold rounded-full px-3 py-1.5"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M8 6H4M4 6l2.5-2.5M4 6l2.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            All posts
          </Link>

          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span className="text-xs" style={{ color: "#8a8070" }}>
              {new Date(post.date).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
            <span className="text-xs" style={{ color: "#c4bdb0" }}>·</span>
            <span className="text-xs" style={{ color: "#8a8070" }}>
              {Math.ceil(post.content.split(/\s+/).length / 200)} min read
            </span>
            {post.tags && post.tags.length > 0 && (
              <>
                <span className="text-xs" style={{ color: "#c4bdb0" }}>·</span>
                <div className="flex items-center gap-1.5">
                  {post.tags.slice(0, 3).map((tag) => (
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
              </>
            )}
          </div>

          <h1
            className="text-4xl sm:text-5xl font-black mb-4"
            style={{
              color: "#1a1714",
              fontFamily: "var(--font-head)",
              letterSpacing: "-0.04em",
              lineHeight: 1.1,
            }}
          >
            {post.title}
          </h1>
          <p
            className="text-lg mb-2"
            style={{ color: "#5a5248", lineHeight: 1.6 }}
          >
            {post.description}
          </p>

          <ShareButtons url={url} title={post.title} />

          <article className="blog-article mt-2" style={{ color: "#1a1714" }}>
            <MDXRemote
              source={post.content}
              components={components}
              options={{ mdxOptions: { remarkPlugins: [remarkGfm] } }}
            />
          </article>

          <div
            className="mt-4 pt-8"
            style={{ borderTop: "1.5px solid #e4dfd4" }}
          >
            <div
              className="rounded-[4px] px-6 py-8 text-center"
              style={{ background: "#1a1714" }}
            >
              <h3
                className="text-2xl font-black mb-2"
                style={{
                  color: "#f5f2eb",
                  fontFamily: "var(--font-head)",
                  letterSpacing: "-0.03em",
                }}
              >
                Ready to ship your status page?
              </h3>
              <p
                className="text-sm mb-5"
                style={{ color: "#8a8070" }}
              >
                Free forever. No credit card. Live in minutes.
              </p>
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[4px] no-underline text-sm font-semibold"
                style={{ background: "#e8500a", color: "#ffffff" }}
              >
                Create your status page →
              </Link>
            </div>
          </div>

          {related.length > 0 && (
            <div className="mt-16">
              <h3
                className="text-sm font-semibold mb-6 uppercase tracking-wider"
                style={{ color: "#8a8070" }}
              >
                More articles
              </h3>
              <ul className="list-none p-0 divide-y" style={{ borderColor: "#e4dfd4" }}>
                {related.map((p) => (
                  <li key={p.slug} className="py-5 first:pt-0">
                    <Link href={`/blog/${p.slug}`} className="block no-underline group">
                      <div className="text-xs mb-1.5" style={{ color: "#8a8070" }}>
                        {new Date(p.date).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </div>
                      <p
                        className="text-base font-bold group-hover:underline"
                        style={{
                          color: "#1a1714",
                          fontFamily: "var(--font-head)",
                          letterSpacing: "-0.02em",
                          textDecorationColor: "#e8500a",
                          textUnderlineOffset: "3px",
                        }}
                      >
                        {p.title}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </main>
      </div>
      <ScrollToTop />
    </>
  );
}
