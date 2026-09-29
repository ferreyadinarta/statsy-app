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
- 2026-09-27: `/api/internal/seo-stats` now returns 200 — the 401 from
  2026-09-26 was transient/fixed on Ferrey's side. Real GSC + signup data is
  usable now. 28d totals as of this run: 2 clicks, 235 impressions, avg
  position 15.1, 0 signups since 2026-08-30 (10 total users).
- 2026-09-27: Two posts had meta descriptions over the 160-char limit the
  blog-post rules require (`instatus-alternatives.mdx` at 165,
  `status-page-for-indie-developers.mdx` at 169) despite passing earlier
  review — the rule was never checked against existing posts, only applied
  to new ones. Worth a periodic length sweep across all posts, not just new
  ones.
- 2026-09-27: A page ranking at position 8-20 with impressions but 0 clicks
  is a real, cheap win: rewriting the title/description to be more specific
  and benefit-forward (added the alternative count + "Free & Paid" to
  `instatus-alternatives.mdx`, was previously a generic description) costs
  minutes vs. hours for a new post. Check this before writing new content
  whenever seo-stats data is available.
- 2026-09-29: A PLAYBOOK "next target" keyword can still be the wrong shape
  for a comparison-style post — "cheap status page" reads like it needs a
  listicle, but the two existing listicles (Statuspage/Instatus alternatives)
  are the weakest-ranking posts on the site. Before writing, check whether
  the query's top results (and the post type needed to compete) are listicles
  or how-tos, not just its position/competition. Picked a different PLAYBOOK
  example ("how to tell users your app is down") instead, which fit the
  how-to shape.
- 2026-09-29: Found a factual gap while writing unrelated content, not during
  a dedicated fix pass: `status-page-for-indie-developers.mdx`'s incident
  template only had 3 stages, missing "monitoring" (product has 4, per
  `src/lib/email.ts`). Cheap fixes like this are worth bundling into whatever
  commit is already touching nearby content instead of waiting for a
  dedicated content-fix day.

## Experiments
| Started | Hypothesis | Measure | Result |
|---|---|---|---|
| 2026-09-27 | New title/description on `instatus-alternatives.mdx` (was ranking #11.3, 23 impr, 0 clicks) will raise CTR | Clicks/CTR for that page and "instatus alternative(s)" queries in seo-stats | Pending — check in ~1-2 weeks once GSC data catches up (2026-09-29: still 23 impr/0 clicks, only 2 days in, too early) |
| 2026-09-29 | New post `how-to-tell-users-your-app-is-down.mdx` will rank for that long-tail phrase within a few weeks (no direct competing content found) | Position/impressions for "how to tell users your app is down" and related phrasing in seo-stats byQuery | Pending — new post, no data yet |

## Target keywords
| Keyword | Post | Last position seen | Checked |
|---|---|---|---|
| statsy (brand) | homepage | 7 | 2026-09-29 |
| instatus alternative | instatus-alternatives | 9.9 | 2026-09-29 |
| instatus alternatives | instatus-alternatives | 15 | 2026-09-29 |
| statuspage alternative | statuspage-alternatives | 61.8 | 2026-09-29 |
| statuspage alternatives | statuspage-alternatives | 52.5 | 2026-09-29 |
| statuspage.io alternatives | statuspage-alternatives | 30.8 | 2026-09-29 |
| alternative to statuspage io | statuspage-alternatives | 40.8 | 2026-09-29 |
| statuspage cost | statuspage-alternatives | 3 | 2026-09-29 |
| cheap status page | (none — needs a listicle, deprioritized) | 60.4 | 2026-09-29 |
| how to tell users your app is down | how-to-tell-users-your-app-is-down | not yet indexed | 2026-09-29 |
