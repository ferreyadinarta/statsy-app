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

## Experiments
| Started | Hypothesis | Measure | Result |
|---|---|---|---|

## Target keywords
| Keyword | Post | Last position seen | Checked |
|---|---|---|---|
