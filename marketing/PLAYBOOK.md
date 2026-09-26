# Statsy Marketing Playbook

What has worked, what hasn't, and the current strategy. The daily agent reads this
first and rewrites it during the weekly review. Keep it under ~150 lines: merge,
don't append forever.

## Goal
More people finding statsy.page through search (Google, Bing, AI answers) and signing up.

## Audience
Indie hackers and small SaaS teams with paying users but no status page.
Pitch angle: paying users deserve uptime transparency; a status page cuts support
emails and churn during outages.

## Strategy (current)
- New domain with little authority: target specific, low-competition searches
  (long-tail), not head terms like "status page".
- Examples of the right size: "status page for supabase app", "how to tell users
  your app is down", "free status page with custom domain" (answer honestly: Pro).
- Each post answers one question fully, includes a quickAnswer, links to 1–2 other
  Statsy posts, and ends with a soft CTA to /signup.

## Known lessons
- 2026-09-26: Homepage was not indexable for months (307 redirect + canonical loop,
  then a Cloudflare challenge blocking Googlebot). Always verify the homepage returns
  200 with no noindex for a Googlebot user agent before anything else.
- 2026-09-26: Existing content contained false claims (custom domain on Free,
  wrong subscriber limit in llms.txt). Check every claim against FACTS.md.
- Comparison posts (Statuspage / Instatus alternatives) exist; a new domain is
  unlikely to rank for them soon. Prefer long-tail how-to posts.
- 2026-09-26: A false claim about one feature (e.g. "custom domain on Free")
  tends to appear in more than one post's quickAnswer AND in a comparison
  table cell, worded differently each time. When fixing a known false claim,
  grep the whole `content/blog/` dir for the feature name, not just the one
  file that was flagged.
- 2026-09-26: `npm run build` fails in this environment on unrelated grounds
  (missing Supabase env vars break static export of `/login`), independent of
  content changes. Don't treat that as a build break caused by your diff —
  fall back to `npm run lint` + gray-matter frontmatter check as the
  instructions say, and confirm the failure is the same `/login` Supabase
  error before moving on.
- 2026-09-26: `/api/internal/seo-stats` returned 401 even with
  $SEO_STATS_TOKEN set — flagged for Ferrey, not yet usable for picking
  targets by real data.

## Experiments
| Started | Hypothesis | Measure | Result |
|---|---|---|---|

## Target keywords
| Keyword | Post | Last position seen | Checked |
|---|---|---|---|
