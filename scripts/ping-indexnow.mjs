#!/usr/bin/env node
// Ping IndexNow with URLs to notify Bing/Yandex/DuckDuckGo/etc. of new or updated content.
// Usage:
//   node scripts/ping-indexnow.mjs <url> [<url> ...]
//   node scripts/ping-indexnow.mjs https://statsy.page/blog/my-new-post
//
// To ping every blog post + index + sitemap:
//   node scripts/ping-indexnow.mjs --all

import fs from "fs/promises";
import path from "path";

const KEY = "43dda505bc72cf48baa3fe644c35394f";
const HOST = "statsy.page";
const KEY_LOCATION = `https://${HOST}/${KEY}.txt`;
const ENDPOINT = "https://api.indexnow.org/indexnow";

async function getAllBlogUrls() {
  const blogDir = path.join(process.cwd(), "content", "blog");
  const files = await fs.readdir(blogDir);
  const slugs = files
    .filter((f) => f.endsWith(".mdx") || f.endsWith(".md"))
    .map((f) => f.replace(/\.(mdx?|md)$/, ""));
  return [
    `https://${HOST}/`,
    `https://${HOST}/blog`,
    ...slugs.map((s) => `https://${HOST}/blog/${s}`),
  ];
}

async function ping(urlList) {
  if (urlList.length === 0) {
    console.error("No URLs to ping.");
    process.exit(1);
  }

  const body = { host: HOST, key: KEY, keyLocation: KEY_LOCATION, urlList };
  console.log(`Pinging IndexNow with ${urlList.length} URL(s):`);
  urlList.forEach((u) => console.log(`  - ${u}`));

  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (res.status === 200 || res.status === 202) {
    console.log(`\nSuccess (${res.status}). Bing/Yandex/etc. will crawl soon.`);
  } else {
    const text = await res.text().catch(() => "");
    console.error(`\nFailed: ${res.status} ${res.statusText}`);
    if (text) console.error(text);
    process.exit(1);
  }
}

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error("Usage: node scripts/ping-indexnow.mjs <url> [<url> ...]");
  console.error("       node scripts/ping-indexnow.mjs --all");
  process.exit(1);
}

if (args[0] === "--all") {
  const urls = await getAllBlogUrls();
  await ping(urls);
} else {
  await ping(args);
}
