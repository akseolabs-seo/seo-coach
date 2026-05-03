# Regular Website SEO Stress Test — 2026-04-28

Purpose: rebalance `seo-coach` toward the user's actual use case: regular website SEO. Local SEO remains a branch, but generic prompts about websites, traffic, rankings, CMS, pages, content, products, services, or Search Console should default to website SEO.

Method:
- Simulated 24 beginner prompts for normal websites.
- Checked whether AK starts with one practical website SEO check rather than jumping to Google Maps / GBP / NAP.
- Promoted the highest-risk regular website beginner cases into `evals.json`.

## Scenario Matrix

| # | Beginner scenario | Expected behavior | Action |
|---|---|---|---|
| 1 | Company website, wants Google to see it | Start with `site:` / indexing / sitemap | Added eval |
| 2 | Has URL, asks where to start | Lightweight website 5-minute check | Added eval |
| 3 | Service business website has no leads | Check whether important service page exists | Added eval |
| 4 | Ranking is bad, user does not know first fix | Check homepage title / page clarity | Added eval |
| 5 | GSC has impressions but no clicks | Ask for one query/page row, classify before fixes | Added eval |
| 6 | WordPress user installed Yoast | Explain plugin is tool, check real output | Added eval |
| 7 | Sitemap is missing | Explain not fatal; ask CMS/platform or sitemap URL | Covered by existing playbook |
| 8 | `site:` returns zero results | Explain possible causes; one indexing check | Covered by existing playbook |
| 9 | robots.txt looks confusing | Explain one line; avoid lecture | Covered by existing evals |
| 10 | Homepage title is "Home" | Teach title clarity; one rewrite direction | Covered by playbook |
| 11 | All services are only on homepage | Ask for one priority service page | Added eval |
| 12 | Blog posts get no traffic | Check one post's query intent/title, not full content audit | Covered by website guidance |
| 13 | Ecommerce product pages not ranking | Start with one category/product page, not whole store roadmap | Covered by scope boundary |
| 14 | Shopify beginner | Start with one collection/product title or index check | Covered by website route |
| 15 | Wix/Squarespace beginner | Start with page title/indexing, not tool stack | Covered by website route |
| 16 | User wants backlinks first | Redirect to index/page clarity before links | Covered by references |
| 17 | User asks if meta description ranks | Direct quick answer, then one page check | Covered by quick-answer eval |
| 18 | User asks why competitor ranks | Avoid full competitor strategy; ask one target query/page | Covered by boundary |
| 19 | User says "traffic dropped" | Full coaching if ongoing; one evidence item first | Covered by scenario references |
| 20 | User has no GSC | Do not block; start with visible checks | Covered by playbook |
| 21 | User has GSC but no GA4 | Use GSC first; do not require GA4 | Covered by integration guidance |
| 22 | User asks for full audit report | Boundary; offer one coached check | Covered by existing eval |
| 23 | User mentions Google Maps explicitly | Route to Local SEO | Local branch retained |
| 24 | User has only IG/Facebook | Route to GBP if local, otherwise explain need for website/searchable base | Local/social branch retained |

## Rebalance Decision

Default to regular website SEO when the user says:
- website
- ranking / traffic
- article / blog
- service page / product page / category page
- WordPress / Shopify / CMS
- Google Search Console
- sitemap / robots.txt / title / meta / canonical

Route to Local SEO only when the user says:
- Google Maps / 地圖
- nearby customers / 附近客人
- physical storefront / 實體店
- service-area business / 到府服務
- Google Business Profile / GBP / Google 商家檔案
- Local Pack / NAP / reviews in a map-discovery context

## Changes Promoted To Evals

- `regular-website-beginner-site-index-first`
- `regular-website-url-lightweight-first`
- `regular-website-service-page-exists`
- `regular-website-homepage-title-first`
- `regular-website-gsc-impressions-no-clicks`
- `regular-website-seo-plugin-not-enough`

## Decision

Keep Local SEO support, but make it conditional. The main beginner path is regular website SEO: can Google find it, can Google index it, can Google understand the page, and does a specific page exist for the thing the user wants to rank for?
