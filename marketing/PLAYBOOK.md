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

## Next steps (set 2026-10-05)
- Posts cap: none new until 2026-10-08 (4 posts landed 09-29..10-02). Then at most 1-2/wk.
- Wait for GSC to show the new posts before judging them; re-check ~2026-10-12.
- If instatus-alternatives still has 0 clicks around 2026-10-12, try one more
  title rewrite. Brand query is the main traffic source; ask Ferrey for off-site
  links/mentions (X, Indie Hackers, directories), since a new domain can't rank on
  content alone.
- Candidate how-to topics (verify intent by web search first): "what to write in a
  status page incident update", "status page for a SaaS with paying customers",
  "how often should uptime checks run".
- Intent checked 2026-10-07: "what to write in a status page incident update" is
  a how-to/template intent, but top results are Better Stack, Hosted Graphite,
  Cronitor (DEV), OneUptime: copy-paste templates. Win by using Statsy's four
  real stages (investigating / identified / monitoring / resolved) with a full
  worked timeline and "when is the next update" wording. Don't link to
  competitors without re-checking. "how often should uptime checks run" is
  answered by vendor FAQs (UptimeRobot, Oh Dear, PingPing); common advice is
  1-2 min for SaaS, 5 min for brochure sites. Fits Statsy (5 min Free / 1 min Pro,
  2 consecutive failures before down). Preferred first pick for 10-08: incident
  update post (closest to the existing how-to-tell-users post; link both ways).

## Experiments
| Started | Hypothesis | Measure | Result |
|---|---|---|---|
| 2026-09-27 | New title/description on `instatus-alternatives.mdx` (was ranking #11.3, 23 impr, 0 clicks) will raise CTR | Clicks/CTR for that page and "instatus alternative(s)" queries in seo-stats | Pending — position 8 (36 impr) as of 2026-10-05, clicks still 0. Position is moving, CTR isn't yet; give it another 1-2 weeks before trying a second description rewrite |
| 2026-09-29 | New post `how-to-tell-users-your-app-is-down.mdx` will rank for that long-tail phrase within a few weeks (no direct competing content found) | Position/impressions for "how to tell users your app is down" and related phrasing in seo-stats byQuery | Pending — not yet showing in byQuery as of 2026-10-02 |
| 2026-09-30 | New post `status-page-for-supabase-app.mdx` will rank for "status page for supabase app" | Position/impressions for "supabase status page" phrasing in seo-stats byQuery | Pending — published 2026-10-02 (merged late). Later runs judged the query's intent wrong ("is Supabase down"); expect weak results, keep as an internal-link target |
| 2026-10-01 | New post `how-to-announce-scheduled-maintenance-to-users.mdx` will rank for that long-tail phrase (top results were generic templates) | Position/impressions for "announce scheduled maintenance" phrasing in seo-stats byQuery | Pending — published 2026-10-02 (merged late), no data yet |
| 2026-10-08 | New post `what-to-write-in-a-status-page-incident-update.mdx` will rank for incident-update wording queries via a worked four-stage timeline | Position/impressions for "incident update" phrasing in byQuery | Pending, published 2026-10-08 |
| 2026-10-02 | New post `status-page-vs-uptime-monitoring.mdx` will rank for "status page vs uptime monitoring" / "do I need both" phrasing — competitive query (statuspage.me has a near-identical angle) but matches audience pitch tightly | Position/impressions for those phrases in seo-stats byQuery | Pending — published 2026-10-02, no data yet |

## Target keywords
| Keyword | Post | Last position seen | Checked |
|---|---|---|---|
| statsy (brand) | homepage | 6.7 | 2026-10-05 |
| instatus alternative | instatus-alternatives | 10.8 | 2026-10-05 |
| instatus alternatives | instatus-alternatives | 15 | 2026-09-29 |
| (page-level) instatus-alternatives | instatus-alternatives | 8 (36 impr, 0 clicks) | 2026-10-05 |
| statuspage alternative | statuspage-alternatives | 61 | 2026-10-05 |
| statuspage alternatives | statuspage-alternatives | 50.3 | 2026-10-02 |
| statuspage.io alternatives | statuspage-alternatives | 30.8 | 2026-09-29 |
| alternative to statuspage io | statuspage-alternatives | 40.8 | 2026-09-29 |
| statuspage cost | statuspage-alternatives | 3 | 2026-09-29 |
| cheap status page | (none — needs a listicle, deprioritized) | 60.4 | 2026-09-29 |
| how to tell users your app is down | how-to-tell-users-your-app-is-down | page seen at 32 (1 impr) | 2026-10-05 |
| how to announce scheduled maintenance to users | how-to-announce-scheduled-maintenance-to-users | not yet indexed | 2026-10-02 |
| status page vs uptime monitoring | status-page-vs-uptime-monitoring | not yet indexed | 2026-10-02 |
| what to write in a status page incident update | what-to-write-in-a-status-page-incident-update | not yet indexed | 2026-10-08 |
| status page for supabase app | status-page-for-supabase-app (exists; query deprioritized, wrong intent) | not yet indexed | 2026-10-02 |
