# Marketing Log

Newest entry first. One entry per run: date, health check, what was done, why,
what to check next time. Keep entries short.

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
