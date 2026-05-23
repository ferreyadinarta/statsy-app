import fs from "fs/promises";
import path from "path";
import matter from "gray-matter";

const BLOG_DIR = path.join(process.cwd(), "content", "blog");

export type BlogPostFrontmatter = {
  title: string;
  description: string;
  quickAnswer: string;
  date: string;
  author?: string;
  tags?: string[];
};

export type BlogPostMeta = BlogPostFrontmatter & {
  slug: string;
};

export type BlogPost = BlogPostMeta & {
  content: string;
};

export async function getAllPosts(): Promise<BlogPostMeta[]> {
  const files = await fs.readdir(BLOG_DIR);
  const posts = await Promise.all(
    files
      .filter((f) => f.endsWith(".mdx") || f.endsWith(".md"))
      .map(async (file) => {
        const slug = file.replace(/\.(mdx?|md)$/, "");
        const raw = await fs.readFile(path.join(BLOG_DIR, file), "utf-8");
        const { data } = matter(raw);
        return { slug, ...(data as BlogPostFrontmatter) };
      }),
  );
  return posts.sort((a, b) => (a.date < b.date ? 1 : -1));
}

export async function getPost(slug: string): Promise<BlogPost | null> {
  const candidates = [`${slug}.mdx`, `${slug}.md`];
  for (const file of candidates) {
    try {
      const raw = await fs.readFile(path.join(BLOG_DIR, file), "utf-8");
      const { data, content } = matter(raw);
      return { slug, content, ...(data as BlogPostFrontmatter) };
    } catch {
      continue;
    }
  }
  return null;
}
