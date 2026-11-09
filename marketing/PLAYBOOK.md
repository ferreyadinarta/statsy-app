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
- Indexing first: homepage was non-indexable for months (307 + canonical loop, then
  a Cloudflare challenge). Always verify 200 / no noindex / right canonical with a
  Googlebot UA before anything else.
- Claims: false claims (custom domain on Free, wrong subscriber limit, missing
  "Monitoring" incident stage) recurred across several posts, quickAnswers and
  table cells in different wording. When fixing one, grep all of `content/blog/`
  and `public/llms.txt` for the feature/stage name, and bundle cheap fixes into
  whatever commit already touches nearby content.
- Length sweep: meta descriptions over 160 chars slipped into old posts because the
  rule was only applied to new ones. Sweep periodically (all OK as of 2026-10-04).
- Query intent: web-search every candidate phrase and read what ranks, even ones
  already in this table. "status page for supabase app" = people checking whether
  Supabase is down (wrong intent). "free status page with custom domain" = several
  competitors give it free, so an honest answer loses. "cheap status page" needs a
  listicle, and our two listicles are the weakest posts. Prefer how-to / explainer
  questions; skip queries where the honest answer undercuts the pitch.
- Cheap wins: a page at position 8-20 with impressions and 0 clicks is worth a
  title/description rewrite before any new post (done for instatus-alternatives).
- Build: `npm run build` fails here on missing Supabase env vars (static export of
  `/login`), unrelated to content. Fall back to `npm run lint` + gray-matter
  frontmatter check, confirm it's the same `/login` error, and note it in the LOG.
  Lint has 8 errors / 7 warnings in untouched app files; don't count those.
- Competitor claims: 2026-10-11 re-verified StatusPage (custom domain on $29 Hobby, free plan exists) and Better Stack (free page, extra $15); Freshstatus removed (unverified). Always fetch the pricing page in the same run.
- Competitor claims age: the "Instatus has no monitoring / no middle tier" claim was false (Instatus Free has 15 monitors, 2-min checks). Re-verify the competitor table rows (Better Stack, Freshstatus, StatusPage, Kuma) on pricing pages before relying on them; don't claim what competitors lack.
- Deploy proof: `/blog/[slug]` returns 200 with a generic noindex fallback while a
  deploy rolls out. Poll for the post's own title before pinging IndexNow.
- Pipeline: session branches can't push to `main`; the "Agent auto-merge" action
  merges `claude/**` pushes (content paths only). Confirm the commit is on
  `origin/main`; if not within 10 min, flag NEEDS FERREY and stop. LOG.md on
  `main` is the only memory between runs. (Runs 09-28..10-02 were lost this way,
  which also blew the 2-posts-per-week cap.)
- 2026-10-05 weekly review: the site gets ~250 impressions / 3 clicks per 28 days,
  and ~half of impressions are the brand query. GSC lags ~3 days and has not yet
  shown the 5 posts published 09-29..10-02 (only how-to-tell-users shows, 1 impr
  at pos 32). Judging them before ~mid-October is premature. Signups: 1 in 28d.

## Next steps (set 2026-11-09, weekly review)
- Cap: max 1 new post per week while data is thin. Last post 11-05; next allowed 11-12.
  15 posts now; volume is not the bottleneck.
- Evidence (GSC 10-10..11-06): 921 impr, 5 clicks, avg pos 24.1, 1 signup (28d, 10-13), 12 users.
  3 of 5 clicks are brand ("statsy", 122 impr, pos 5.4). Only non-brand click: `instatus-alternatives`
  (243 impr, pos 5.2); its query "instatus alternatives" has 194 impr at pos 4.8 and 0 clicks, so the
  title is not winning clicks. Impressions grew ~50% in 4 weeks, clicks did not.
- Page-1/edge: instatus-alternatives (5.2), indie-developers (7.5), uptime-checks (11.7),
  incident-update (11.2, slipped from 5.9), how-to-tell-users (15.3, no gain after 11-01 title rewrite).
  Stuck: statuspage-alternatives (25.8), vs-uptime-monitoring (39), maintenance (57, 213 impr, generic
  queries at pos 75+). Not yet in GSC: side-project, where-to-host, email-notifications, post-incident-review.
- Pattern: narrow how-to posts reach page 1-2 within ~2 weeks; broad-topic posts sit at 50+.
- Test running: 11-09 instatus-alternatives title/description rewrite (see Experiments). Judge ~11-20.
  If still 0 clicks at pos <6 with 250+ impr, stop tweaking: likely AI overview / SERP features, not copy.
- Biggest lever is off-site: links/mentions (X, Indie Hackers, directories). Only Ferrey can do this;
  keep it in NEEDS FERREY every Monday.
- Candidate topics (web-check intent first, avoid competitor claims): "status page for a SaaS with
  paying customers", "what is a status page" explainer angles, "how to write a status page message
  for partial outage". Skip "scheduled maintenance message" head queries (pos 75+, generic).
- Still to verify before reuse: Uptime Kuma / Cachet rows in the alternatives posts (unsourced).

