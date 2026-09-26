# Statsy Facts (source of truth)

Every public claim about Statsy (blog, llms.txt, metadata) must match this file.
If the code disagrees with this file, the code wins: fix this file and log it.
Plan limits live in `src/lib/plan-shared.ts`; pricing copy lives in `public/landing/index.html`.

## Product
- Status page SaaS for indie developers and small teams. Live at https://statsy.page
- Built and run solo by Ferrey Adinarta (@Ferrey435491 on X)
- Stack: Next.js on Vercel, Supabase, Paddle billing, Resend email

## Plans
| | Free ($0, forever) | Pro ($15/mo) |
|---|---|---|
| Status pages | 1 | 3 |
| Services per page | 3 | 10 |
| Email subscribers | 50 | 500 |
| Incident history | 7 days | 90 days |
| Monitoring interval | every 5 min | every 1 min, custom per service |
| Domain | Statsy subdomain only (`slug.statsy.page`) | Custom domain |
| Embeddable status badge | No | Yes |
| Statsy branding | Shown | Removable |

- No credit card required for Free.
- A "Business" plan is NOT available. Do not mention it as a current offer.

## Features (all plans unless noted)
- Automated URL monitoring: 5s timeout; 2 consecutive failures before a service is marked down; 2xx slower than 3s (twice) = degraded; 401/403 count as up
- Services: operational / degraded / outage
- Incidents with timeline updates: investigating / identified / monitoring / resolved
- Scheduled maintenance windows
- Email alerts to the owner and subscribers, only on status change
- Live-updating public page
- Embeddable badge (iframe) + public JSON badge API — Pro only

## Never claim
- Custom domain or badge on the Free plan
- SMS, Slack, webhook, or on-call alerts (not built)
- Customer counts, uptime SLAs, or testimonials that aren't in this file
- Anything about a competitor without a source URL checked in the same run
