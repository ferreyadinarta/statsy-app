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
- Examples of the right size: "how to tell users your app is down", "how to
  announce scheduled maintenance to users". Rejected after checking intent:
  "status page for supabase app" and "free status page with custom domain"
  (see Known lessons).
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
- 2026-09-30: A 200 from curl is NOT proof a new post is live. `/blog/[slug]`
  calls `notFound()` for unknown slugs and the fallback renders with a 200
  (generic title, no canonical, noindex) while a deploy is rolling out. Poll
  for a string unique to the new post (its title) before pinging IndexNow.
- 2026-10-01: When a bug is "a template lists N stages instead of N+1", grep
  the stage names themselves (Investigating/Identified/Resolved) across all of
  `content/blog/`. The missing "Monitoring" stage was in two posts, not one.
- 2026-10-02: The PLAYBOOK example "status page for supabase app" doesn't
  actually have the search intent it looks like it has — every top result
  is an "is Supabase down" outage-aggregator page. People typing that phrase
  want to know if Supabase itself is down, not how to add a status page to
  their own Supabase-backed app. Deprioritized; don't resurrect without
  checking intent again. General lesson: web-search every candidate phrase
  and read what actually ranks before writing, even one that's already
  sitting in this table — a keyword can look right and still have the wrong
  intent.
- 2026-10-02: "free status page with custom domain" is a bad target even
  though it matches Statsy's audience — several real competitors (Pulsetic,
  OneUptime, UptimeSignal) genuinely give free custom domains, so a page
  that has to honestly say "ours is Pro-only" is competing to lose on that
  exact query. Skip queries where the honest answer undercuts the pitch;
  look for the adjacent question instead (e.g. "do I need a custom domain at
  all" works, "is there a free one" doesn't).
- 2026-10-02: Runs on 09-28, 09-30, 10-01 and 10-02 could only push to their
  own `claude/...` session branch, so their posts never deployed and every
  later run read a stale LOG from `main`. Result: missing history, and 4 new
  posts in 4 days against the 2-per-week cap. Branches were merged into
  `main` by hand on 2026-10-02. Since then the "Agent auto-merge" GitHub
  Action merges each `claude/**` push into `main`. Always confirm your commit
  reached `origin/main`; if it didn't within 10 minutes, flag NEEDS FERREY and
  stop. LOG.md on `main` is the only memory between runs.

## Experiments
| Started | Hypothesis | Measure | Result |
|---|---|---|---|
| 2026-09-27 | New title/description on `instatus-alternatives.mdx` (was ranking #11.3, 23 impr, 0 clicks) will raise CTR | Clicks/CTR for that page and "instatus alternative(s)" queries in seo-stats | Pending — position improved to 8 (27 impr) by 2026-10-02, but clicks still 0. Position is moving, CTR isn't yet; give it another 1-2 weeks before trying a second description rewrite |
| 2026-09-29 | New post `how-to-tell-users-your-app-is-down.mdx` will rank for that long-tail phrase within a few weeks (no direct competing content found) | Position/impressions for "how to tell users your app is down" and related phrasing in seo-stats byQuery | Pending — not yet showing in byQuery as of 2026-10-02 |
| 2026-09-30 | New post `status-page-for-supabase-app.mdx` will rank for "status page for supabase app" | Position/impressions for "supabase status page" phrasing in seo-stats byQuery | Pending — published 2026-10-02 (merged late). Later runs judged the query's intent wrong ("is Supabase down"); expect weak results, keep as an internal-link target |
| 2026-10-01 | New post `how-to-announce-scheduled-maintenance-to-users.mdx` will rank for that long-tail phrase (top results were generic templates) | Position/impressions for "announce scheduled maintenance" phrasing in seo-stats byQuery | Pending — published 2026-10-02 (merged late), no data yet |
| 2026-10-02 | New post `status-page-vs-uptime-monitoring.mdx` will rank for "status page vs uptime monitoring" / "do I need both" phrasing — competitive query (statuspage.me has a near-identical angle) but matches audience pitch tightly | Position/impressions for those phrases in seo-stats byQuery | Pending — published 2026-10-02, no data yet |

## Target keywords
| Keyword | Post | Last position seen | Checked |
|---|---|---|---|
| statsy (brand) | homepage | 6.9 | 2026-10-02 |
| instatus alternative | instatus-alternatives | 9.9 | 2026-09-29 |
| instatus alternatives | instatus-alternatives | 15 | 2026-09-29 |
| (page-level) instatus-alternatives | instatus-alternatives | 8 | 2026-10-02 |
| statuspage alternative | statuspage-alternatives | 61 | 2026-10-02 |
| statuspage alternatives | statuspage-alternatives | 50.3 | 2026-10-02 |
| statuspage.io alternatives | statuspage-alternatives | 30.8 | 2026-09-29 |
| alternative to statuspage io | statuspage-alternatives | 40.8 | 2026-09-29 |
| statuspage cost | statuspage-alternatives | 3 | 2026-09-29 |
| cheap status page | (none — needs a listicle, deprioritized) | 60.4 | 2026-09-29 |
| how to tell users your app is down | how-to-tell-users-your-app-is-down | not yet indexed | 2026-09-29 |
| how to announce scheduled maintenance to users | how-to-announce-scheduled-maintenance-to-users | not yet indexed | 2026-10-02 |
| status page vs uptime monitoring | status-page-vs-uptime-monitoring | not yet indexed | 2026-10-02 |
| status page for supabase app | status-page-for-supabase-app (exists; query deprioritized, wrong intent) | not yet indexed | 2026-10-02 |