## Experiments
| Started | Hypothesis | Measure | Result |
|---|---|---|---|
| 2026-09-27 | New title/description on `instatus-alternatives.mdx` (was ranking #11.3, 23 impr, 0 clicks) will raise CTR | Clicks/CTR for that page and "instatus alternative(s)" queries in seo-stats | Pending — position 8 (36 impr) as of 2026-10-05, clicks still 0. Position is moving, CTR isn't yet; give it another 1-2 weeks before trying a second description rewrite |
| 2026-09-29 | New post `how-to-tell-users-your-app-is-down.mdx` will rank for that long-tail phrase within a few weeks (no direct competing content found) | Position/impressions for "how to tell users your app is down" and related phrasing in seo-stats byQuery | Pending — not yet showing in byQuery as of 2026-10-02 |
| 2026-09-30 | New post `status-page-for-supabase-app.mdx` will rank for "status page for supabase app" | Position/impressions for "supabase status page" phrasing in seo-stats byQuery | Pending — published 2026-10-02 (merged late). Later runs judged the query's intent wrong ("is Supabase down"); expect weak results, keep as an internal-link target |
| 2026-10-01 | New post `how-to-announce-scheduled-maintenance-to-users.mdx` will rank for that long-tail phrase (top results were generic templates) | Position/impressions for "announce scheduled maintenance" phrasing in seo-stats byQuery | Pending — published 2026-10-02 (merged late), no data yet |
| 2026-10-08 | New post `what-to-write-in-a-status-page-incident-update.mdx` will rank for incident-update wording queries via a worked four-stage timeline | Position/impressions for "incident update" phrasing in byQuery | Pending, published 2026-10-08 |
| 2026-10-09 | New post `how-often-should-uptime-checks-run.mdx` will rank for uptime-interval how-to queries | Position/impressions for "how often should uptime checks run" phrasing | Pending, published 2026-10-09 |
| 2026-11-01 | Title/description rewrite of `how-to-tell-users-your-app-is-down.mdx` (pos 14.5, 50 impr, 0 clicks) leading with the exact query will lift it to page 1 / earn clicks | Position/CTR of that page in byPage | Pending; baseline pos 14.5 |
| 2026-11-09 | Second title/description rewrite of `instatus-alternatives.mdx` ("instatus alternatives" pos 4.8, 194 impr, 0 clicks) to a plainer query-first title | Clicks/CTR on that query and page in byPage | Pending; baseline 243 impr, 1 click, pos 5.2 |
| 2026-10-02 | New post `status-page-vs-uptime-monitoring.mdx` will rank for "status page vs uptime monitoring" / "do I need both" phrasing — competitive query (statuspage.me has a near-identical angle) but matches audience pitch tightly | Position/impressions for those phrases in seo-stats byQuery | Pending — published 2026-10-02, no data yet |

## Target keywords
| Keyword | Post | Last position seen | Checked |
|---|---|---|---|
| statsy (brand) | homepage | 5.4 (122 impr, 3 clicks) | 2026-11-09 |
| instatus alternative | instatus-alternatives | 10.1 (10 impr) | 2026-11-02 |
| instatus alternatives | instatus-alternatives | 4.8 (194 impr, 0 clicks) | 2026-11-09 |
| (page-level) instatus-alternatives | instatus-alternatives | 5.6 (82 impr, 1 click) | 2026-11-02 |
| statuspage alternative | statuspage-alternatives | 26.5 page-level (43 impr) | 2026-11-02 |
| statuspage alternatives | statuspage-alternatives | 50.3 | 2026-10-02 |
| statuspage.io alternatives | statuspage-alternatives | 30.8 | 2026-09-29 |
| alternative to statuspage io | statuspage-alternatives | 40.8 | 2026-09-29 |
| statuspage cost | statuspage-alternatives | 3 | 2026-09-29 |
| cheap status page | (none — needs a listicle, deprioritized) | 60.4 | 2026-09-29 |
| how to tell users your app is down | how-to-tell-users-your-app-is-down | page-level 14 (52 impr, 0 clicks) | 2026-11-02 |
| how to announce scheduled maintenance to users | how-to-announce-scheduled-maintenance-to-users | page-level 52.4 (147 impr) | 2026-11-02 |
| status page vs uptime monitoring | status-page-vs-uptime-monitoring | page-level 44.1 (66 impr) | 2026-11-02 |
| what to write in a status page incident update | what-to-write-in-a-status-page-incident-update | page-level 5.9 (40 impr) | 2026-11-02 |
| what services to list on a status page | what-services-to-list-on-your-status-page | not yet indexed (published 2026-10-22) | 2026-10-22 |
| where to host your status page | where-to-host-your-status-page | not yet indexed (published 2026-10-29) | 2026-10-29 |
| status page for supabase app | status-page-for-supabase-app (exists; query deprioritized, wrong intent) | not yet indexed | 2026-10-02 |
| how often should uptime checks run | how-often-should-uptime-checks-run | page-level 11.1 (15 impr) | 2026-11-02 |
| post-incident review template for small teams | post-incident-review-template-for-small-teams | not yet indexed (published 2026-10-17) | 2026-10-17 |
| status page email notifications | status-page-email-notifications | not yet indexed (live, IndexNow pinged 10-16) | 2026-10-16 |
| statuspage custom domain alternatives | statuspage-alternatives | 10 (1 impr) | 2026-10-12 |
