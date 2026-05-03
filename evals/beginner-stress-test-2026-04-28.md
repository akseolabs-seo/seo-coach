# Beginner Stress Test — 2026-04-28

Purpose: pressure-test `seo-coach` against realistic beginner conversations without changing the intended product boundary. This skill is intentionally a coaching/framing system, not a full consultant roadmap engine for high-competition ecommerce, large content sites, or deep technical SEO.

2026-04-28 update: Local / Google Maps cases from this pass were useful for safety, but they overrepresented a service area the user does not provide. The dedicated Local evals were demoted out of the primary eval set before 1.0.0 release. Local guidance remains only as a low-priority exception branch.

Method:
- Simulated 26 first-turn or early-session beginner prompts.
- Checked whether AK keeps one next step, avoids tool overload, routes local businesses correctly, and preserves scope boundaries.
- Converted the highest-risk uncovered failures into durable evals in `evals.json`.

## Scenario Matrix

| # | Beginner scenario | Expected behavior | Result before hardening | Action |
|---|---|---|---|---|
| 1 | Completely new, no URL | Ask whether user has website, GBP, or neither | Covered | Existing eval kept |
| 2 | Has website, no SEO knowledge | Lightweight 5-minute check, no full onboarding | Covered | Existing eval kept |
| 3 | Local cafe wants Google Maps | GBP/NAP first, not sitemap/GSC | Covered | Existing eval kept |
| 4 | Only IG/Facebook, no website | Do not block; route to GBP if local | Weak | Added playbook + eval |
| 5 | No website and no GBP | Explain SEO needs a searchable home base; pick website or GBP | Covered | No change |
| 6 | Service-area business with no storefront | Do not force public address; check service area in GBP | Missing | Added local guidance + eval |
| 7 | Home-based business afraid to reveal address | Protect privacy; use service-area framing | Missing | Covered by service-area eval |
| 8 | Restaurant has wrong phone on Maps | One NAP correction step | Covered | No change |
| 9 | Moved address recently | Check GBP, website, social NAP consistency first | Covered | No change |
| 10 | Multiple locations | Flag as advanced local SEO; start with one branch | Covered in local boundary | No change |
| 11 | User sees PageSpeed score 42 and panics | De-escalate; do not chase 100; ask for one evidence item | Weak | Added panic layer + eval |
| 12 | GSC shows many red errors | Avoid penalty overclaim; ask for one warning message | Weak | Added panic layer + eval |
| 13 | `site:` shows zero results | Explain possibilities; one next check | Covered | No change |
| 14 | Sitemap returns 404 | Not disaster; ask CMS/platform or generate sitemap | Covered | No change |
| 15 | robots.txt looks scary | Explain one line only; avoid full lecture | Covered | No change |
| 16 | User says "I don't know, you look" | Socratic rescue, one easier question | Covered | Existing eval kept |
| 17 | User asks "canonical 是什麼" | Direct quick answer, no onboarding | Covered | Existing eval kept |
| 18 | User asks if SEO plugin is enough | Explain plugin is helper, not SEO itself; one check | Acceptable | No change |
| 19 | Shopify beginner | One store-level check; do not force crawler tools | Acceptable | No change |
| 20 | WordPress bakery beginner | Lightweight first; no full onboarding | Covered | Existing eval kept |
| 21 | User asks for full audit report | Boundary; offer one coached check | Covered | No change |
| 22 | User asks for complete ecommerce roadmap | Maintain intentional scope; one safe next step | Weak framing | Added scope eval |
| 23 | User wants "rank #1 fast" | No guarantee; pick one basic check | Covered by boundaries | No change |
| 24 | Competitor has fake reviews | Do not suggest retaliation; discuss reporting and real review collection | Acceptable | No change |
| 25 | Clinic / medical local SEO | Keep local basics; avoid medical advice/YMYL promises | Acceptable | No change |
| 26 | Repeated screenshot friction | Suggest GSC/GA4/MCP only after repeated need or long-term coaching | Covered | Existing integration guidance kept |

## Failure Themes Found

1. Social-only local businesses needed a clearer path. A beginner with only Instagram/Facebook should not be told to start with technical website SEO.
2. Service-area businesses needed privacy-safe guidance. The coach should not accidentally imply every local business needs a public storefront address.
3. Tool panic needed a de-escalation protocol. Beginners often interpret PageSpeed/GSC red warnings as catastrophic.
4. The intended advanced-scope boundary needed to be protected in evals. High-competition ecommerce/content/technical SEO is intentionally framing-only here, not a defect.

## Changes Originally Promoted To Evals

- `beginner-social-only-local-business`
- `service-area-business-no-public-address`
- `beginner-panic-pagespeed-score`
- `beginner-gsc-warning-one-evidence`
- `advanced-scope-intentional-boundary`

Current primary eval status:
- Kept: `beginner-panic-pagespeed-score`, `beginner-gsc-warning-one-evidence`, `advanced-scope-intentional-boundary`
- Demoted before 1.0.0 release: `local-business-beginner-gbp-first`, `beginner-social-only-local-business`, `service-area-business-no-public-address`

## Decision

Keep the skill positioned as beginner/local/small-brand SEO coaching. Do not expand it into consultant-grade strategy generation. The hardening work should make AK calmer, safer, and more useful for first-time users without cannibalizing higher-tier SEO services.
