# Marketing Log

Newest entry first. One entry per run: date, health check, what was done, why,
what to check next time. Keep entries short.

## 2026-09-27 — daily run
- Health: OK. Homepage, /blog, /sitemap.xml, /robots.txt, and every sitemap URL
  (/demo, both alternatives posts, indie-developers post, free-status-page
  post) returned 200 for Googlebot UA, no noindex, correct canonicals, no
  cf-mitigated header.
- SEO stats: `/api/internal/seo-stats` returned 200 this time (the 401 from
  yesterday is resolved). 28-day totals (2026-08-28 to 2026-09-24): 2 clicks,
  235 impressions, avg position 15.1, CTR 0.9%. Signups: 0 since 2026-08-30
  (10 total users, no signups/status pages created in the window).
  Query/page highlights: "statsy" (brand) at position 7, 128 impressions.
  `instatus-alternatives` page at position 11.3 with 23 impressions and 0
  clicks — squarely in the "ranking okay, nobody clicks" zone the playbook
  flags as the best cheap fix. `statuspage-alternatives` page is worse
  (position 45.2, 44 impressions) — needs content/backlink work, not just a
  title tweak, so left for another day.
- Did: rewrote title + meta description of `content/blog/instatus-alternatives.mdx`
  ("The Best Instatus Alternatives in 2026" → "6 Best Instatus Alternatives
  in 2026 (Free & Paid)"; description now names the specific alternatives
  compared instead of a generic teaser) to raise CTR at its current position.
  While checking description lengths across all 4 posts I found two over the
  160-char limit from the blog rules: the instatus one (165 chars, now fixed
  as part of the rewrite, 157) and `status-page-for-indie-developers.mdx`
  (169 chars) — trimmed the latter to 147 chars, no wording/claim changes.
- Why: seo-stats step (2b) explicitly flags "impressions but low CTR or
  position 8–20" pages as the best target, and this is the first run with
  working real data. `instatus-alternatives` was the clearest case.
- Build: `npm run build` fails on this repo regardless of my change (same
  known missing-Supabase-env break on static export of /login, confirmed
  identical error to prior runs). Ran `npm run lint` instead — 8 pre-existing
  errors / 7 warnings, all in untouched app files (dashboard client, public
  status page client, layout.tsx, SubscribeButton/Form, use-toast). Verified
  all 4 posts' frontmatter parses with gray-matter (all OK).
- Result/observation: changes deployed and verified live (curl'd the new
  title/description on both changed posts, correct text present, still 200
  and no noindex). Pinged IndexNow for the 2 changed URLs.
- Next: give the instatus-alternatives CTR change 1-2 weeks (GSC lags ~3
  days) before judging it — logged as an experiment in PLAYBOOK. Meanwhile
  `statuspage-alternatives` (position 45.2, decent impressions) is the next
  target: it likely needs a content/internal-link improvement rather than a
  title change. No new blog post today (2 of the last 7 days still have
  room per the 2-per-week cap) — consider one next run targeting "cheap
  status page" (position 74.7, low competition, matches Statsy's free tier)
  or similar long-tail terms from the updated PLAYBOOK target list.
- NEEDS FERREY: none today.

## 2026-09-26 — daily run
- Health: OK. Homepage, /blog, /sitemap.xml, /robots.txt, and every sitemap URL
  returned 200 for Googlebot UA, no noindex, correct canonicals, no cf-mitigated.
- SEO stats: `/api/internal/seo-stats` returned 401 unauthorized even though
  $SEO_STATS_TOKEN was set. Couldn't pull GSC/signup numbers this run.
- Did: fixed the false claims flagged in the setup entry, plus one more found by
  grepping all posts for "custom domain":
  - `content/blog/statuspage-alternatives.mdx` and
    `content/blog/instatus-alternatives.mdx` both claimed (in the quickAnswer
    and/or a comparison table) that Statsy's free plan includes a custom
    domain. It doesn't — custom domain is Pro-only ($15/mo) per FACTS.md and
    `src/lib/plan-shared.ts`. Rewrote the quickAnswer and table cells in both
    posts to say Pro-only.
  - `public/llms.txt`: free plan subscriber limit said 10, actual is 50;
    "Marketing landing" linked to landing.statsy.page (dead/wrong host);
    removed an unreleased "Business ($39/mo, coming soon)" plan that isn't in
    FACTS.md and shouldn't be claimed as an offer.
- Why: known-issues cleanup from the setup entry, plus false claims are the
  highest-priority fix per PLAYBOOK (accuracy vs FACTS.md before new content).
- Build: `npm run build` fails on this repo regardless of my change (missing
  Supabase env vars break static export of /login) — confirmed unrelated to
  the diff. Ran `npm run lint` instead (pre-existing errors only, all in
  untouched app files) and verified all 4 blog posts' frontmatter parses with
  gray-matter (all OK).
- Result/observation: changes deployed and verified live (curl'd the new
  llms.txt and both posts, correct text present). Pinged IndexNow for the 3
  changed URLs, got 200.
- Next: get the seo-stats 401 sorted out (see NEEDS FERREY) so future runs can
  use real GSC/signup data to pick targets. No new blog post today — none of
  the last 7 days have one yet, so tomorrow's run has room for one; check
  PLAYBOOK long-tail list first.
- NEEDS FERREY: `/api/internal/seo-stats` returns 401 with $SEO_STATS_TOKEN
  set in this environment — token may be missing/wrong on the deployed env,
  or expired. Please check.

## 2026-09-26 — setup (by Ferrey + Claude)
- Fixed homepage indexing: statsy.page now serves the landing page directly
  (public/landing/), sitemap cleaned to 7 URLs, submitted to Google Search Console.
- Submitted Statsy to ivbeg/awesome-status-pages (PR open).
- Known issues for the agent to fix: blog `statuspage-alternatives.mdx` claims custom
  domain on Free; `public/llms.txt` says 10 free subscribers (actual 50) and links to
  landing.statsy.page instead of statsy.page.
- Next: start daily runs.
